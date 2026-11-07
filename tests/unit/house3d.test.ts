import { describe, expect, it } from 'vitest';
import {
  BODY_RADIUS,
  buildHouse3D,
  obstacles,
  rayToSurface,
  roomAtPoint,
  startPose,
  walk,
} from '@/domain/house3d';
import { createEmptyProject } from '@/domain/project';
import { hitScene, newFixturePoint } from '@/domain/room3dEdit';
import { reconcile } from '@/domain/topology';
import type { Project, Room } from '@/domain/types';
import { SYMBOLS } from '@/features/symbols';

const NOW = '2026-11-07T00:00:00.000Z';
let n = 0;
const room = (id: string, vs: Array<[number, number]>): Room => ({
  id, name: id, color: '#000', shape: 'rect', vertices: vs.map(([x, y]) => ({ x, y })), labelOffset: { x: 0, y: 0 },
  order: 0, createdAt: NOW, updatedAt: NOW, deletedAt: null,
});

/** Two rooms side by side (0–400 and 400–700), a 90 cm door in the wall between them at y = 150. */
function home(door = true): Project {
  const base = {
    ...createEmptyProject('p', 'P', NOW),
    rooms: [room('a', [[0, 0], [400, 0], [400, 300], [0, 300]]), room('b', [[400, 0], [700, 0], [700, 300], [400, 300]])],
  };
  const p = { ...base, ...reconcile(base, { makeId: () => `w${++n}`, now: NOW }) };
  const shared = p.walls.find((w) => w.roomIds.length === 2)!;
  const len = Math.hypot(shared.b.x - shared.a.x, shared.b.y - shared.a.y);
  const t = Math.abs(150 - shared.a.y) / len;
  return door ? { ...p, openings: [{ id: 'd', wallId: shared.id, kind: 'door', t, width: 90, swing: 1 }] } : p;
}

describe('the whole home in 3D', () => {
  it('has every room, open door leaves (no closed door in the hole), wall tops and lights', () => {
    const s = buildHouse3D(home())!;
    expect(s.floors.map((f) => f.roomId)).toEqual(['a', 'b']);
    const doors = s.quads.filter((q) => q.surface === 'door');
    expect(doors).toHaveLength(2); // one leaf, both faces
    // the leaf stands out of the wall plane (x = 400), i.e. it is open
    const xs = doors[0]!.p.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(60);
    expect(s.quads.some((q) => q.surface === 'cap')).toBe(true);
    expect(s.quads.some((q) => q.surface === 'skirting')).toBe(true);
    expect(s.lights).toHaveLength(2); // no lamps yet: the middle of each room
    expect(s.center[0]).toBe(350);
    expect(s.fixtures.every((f) => typeof f.roomId === 'string')).toBe(true);
  });

  it('one room only when asked', () => {
    expect(buildHouse3D(home(), 'b')!.floors).toHaveLength(1);
    expect(buildHouse3D({ ...home(), rooms: [] })).toBeNull();
  });
});

describe('walking', () => {
  it('a wall stops you (you slide along it), the doorway lets you through', () => {
    const p = home();
    const obs = obstacles(p);
    // straight into the wall away from the door
    const blocked = walk({ x: 300, y: 60 }, { x: 300, y: 0 }, obs);
    expect(blocked.x).toBeLessThanOrEqual(400 - 6 - BODY_RADIUS + 0.01);
    expect(roomAtPoint(p, blocked)).toBe('a');
    // through the doorway
    const through = walk({ x: 300, y: 150 }, { x: 250, y: 0 }, obs);
    expect(through.x).toBeGreaterThan(500);
    expect(roomAtPoint(p, through)).toBe('b');
    // the same move without a door: stopped
    expect(walk({ x: 300, y: 150 }, { x: 250, y: 0 }, obstacles(home(false))).x).toBeLessThan(400);
  });

  it('a big step cannot jump over a thin wall', () => {
    const p = home(false);
    expect(walk({ x: 380, y: 60 }, { x: 60, y: 0 }, obstacles(p)).x).toBeLessThan(400);
  });

  it('starts inside the chosen room, clear of the walls, looking across it', () => {
    const p = home();
    const s = startPose(p, 'b')!;
    expect(roomAtPoint(p, s.pos)).toBe('b');
    expect(s.pos.x).toBeGreaterThan(400 + BODY_RADIUS);
    expect(Number.isFinite(s.yaw)).toBe(true);
    expect(startPose(p, 'zzz')!.pos.x).toBeLessThan(400); // unknown room → the first
  });
});

describe('pointing in the house', () => {
  it('a ray meets the first wall face it sees; walls seen from behind do not stop it', () => {
    const s = buildHouse3D(home(false))!;
    // from room a towards +x: the wall between the rooms (face at x = 400 - 8)
    expect(rayToSurface(s.quads, [200, 150, 150], [1, 0, 0])).toBeCloseTo(192 - 0, 0);
    // from outside (x = -100) looking in: the outer wall's back is skipped, the far wall face is hit
    expect(rayToSurface(s.quads, [-100, 150, 150], [1, 0, 0])).toBeGreaterThan(400);
  });

  it('a tap on a wall adds a socket there at that height; a lamp goes on the ceiling', () => {
    const p = home();
    const hit = hitScene(p, [600, 160, 150], [1, -0.2, 0].map((v) => v / Math.hypot(1, 0.2)) as never, false)!;
    expect(hit.kind).toBe('wall');
    expect(hit.roomId).toBe('b');
    const pt = newFixturePoint(p, 'socket-single', SYMBOLS['socket-single'], hit, 'n1', NOW)!;
    expect(pt.roomId).toBe('b');
    expect(pt.wallId).not.toBeNull();
    expect(pt.mountHeightCm).toBeGreaterThan(100);
    expect(pt.mountHeightCm! % 5).toBe(0);
    // a ceiling lamp needs the ceiling, not a wall
    expect(newFixturePoint(p, 'ceiling-light', SYMBOLS['ceiling-light'], hit, 'n2', NOW)).toBeNull();
    const up = hitScene(p, [200, 160, 150], [0, 1, 0], true)!;
    expect(up).toMatchObject({ kind: 'ceiling', roomId: 'a' });
    const lamp = newFixturePoint(p, 'ceiling-light', SYMBOLS['ceiling-light'], up, 'n3', NOW)!;
    expect(lamp.wallId).toBeNull();
    // from above the house the lamp goes to the floor spot under the finger
    expect(hitScene(p, [550, 900, 150], [0, -1, 0], true)).toMatchObject({ kind: 'ceiling', roomId: 'b' });
  });
});
