import { describe, expect, it } from 'vitest';
import { buildHouse3D } from '@/domain/house3d';
import { buildRoom3D, triangulate, WINDOW_SILL } from '@/domain/room3d';
import { createEmptyProject } from '@/domain/project';
import { reconcile } from '@/domain/topology';
import type { Opening, Project, Room } from '@/domain/types';

const NOW = '2026-11-06T00:00:00.000Z';
let n = 0;
const room = (id: string, vs: Array<[number, number]>): Room => ({
  id, name: id, color: '#000', shape: 'rect', vertices: vs.map(([x, y]) => ({ x, y })), labelOffset: { x: 0, y: 0 },
  order: 0, createdAt: NOW, updatedAt: NOW, deletedAt: null,
});
function house(): Project {
  const base = { ...createEmptyProject('p', 'P', NOW), rooms: [room('a', [[0, 0], [400, 0], [400, 300], [0, 300]])] };
  return { ...base, ...reconcile(base, { makeId: () => `w${++n}`, now: NOW }) };
}

describe('triangulate', () => {
  it('rectangle → 2 triangles, L-shape → 4, either winding', () => {
    expect(triangulate([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }])).toHaveLength(2);
    const L = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]].map(([x, y]) => ({ x: x!, y: y! }));
    expect(triangulate(L)).toHaveLength(4);
    expect(triangulate([...L].reverse())).toHaveLength(4);
  });
});

describe('room in 3D', () => {
  it('four walls full height, floor and ceiling, eye in the middle at 1.6 m', () => {
    const p = house();
    const r = buildRoom3D(p, 'a')!;
    const walls = r.quads.filter((q) => q.surface === 'wall');
    expect(walls).toHaveLength(4);
    expect(walls.every((q) => q.size[1] === 270)).toBe(true);
    expect(r.triangles).toHaveLength(2);
    expect(r.eye).toEqual([200, 155, 150]);
    // every wall normal points into the room (towards the centre)
    for (const q of walls) {
      const c = q.p[0];
      const toCentre = [200 - c[0], 0, 150 - c[2]];
      expect(q.n[0] * toCentre[0]! + q.n[2] * toCentre[2]!).toBeGreaterThan(0);
    }
  });

  it('a window cuts the wall: below + lintel + sides, glass, sill and sky; a door from the floor', () => {
    const p = house();
    const top = p.walls.find((w) => w.a.y === 0 && w.b.y === 0)!;
    const left = p.walls.find((w) => w.a.x === 0 && w.b.x === 0)!;
    const openings: Opening[] = [
      { id: 'o1', wallId: top.id, kind: 'window', t: 0.5, width: 120, swing: 1 },
      { id: 'o2', wallId: left.id, kind: 'door', t: 0.5, width: 90, swing: 1 },
    ];
    const r = buildRoom3D({ ...p, openings }, 'a')!;
    const s = (k: string) => r.quads.filter((q) => q.surface === k);
    expect(s('glass')).toHaveLength(1);
    expect(s('sill')).toHaveLength(1);
    expect(s('sky')).toHaveLength(1);
    expect(s('door')).toHaveLength(1);
    expect(s('reveal')).toHaveLength(6); // 2 sides + top for each opening
    const under = s('wall').find((q) => q.size[1] === WINDOW_SILL);
    expect(under?.size[0]).toBe(120);
  });

  it('points hang on their wall at their height; ceiling lights on the ceiling', () => {
    const p = house();
    const top = p.walls.find((w) => w.a.y === 0 && w.b.y === 0)!;
    const pt = (id: string, symbolId: string, extra: object) => ({
      id, symbolId, roomId: 'a', wallId: null, t: null, side: 1, x: 200, y: 150, mountHeightCm: null,
      distanceFromCornerCm: null, description: '', color: '#3b8bff', label: null, status: 'pending',
      statusChangedAt: null, createdAt: NOW, updatedAt: NOW, deletedAt: null, ...extra,
    });
    const points = [
      pt('s', 'socket-double', { wallId: top.id, t: 0.25, mountHeightCm: 30 }),
      pt('ac', 'ac', { wallId: top.id, t: 0.75 }),
      pt('l', 'ceiling-light', {}),
    ] as unknown as Project['points'];
    const r = buildRoom3D({ ...p, points }, 'a')!;
    const s = r.fixtures.find((f) => f.pointId === 's')!;
    expect(s.c[1]).toBe(30);
    expect(s.w).toBe(15.5);
    expect(s.c[2]).toBeGreaterThan(0); // on the inner face, not the centre line
    expect(r.fixtures.find((f) => f.pointId === 'ac')!.c[1]).toBe(220);
    expect(r.fixtures.find((f) => f.pointId === 'l')!.c[1]).toBeCloseTo(269.2);
  });
});

describe('3D camera and tapping a fixture', async () => {
  const { camera, pick, START } = await import('@/features/room3d/camera');
  it('looking at a wall from inside, a tap on the plate finds it; a tap on bare wall finds nothing', () => {
    const p = house();
    const top = p.walls.find((w) => w.a.y === 0 && w.b.y === 0)!;
    const points = [
      {
        id: 's', symbolId: 'switch-single', roomId: 'a', wallId: top.id, t: 0.5, side: 1, x: 200, y: 0, mountHeightCm: 155,
        distanceFromCornerCm: null, description: '', color: '#ef4444', label: null, status: 'pending', statusChangedAt: null,
        createdAt: NOW, updatedAt: NOW, deletedAt: null,
      },
    ] as unknown as Project['points'];
    const r = buildHouse3D({ ...p, points })!;
    const cam = camera(r, 'inside', { ...START.inside, pitch: 0 }, { x: 200, y: 150 });
    // the default view looks at the wall at plan y = 0, the switch is straight ahead at eye height
    expect(pick(r, cam, 400, 300, 800, 600)?.pointId).toBe('s');
    expect(pick(r, cam, 60, 300, 800, 600)).toBeNull();
  });
});

describe('moving a fixture in 3D', async () => {
  const { hitRoom, moveFixtureRecipe } = await import('@/domain/room3dEdit');
  const { produce } = await import('immer');
  const withSocket = () => {
    const p = house();
    const top = p.walls.find((w) => w.a.y === 0 && w.b.y === 0)!;
    const points = [
      {
        id: 's', symbolId: 'socket-single', roomId: 'a', wallId: top.id, t: 0.25, side: 1, x: 100, y: 22, mountHeightCm: 30,
        distanceFromCornerCm: 100, description: '', color: '#3b8bff', label: null, status: 'pending', statusChangedAt: null,
        createdAt: NOW, updatedAt: NOW, deletedAt: null,
      },
    ] as unknown as Project['points'];
    return { p: { ...p, points }, top };
  };

  it('a ray from the middle of the room hits the wall it looks at, with the height snapped to 5 cm', () => {
    const { p, top } = withSocket();
    // from (200, 155, 150) towards the wall at plan y = 0, slightly down
    const hit = hitRoom(p, 'a', [200, 155, 150], [0.2, -0.3, -1], false)!;
    expect(hit).toMatchObject({ kind: 'wall', wallId: top.id });
    if (hit.kind !== 'wall') throw new Error();
    expect(hit.height % 5).toBe(0);
    expect(hit.t).toBeGreaterThan(0.5);
    // looking up hits the ceiling when asked for it
    expect(hitRoom(p, 'a', [200, 155, 150], [0.1, 1, 0.1], true)).toMatchObject({ kind: 'ceiling' });
    // looking at nothing (out of a wall's range) → null
    expect(hitRoom(p, 'a', [200, 155, 150], [0, 1, 0], false)).toBeNull();
  });

  it('the socket slides along the wall and gets the new height; to another wall too', () => {
    const { p, top } = withSocket();
    const hit = hitRoom(p, 'a', [200, 155, 150], [0, -0.6, -1], false)!;
    const next = produce(p, moveFixtureRecipe(p, 's', hit, 8.5, NOW));
    const s = next.points[0]!;
    expect(s.wallId).toBe(top.id);
    expect(s.t).toBeCloseTo(0.5, 2);
    expect(s.mountHeightCm).toBe(hit.kind === 'wall' ? hit.height : -1);
    const right = p.walls.find((w) => w.a.x === 400 && w.b.x === 400)!;
    const hit2 = hitRoom(p, 'a', [200, 155, 150], [1, -0.2, 0], false)!;
    const moved = produce(p, moveFixtureRecipe(p, 's', hit2, 8.5, NOW)).points[0]!;
    expect(moved.wallId).toBe(right.id);
    expect(moved.roomId).toBe('a');
  });
});
