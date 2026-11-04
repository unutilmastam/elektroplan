import { describe, expect, it } from 'vitest';
import { formatLength, lengthCm, parseLength, setWallLength } from '@/domain/dimensions';
import { createEmptyProject } from '@/domain/project';
import { reconcile } from '@/domain/topology';
import type { Project, Room, Wall } from '@/domain/types';

const NOW = '2026-11-04T00:00:00.000Z';
let n = 0;
const opts = { makeId: () => `id-${++n}`, now: NOW };
const room = (id: string, vs: Array<[number, number]>): Room => ({
  id,
  name: id,
  color: '#000',
  shape: 'rect',
  vertices: vs.map(([x, y]) => ({ x, y })),
  labelOffset: { x: 0, y: 0 },
  order: 0,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
});
const project = (rooms: Room[], walls: Wall[] = []): Project => {
  const base = { ...createEmptyProject('p', 'P', NOW), rooms, walls };
  return { ...base, ...reconcile(base, opts) };
};
const live = (p: Project) => p.walls.filter((w) => w.deletedAt === null);
const wallBetween = (p: Project, ax: number, ay: number, bx: number, by: number) =>
  live(p).find(
    (w) =>
      (w.a.x === ax && w.a.y === ay && w.b.x === bx && w.b.y === by) ||
      (w.b.x === ax && w.b.y === ay && w.a.x === bx && w.a.y === by),
  )!;

describe('formatLength / parseLength', () => {
  const units = { m: 'm', cm: 'sm' };
  it('formats cm under a metre, metres with comma decimals above', () => {
    expect(formatLength(85, units)).toBe('85 sm');
    expect(formatLength(300, units)).toBe('3 m');
    expect(formatLength(320, units)).toBe('3,2 m');
    expect(formatLength(1245.4, units)).toBe('12,45 m');
  });
  it('reads metres or centimetres the way an electrician types them', () => {
    expect(parseLength('3,2')).toBe(320);
    expect(parseLength('3.25 m')).toBe(325);
    expect(parseLength('320')).toBe(320);
    expect(parseLength('85 sm')).toBe(85);
    expect(parseLength('85см')).toBe(85);
    expect(parseLength('4 м')).toBe(400);
    expect(parseLength('abc')).toBeNull();
    expect(parseLength('0')).toBeNull();
    expect(parseLength('10')).toBe(1000);
    expect(parseLength('')).toBeNull();
  });
});

describe('setWallLength', () => {
  it('stretches a rectangular room and keeps it rectangular', () => {
    const p = project([room('a', [[0, 0], [300, 0], [300, 200], [0, 200]])]);
    const top = wallBetween(p, 0, 0, 300, 0);
    const next = setWallLength(p, top.id, 420, opts);
    const r = next.rooms[0]!;
    const xs = r.vertices.map((v) => v.x).sort((a, b) => a - b);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(420);
    for (const w of live(next)) {
      const horizontal = w.a.y === w.b.y;
      const vertical = w.a.x === w.b.x;
      expect(horizontal || vertical).toBe(true);
    }
    expect(lengthCm(wallBetween(next, 0, 0, 420, 0).a, wallBetween(next, 0, 0, 420, 0).b)).toBe(420);
  });

  it('shortens too, and the neighbouring room follows the shared wall', () => {
    const p = project([
      room('a', [[0, 0], [300, 0], [300, 200], [0, 200]]),
      room('b', [[300, 0], [600, 0], [600, 200], [300, 200]]),
    ]);
    const top = wallBetween(p, 0, 0, 300, 0);
    const next = setWallLength(p, top.id, 250, opts);
    const b = next.rooms.find((r) => r.id === 'b')!;
    expect(Math.min(...b.vertices.map((v) => v.x))).toBe(250);
    expect(Math.max(...b.vertices.map((v) => v.x))).toBe(600);
  });

  it('a free-standing wall keeps its start and direction', () => {
    const p = project([]);
    const w: Wall = {
      id: 'free',
      a: { x: 0, y: 0 },
      b: { x: 60, y: 80 },
      thickness: 16,
      roomIds: [],
      name: null,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    const withWall = { ...p, walls: [w] };
    const next = setWallLength(withWall, 'free', 200, opts);
    const nw = live(next).find((x) => x.id === 'free')!;
    expect(nw.a).toEqual({ x: 0, y: 0 });
    expect(nw.b.x).toBeCloseTo(120);
    expect(nw.b.y).toBeCloseTo(160);
  });

  it('same length or unknown wall: unchanged', () => {
    const p = project([room('a', [[0, 0], [300, 0], [300, 200], [0, 200]])]);
    const top = wallBetween(p, 0, 0, 300, 0);
    expect(setWallLength(p, top.id, 300, opts)).toBe(p);
    expect(setWallLength(p, 'nope', 300, opts)).toBe(p);
  });
});

describe('resizedWall', () => {
  it('finds the wall after a resize whichever end moved', async () => {
    const { resizedWall } = await import('@/domain/dimensions');
    const p = project([room('a', [[0, 0], [300, 0], [300, 200], [0, 200]])]);
    const top = wallBetween(p, 0, 0, 300, 0);
    const next = setWallLength(p, top.id, 420, opts);
    expect(resizedWall(next, top, 420)).toBe(wallBetween(next, 0, 0, 420, 0).id);
    expect(resizedWall(next, top, 999)).toBeNull();
  });
});
