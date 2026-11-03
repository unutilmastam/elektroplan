import { lerp, polygonCentroid } from './geometry';
import type { Opening, Room, Vec2, Wall } from './types';

const key = (p: Vec2) => `${Math.round(p.x * 1000)}:${Math.round(p.y * 1000)}`;
const edgeKey = (a: Vec2, b: Vec2) => [key(a), key(b)].sort().join('|');

/**
 * Builds walls from room polygon edges. Edges that two rooms share exactly become ONE wall with two roomIds.
 * (Partial overlaps / splitting are handled in Phase 4.)
 */
export function deriveWallsFromRooms(
  rooms: readonly Room[],
  thickness: number,
  makeId: (index: number) => string,
  now: string,
): Wall[] {
  const byEdge = new Map<string, Wall>();
  const walls: Wall[] = [];
  for (const room of rooms) {
    if (room.deletedAt !== null) continue;
    const vs = room.vertices;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i]!;
      const b = vs[(i + 1) % vs.length]!;
      const k = edgeKey(a, b);
      const existing = byEdge.get(k);
      if (existing) {
        if (!existing.roomIds.includes(room.id)) existing.roomIds.push(room.id);
        continue;
      }
      const wall: Wall = {
        id: makeId(walls.length),
        a: { ...a },
        b: { ...b },
        thickness,
        roomIds: [room.id],
        name: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      byEdge.set(k, wall);
      walls.push(wall);
    }
  }
  return walls;
}

/** Finds the wall whose endpoints are {a, b} in either order. */
export function findWallByEndpoints(walls: readonly Wall[], a: Vec2, b: Vec2): Wall | undefined {
  const k = edgeKey(a, b);
  return walls.find((w) => edgeKey(w.a, w.b) === k);
}

export type WallDirection = 'north' | 'south' | 'east' | 'west';

/** Compass side of `room` that the wall forms (plan up = north). Uses the outward normal. */
export function wallDirection(wall: Wall, room: Room): WallDirection {
  const c = polygonCentroid(room.vertices);
  const mid = lerp(wall.a, wall.b, 0.5);
  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  let nx = -dy;
  let ny = dx;
  if (nx * (mid.x - c.x) + ny * (mid.y - c.y) < 0) {
    nx = -nx;
    ny = -ny;
  }
  if (Math.abs(nx) > Math.abs(ny)) return nx > 0 ? 'east' : 'west';
  return ny > 0 ? 'south' : 'north';
}

/** World position of a wall-attached point, pushed `inset` units to the given side of the wall. */
export function pointOnWall(wall: Pick<Wall, 'a' | 'b'>, t: number, side: 1 | -1, inset: number): Vec2 {
  const p = lerp(wall.a, wall.b, t);
  const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y) || 1;
  const nx = -(wall.b.y - wall.a.y) / len;
  const ny = (wall.b.x - wall.a.x) / len;
  return { x: p.x + nx * inset * side, y: p.y + ny * inset * side };
}

/** Solid [t0, t1] intervals of a wall after cutting out its openings (sorted, merged, clamped). */
export function solidIntervals(
  wall: Pick<Wall, 'id' | 'a' | 'b'>,
  openings: readonly Opening[],
): Array<[number, number]> {
  const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
  if (len === 0) return [];
  const gaps = openings
    .filter((o) => o.wallId === wall.id)
    .map((o): [number, number] => {
      const half = o.width / 2 / len;
      return [Math.max(0, o.t - half), Math.min(1, o.t + half)];
    })
    .sort((p, q) => p[0] - q[0]);
  const out: Array<[number, number]> = [];
  let cursor = 0;
  for (const [g0, g1] of gaps) {
    if (g0 > cursor) out.push([cursor, g0]);
    cursor = Math.max(cursor, g1);
  }
  if (cursor < 1) out.push([cursor, 1]);
  return out;
}
