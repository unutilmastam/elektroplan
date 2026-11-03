import { describe, expect, it } from 'vitest';
import { signedArea } from '@/domain/geometry';
import { createEmptyProject } from '@/domain/project';
import { reconcile } from '@/domain/topology';
import type { ElectricalPoint, Project, Room, Vec2 } from '@/domain/types';
import { deleteWalls, moveWall, splitWall } from '@/domain/wallEdits';

const NOW = '2026-11-03T00:00:00.000Z';
let n = 0;
const makeId = () => `id${++n}`;
const opts = { makeId, now: NOW };
const v = (x: number, y: number): Vec2 => ({ x, y });
const room = (id: string, vs: Vec2[], order = 0): Room => ({
  id,
  name: id,
  color: '#0d1628',
  shape: 'rect',
  vertices: vs,
  labelOffset: v(0, 0),
  order,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
});
const A = () => room('A', [v(0, 0), v(300, 0), v(300, 200), v(0, 200)], 0);
const B = () => room('B', [v(300, 0), v(500, 0), v(500, 200), v(300, 200)], 1);
const Bhalf = () => room('B', [v(300, 0), v(500, 0), v(500, 100), v(300, 100)], 1);

function project(rooms: Room[], points: ElectricalPoint[] = []): Project {
  const p = { ...createEmptyProject('p', 'T', NOW), rooms, points };
  return { ...p, ...reconcile(p, opts) };
}
const liveWalls = (p: Project) => p.walls.filter((w) => w.deletedAt === null);
const wallAt = (p: Project, a: Vec2, b: Vec2) =>
  liveWalls(p).find(
    (w) =>
      (w.a.x === a.x && w.a.y === a.y && w.b.x === b.x && w.b.y === b.y) ||
      (w.a.x === b.x && w.a.y === b.y && w.b.x === a.x && w.b.y === a.y),
  );
const point = (
  id: string,
  roomId: string,
  wallId: string,
  t: number,
  x: number,
  y: number,
): ElectricalPoint => ({
  id,
  symbolId: 'socket-single',
  roomId,
  wallId,
  t,
  side: 1,
  x,
  y,
  mountHeightCm: 30,
  distanceFromCornerCm: null,
  description: '',
  color: '#3b8bff',
  label: null,
  status: 'pending',
  statusChangedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
});

describe('reconcile', () => {
  it('derives one wall per edge and one shared wall', () => {
    const p = project([A(), B()]);
    expect(liveWalls(p)).toHaveLength(7);
    expect(wallAt(p, v(300, 0), v(300, 200))!.roomIds).toEqual(['A', 'B']);
  });

  it('is stable: running again keeps ids and objects', () => {
    const p = project([A(), B()]);
    const again = reconcile(p, opts);
    expect(again.walls).toEqual(p.walls);
    expect(again.walls.every((w, i) => w === p.walls[i])).toBe(true);
  });

  it('splits at T-junctions: only the touching part is shared', () => {
    const p = project([A(), Bhalf()]);
    expect(p.rooms[0]!.vertices).toHaveLength(5); // A got the corner (300,100)
    expect(wallAt(p, v(300, 0), v(300, 100))!.roomIds).toEqual(['A', 'B']);
    expect(wallAt(p, v(300, 100), v(300, 200))!.roomIds).toEqual(['A']);
    expect(liveWalls(p)).toHaveLength(8); // A: 5 edges, B: 3 more
  });

  it('adding a neighbour keeps existing ids and re-attaches points by geometry', () => {
    const one = project([A()]);
    const right = wallAt(one, v(300, 0), v(300, 200))!;
    const pt = point('pt', 'A', right.id, 0.75, 278, 150); // lower part of the right wall, inside A
    const before = { ...one, points: [pt] };
    const ids = new Set(liveWalls(one).map((w) => w.id));
    const after = { ...before, rooms: [...before.rooms, Bhalf()] };
    const r = { ...after, ...reconcile(after, opts) };
    const kept = liveWalls(r).filter((w) => ids.has(w.id));
    expect(kept.length).toBe(4); // all 4 old ids survive (the right wall keeps its id on the longest piece)
    const moved = r.points[0]!;
    const lower = wallAt(r, v(300, 100), v(300, 200))!;
    expect(moved.wallId).toBe(lower.id);
    expect(moved.x).toBeCloseTo(278);
    expect(moved.y).toBeCloseTo(150);
  });

  it('soft-deletes walls whose room disappeared', () => {
    const p = project([A(), B()]);
    const gone = { ...p, rooms: p.rooms.map((r) => (r.id === 'B' ? { ...r, deletedAt: NOW } : r)) };
    const r = reconcile(gone, opts);
    expect(r.walls.filter((w) => w.deletedAt === null)).toHaveLength(4);
    expect(r.walls.filter((w) => w.deletedAt !== null)).toHaveLength(3);
  });

  it('a free wall touching a room edge splits it (T)', () => {
    const p = project([A()]);
    const free = { ...liveWalls(p)[0]!, id: 'free', a: v(150, 0), b: v(150, -100), roomIds: [] };
    const r = reconcile({ ...p, walls: [...p.walls, free] }, opts);
    const live = r.walls.filter((w) => w.deletedAt === null);
    expect(live).toHaveLength(6);
    expect(live.find((w) => w.id === 'free')).toBeTruthy();
  });
});

describe('moveWall', () => {
  it('moving the shared wall stretches both rooms; points on it keep t', () => {
    const base = project([A(), B()]);
    const shared = wallAt(base, v(300, 0), v(300, 200))!;
    const withPt = { ...base, points: [point('pt', 'A', shared.id, 0.5, 278, 100)] };
    const r = moveWall(withPt, shared.id, { x: 37, y: 999 }, 20, opts);
    expect(r.rooms[0]!.vertices.map((p) => p.x)).toContain(340);
    expect(r.rooms[1]!.vertices.map((p) => p.x)).toContain(340);
    const w = r.walls.find((x) => x.id === shared.id)!;
    expect(w.a.x).toBe(340);
    expect(r.points[0]!.t).toBeCloseTo(0.5);
    expect(r.points[0]!.x).toBeCloseTo(318);
    expect(signedArea(r.rooms[1]!.vertices)).toBeCloseTo(160 * 200);
  });

  it('a T-junction end slides along the wall it touches', () => {
    const base = project([A(), Bhalf()]);
    const bottom = wallAt(base, v(300, 100), v(500, 100))!;
    const r = moveWall(base, bottom.id, { x: 0, y: 40 }, 20, opts);
    const a = r.rooms.find((x) => x.id === 'A')!;
    expect(a.vertices.every((p) => p.x === 0 || p.x === 300)).toBe(true); // A is still the same rectangle
    expect(signedArea(a.vertices)).toBeCloseTo(300 * 200);
    expect(signedArea(r.rooms.find((x) => x.id === 'B')!.vertices)).toBeCloseTo(200 * 140);
    expect(wallAt(r, v(300, 100), v(300, 140))!.roomIds).toEqual(['A', 'B']); // shared part grew
    expect(wallAt(r, v(300, 140), v(300, 200))!.roomIds).toEqual(['A']);
  });

  it('zero normal movement is a no-op (no-op)', () => {
    const base = project([A()]);
    const top = wallAt(base, v(0, 0), v(300, 0))!;
    expect(moveWall(base, top.id, { x: 50, y: 3 }, 20, opts)).toBe(base);
  });

  it('a wall that continues straight on makes a step instead of a slanted wall', () => {
    // A tall on the left; B (top right) and C (bottom right) share A's right edge in two pieces
    const C = room('C', [v(300, 100), v(500, 100), v(500, 200), v(300, 200)], 2);
    const base = project([A(), Bhalf(), C]);
    const upper = wallAt(base, v(300, 0), v(300, 100))!;
    const r = moveWall(base, upper.id, { x: 40, y: 0 }, 20, opts);
    const a = r.rooms.find((x) => x.id === 'A')!;
    expect(a.vertices).toContainEqual(v(340, 100));
    expect(a.vertices).toContainEqual(v(300, 100));
    expect(signedArea(a.vertices)).toBeCloseTo(300 * 200 + 40 * 100);
    expect(signedArea(r.rooms.find((x) => x.id === 'C')!.vertices)).toBeCloseTo(200 * 100); // C untouched
    expect(signedArea(r.rooms.find((x) => x.id === 'B')!.vertices)).toBeCloseTo(160 * 100);
    expect(wallAt(r, v(300, 100), v(340, 100))!.roomIds).toEqual(['A', 'C']);
  });
});

describe('splitWall', () => {
  it('adds a corner to the room so each half is its own wall', () => {
    const base = project([A(), B()]);
    const top = wallAt(base, v(0, 0), v(300, 0))!;
    const r = splitWall(base, top.id, 0.5, 20, opts);
    expect(r.rooms[0]!.vertices).toHaveLength(5);
    // the cut snaps to the 20-unit grid: 150 → 160
    expect(wallAt(r, v(0, 0), v(160, 0))).toBeTruthy();
    expect(wallAt(r, v(160, 0), v(300, 0))).toBeTruthy();
    const shared = wallAt(base, v(300, 0), v(300, 200))!;
    const both = splitWall(base, shared.id, 0.5, 20, opts);
    expect(both.rooms.every((x) => x.vertices.length === 5)).toBe(true);
    expect(wallAt(both, v(300, 0), v(300, 100))!.roomIds).toEqual(['A', 'B']);
  });
});

describe('deleteWalls', () => {
  it('merges the two rooms of a shared wall', () => {
    const base = project([A(), B()]);
    const shared = wallAt(base, v(300, 0), v(300, 200))!;
    const r = deleteWalls(base, [shared.id], opts);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const live = r.project.rooms.filter((x) => x.deletedAt === null);
    expect(live).toHaveLength(1);
    expect(Math.abs(signedArea(live[0]!.vertices))).toBeCloseTo(500 * 200);
    expect(liveWalls(r.project).every((w) => w.roomIds.join() === 'A')).toBe(true);
  });

  it('refuses an outer wall', () => {
    const base = project([A()]);
    expect(deleteWalls(base, [liveWalls(base)[0]!.id], opts)).toEqual({ ok: false, reason: 'exterior' });
  });

  it('removes a free wall', () => {
    const p = project([]);
    const free = { ...createEmptyProject('x', 'x', NOW), walls: [] };
    void free;
    const withFree = {
      ...p,
      walls: [
        {
          id: 'f',
          a: v(0, 0),
          b: v(100, 0),
          thickness: 12,
          roomIds: [],
          name: null,
          createdAt: NOW,
          updatedAt: NOW,
          deletedAt: null,
        },
      ],
    };
    const r = deleteWalls(withFree, ['f'], opts);
    expect(r.ok && r.project.walls.every((w) => w.deletedAt !== null)).toBe(true);
  });
});
