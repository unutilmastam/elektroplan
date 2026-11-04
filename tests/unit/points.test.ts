import { describe, expect, it } from 'vitest';
import { applyRecipe, emptyHistory, record, undo } from '@/domain/history';
import {
  addPointRecipe,
  defaultHeight,
  duplicatePoint,
  movePointRecipe,
  newPoint,
  placementTarget,
  POINT_INSET,
  settingsRecipe,
  updatePointRecipe,
  wallTarget,
} from '@/domain/points';
import { createEmptyProject } from '@/domain/project';
import { selectWallElevation } from '@/domain/selectors';
import { addRoom, topologyRecipe } from '@/domain/rooms';
import type { Project, Vec2 } from '@/domain/types';
import { moveWall } from '@/domain/wallEdits';
import { SYMBOLS } from '@/features/symbols/catalog';

const NOW = '2026-11-03T00:00:00.000Z';
let n = 0;
const opts = { makeId: () => `w${++n}`, now: NOW };
const v = (x: number, y: number): Vec2 => ({ x, y });
const rect = (x0: number, y0: number, x1: number, y1: number) => [v(x0, y0), v(x1, y0), v(x1, y1), v(x0, y1)];

function house(): Project {
  let p = createEmptyProject('p', 'T', NOW);
  p = addRoom(p, rect(0, 0, 300, 200), 'rect', { id: 'A', name: 'Zal' }, opts);
  p = addRoom(p, rect(300, 0, 500, 200), 'rect', { id: 'B', name: 'Oshxona' }, opts);
  return p;
}
const place = (p: Project, at: Vec2, id: keyof typeof SYMBOLS, free = false) => {
  const t = placementTarget(p, at, SYMBOLS[id], { tolerance: 20, free });
  if (!t) return null;
  const pt = newPoint(p, t, id, SYMBOLS[id], `pt-${++n}`, NOW);
  return { project: applyRecipe(p, 'add', addPointRecipe(pt)).next, point: pt };
};

describe('placement', () => {
  it('a socket near a wall snaps onto it, inside the room on the cursor side', () => {
    const p = house();
    const r = place(p, v(150, 12), 'socket-double')!;
    const top = p.walls.find((w) => w.id === r.point.wallId)!;
    expect(top.a.y).toBe(0);
    expect(r.point).toMatchObject({
      roomId: 'A',
      x: 150,
      y: POINT_INSET,
      mountHeightCm: 30,
      distanceFromCornerCm: 150,
    });
  });

  it('on the shared wall the side decides the room', () => {
    const p = house();
    expect(place(p, v(295, 100), 'switch-single')!.point).toMatchObject({
      roomId: 'A',
      x: 300 - POINT_INSET,
      mountHeightCm: 90,
    });
    expect(place(p, v(306, 100), 'switch-single')!.point).toMatchObject({
      roomId: 'B',
      x: 300 + POINT_INSET,
    });
  });

  it('outside an outer wall the point still goes inside the room', () => {
    const p = house();
    expect(place(p, v(150, -15), 'socket-single')!.point).toMatchObject({ roomId: 'A', y: POINT_INSET });
  });

  it('lights go on the ceiling where tapped; wall symbols far from walls are refused unless Shift', () => {
    const p = house();
    expect(place(p, v(150, 100), 'ceiling-light')!.point).toMatchObject({
      roomId: 'A',
      wallId: null,
      x: 150,
      y: 100,
      mountHeightCm: null,
    });
    expect(place(p, v(150, 100), 'socket-single')).toBeNull();
    expect(place(p, v(150, 100), 'socket-single', true)!.point).toMatchObject({ wallId: null, roomId: 'A' });
    expect(place(p, v(900, 900), 'ceiling-light')).toBeNull();
    expect(place(p, v(400, 100), 'led')!.point.wallId).toBeNull(); // "any": room when no wall is near
  });

  it('a light tapped near the room middle snaps to it; the room name sits above', () => {
    const p = house();
    expect(place(p, v(160, 95), 'ceiling-light')!.point).toMatchObject({ x: 150, y: 100 });
    expect(place(p, v(60, 40), 'ceiling-light')!.point).toMatchObject({ x: 60, y: 40 });
    expect(p.rooms[0]!.labelOffset.y).toBeLessThan(0);
  });

  it('default heights come from the project settings', () => {
    const p = applyRecipe(house(), 's', settingsRecipe({ defaultSocketHeightCm: 40 })).next;
    expect(defaultHeight(SYMBOLS['socket-single'], p.settings)).toBe(40);
    expect(place(p, v(150, 10), 'socket-single')!.point.mountHeightCm).toBe(40);
    expect(defaultHeight(SYMBOLS.tv, p.settings)).toBe(110);
  });

  it('keeps clear of the corners', () => {
    const p = house();
    const t = wallTarget(p, v(1, 5), 20)!;
    expect(t.t).toBeGreaterThan(0.04);
  });
});

describe('moving and editing', () => {
  it('drag to another wall re-attaches to that wall (and room)', () => {
    const { project, point } = place(house(), v(150, 10), 'socket-double')!;
    const next = applyRecipe(
      project,
      'move',
      movePointRecipe(project, point.id, v(490, 120), { tolerance: 20 }, NOW),
    ).next;
    const moved = next.points.find((x) => x.id === point.id)!;
    expect(moved.roomId).toBe('B');
    expect(moved.x).toBe(500 - POINT_INSET);
    expect(moved.wallId).not.toBe(point.wallId);
  });

  it('dragged far from any wall, a wall point keeps sliding along its own wall', () => {
    const { project, point } = place(house(), v(150, 10), 'socket-double')!;
    const next = applyRecipe(
      project,
      'move',
      movePointRecipe(project, point.id, v(230, 100), { tolerance: 20 }, NOW),
    ).next;
    const moved = next.points.find((x) => x.id === point.id)!;
    expect(moved).toMatchObject({ wallId: point.wallId, y: POINT_INSET, distanceFromCornerCm: 230 });
    expect(moved.x).toBeCloseTo(230);
  });

  it('every property edit is one undoable step', () => {
    const { project, point } = place(house(), v(150, 10), 'socket-double')!;
    const edits = [
      { mountHeightCm: 45 },
      { distanceFromCornerCm: 60 },
      { description: 'Muzlatgich uchun' },
      { color: '#16a34a' },
      { status: 'completed' as const },
      { symbolId: 'socket-triple' as const },
    ];
    let doc = project;
    let h = emptyHistory();
    for (const e of edits) {
      const r = applyRecipe(doc, 'edit', updatePointRecipe(point.id, e, NOW));
      expect(r.entry).not.toBeNull();
      doc = r.next;
      h = record(h, r.entry!);
    }
    const p = doc.points.find((x) => x.id === point.id)!;
    expect(p).toMatchObject({
      mountHeightCm: 45,
      distanceFromCornerCm: 60,
      x: 60,
      description: 'Muzlatgich uchun',
      status: 'completed',
      symbolId: 'socket-triple',
    });
    expect(p.statusChangedAt).toBe(NOW);
    let s = { state: doc, history: h };
    for (let i = 0; i < edits.length; i++) s = undo(s.state, s.history)!;
    expect(s.state).toEqual(project);
  });

  it('X / Y only move ceiling points', () => {
    const p = house();
    const lamp = place(p, v(150, 100), 'ceiling-light')!;
    const moved = applyRecipe(
      lamp.project,
      'xy',
      updatePointRecipe(lamp.point.id, { x: 120, y: 80 }, NOW),
    ).next;
    expect(moved.points.at(-1)).toMatchObject({ x: 120, y: 80 });
    const sock = place(p, v(150, 10), 'socket-double')!;
    expect(applyRecipe(sock.project, 'xy', updatePointRecipe(sock.point.id, { x: 5 }, NOW)).entry).toBeNull();
  });

  it('a moved wall carries its points (t kept)', () => {
    const p = house();
    const shared = p.walls.find((w) => w.roomIds.length === 2)!;
    const t0 = placementTarget(p, v(306, 100), SYMBOLS['socket-single'], { tolerance: 20 })!;
    const pt = newPoint(p, t0, 'socket-single', SYMBOLS['socket-single'], 'sp', NOW);
    const withPt = { ...p, points: [pt] };
    const moved = moveWall(withPt, shared.id, v(40, 0), 20, opts);
    const after = moved.points[0]!;
    expect(after.x).toBe(340 + POINT_INSET);
    expect(after.wallId).toBe(shared.id);
    expect(applyRecipe(withPt, 'mv', topologyRecipe(moved)).entry).not.toBeNull();
  });

  it('duplicates along the wall', () => {
    const { project, point } = place(house(), v(150, 10), 'socket-double')!;
    const copy = duplicatePoint(project, point.id, 'copy', NOW)!;
    expect(copy).toMatchObject({
      wallId: point.wallId,
      x: 190,
      y: POINT_INSET,
      distanceFromCornerCm: 190,
      status: 'pending',
    });
  });
});

describe('a wall standing inside one room (both faces in the same room)', () => {
  const NOW2 = '2026-11-04T00:00:00.000Z';
  const room = {
    id: 'R',
    name: 'Zal',
    color: '#0d1628',
    shape: 'rect' as const,
    vertices: [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 200 },
      { x: 0, y: 200 },
    ],
    labelOffset: { x: 0, y: 0 },
    order: 0,
    createdAt: NOW2,
    updatedAt: NOW2,
    deletedAt: null,
  };
  const free = {
    id: 'mid',
    a: { x: 200, y: 40 },
    b: { x: 200, y: 160 },
    thickness: 12,
    roomIds: [],
    name: null,
    createdAt: NOW2,
    updatedAt: NOW2,
    deletedAt: null,
  };
  const proj = { ...createEmptyProject('p', 'P', NOW2), rooms: [room], walls: [free] };
  const socket = { placement: 'wall' as const, category: 'socket' as const, defaultMountHeightCm: 30 };

  it('a tap on each face puts the socket on that face', () => {
    const left = placementTarget(proj, { x: 190, y: 100 }, socket, { tolerance: 20, free: false });
    const right = placementTarget(proj, { x: 210, y: 100 }, socket, { tolerance: 20, free: false });
    expect(left).toMatchObject({ kind: 'wall', wallId: 'mid', roomId: 'R' });
    expect(right).toMatchObject({ kind: 'wall', wallId: 'mid', roomId: 'R' });
    if (left?.kind !== 'wall' || right?.kind !== 'wall') return;
    expect(left.side).not.toBe(right.side);
    expect(left.pos.x).toBeLessThan(200);
    expect(right.pos.x).toBeGreaterThan(200);
  });

  it('the wall view shows one face at a time', () => {
    const mk = (id: string, side: 1 | -1) => ({
      ...newPoint(
        proj,
        placementTarget(proj, { x: side === 1 ? 190 : 210, y: 100 }, socket, { tolerance: 20, free: false })!,
        'socket-single',
        { ...socket, defaultColor: '#3b8bff' },
        id,
        NOW2,
      ),
    });
    const a = mk('a', 1);
    const b = mk('b', -1);
    const withPts = { ...proj, points: [a, b] };
    expect(selectWallElevation(withPts, 'mid', 'R')!.points).toHaveLength(2);
    expect(selectWallElevation(withPts, 'mid', 'R', a.side)!.points.map((x) => x.point.id)).toEqual(['a']);
    expect(selectWallElevation(withPts, 'mid', 'R', b.side)!.points.map((x) => x.point.id)).toEqual(['b']);
  });
});
