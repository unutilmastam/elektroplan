import type { Draft } from 'immer';
import { lerp, projectOnSegment, snapToGrid } from './geometry';
import type { Selection } from './selection';
import type { Project, Vec2 } from './types';
import { pointOnWall } from './walls';

/** Plan-editing recipes for `applyRecipe` (undoable). Phase 3: delete + move. */

/**
 * Soft-deletes the selection with its dependants:
 * room → its points, and walls no other live room uses (shared walls just lose the roomId);
 * wall → points attached to it and its openings.
 */
export function deleteSelectionRecipe(sel: Selection, now: string) {
  return (d: Draft<Project>) => {
    const roomIds = new Set(sel.filter((r) => r.kind === 'room').map((r) => r.id));
    const wallIds = new Set(sel.filter((r) => r.kind === 'wall').map((r) => r.id));
    const pointIds = new Set(sel.filter((r) => r.kind === 'point').map((r) => r.id));
    const kill = (e: { deletedAt: string | null; updatedAt: string }) => {
      if (e.deletedAt === null) {
        e.deletedAt = now;
        e.updatedAt = now;
      }
    };
    for (const r of d.rooms) if (roomIds.has(r.id)) kill(r);
    for (const w of d.walls) {
      if (w.deletedAt !== null || wallIds.has(w.id)) continue;
      if (w.roomIds.some((id) => roomIds.has(id))) {
        const remaining = w.roomIds.filter((id) => !roomIds.has(id));
        if (remaining.length === 0) wallIds.add(w.id);
        else {
          w.roomIds = remaining;
          w.updatedAt = now;
        }
      }
    }
    for (const w of d.walls) if (wallIds.has(w.id)) kill(w);
    for (const p of d.points)
      if (pointIds.has(p.id) || roomIds.has(p.roomId) || (p.wallId !== null && wallIds.has(p.wallId)))
        kill(p);
    d.openings = d.openings.filter((o) => !wallIds.has(o.wallId));
  };
}

/**
 * Rooms can move rigidly only as a closed group: every wall of the moved rooms must belong only to moved rooms
 * (moving a single room out of shared walls is Phase 4 wall editing).
 */
export function movableRoomIds(project: Project, sel: Selection): Set<string> {
  const rooms = new Set(sel.filter((r) => r.kind === 'room').map((r) => r.id));
  if (rooms.size === 0) return rooms;
  for (const w of project.walls) {
    if (w.deletedAt !== null) continue;
    const touches = w.roomIds.some((id) => rooms.has(id));
    if (touches && !w.roomIds.every((id) => rooms.has(id))) return new Set();
  }
  return rooms;
}

export interface MoveOrigin {
  /** positions at drag start, so every frame applies the TOTAL delta (no drift) */
  rooms: Record<string, Vec2[]>;
  walls: Record<string, { a: Vec2; b: Vec2 }>;
  points: Record<string, { x: number; y: number; t: number | null }>;
}

/** Snapshot of what a drag of `sel` will move. Wall points slide along their wall; ceiling points move freely. */
export function captureMoveOrigin(project: Project, sel: Selection): MoveOrigin {
  const rooms = movableRoomIds(project, sel);
  const o: MoveOrigin = { rooms: {}, walls: {}, points: {} };
  for (const r of project.rooms) if (rooms.has(r.id)) o.rooms[r.id] = r.vertices.map((v) => ({ ...v }));
  for (const w of project.walls)
    if (w.deletedAt === null && w.roomIds.length > 0 && w.roomIds.every((id) => rooms.has(id)))
      o.walls[w.id] = { a: { ...w.a }, b: { ...w.b } };
  const pointIds = new Set(sel.filter((r) => r.kind === 'point').map((r) => r.id));
  for (const p of project.points)
    if (p.deletedAt === null && (pointIds.has(p.id) || rooms.has(p.roomId)))
      o.points[p.id] = { x: p.x, y: p.y, t: p.t };
  return o;
}

export const isEmptyMove = (o: MoveOrigin) =>
  Object.keys(o.rooms).length === 0 && Object.keys(o.points).length === 0;

/** Applies a total drag delta from `origin`. Room groups snap the delta to the grid when `grid > 0`. */
export function moveRecipe(origin: MoveOrigin, delta: Vec2, grid: number, now: string) {
  const hasRooms = Object.keys(origin.rooms).length > 0;
  const dd = hasRooms && grid > 0 ? snapToGrid(delta, grid) : delta;
  const add = (v: Vec2) => ({ x: v.x + dd.x, y: v.y + dd.y });
  return (d: Draft<Project>) => {
    for (const r of d.rooms) {
      const vs = origin.rooms[r.id];
      if (!vs) continue;
      r.vertices = vs.map(add);
      r.updatedAt = now;
    }
    for (const w of d.walls) {
      const ow = origin.walls[w.id];
      if (!ow) continue;
      w.a = add(ow.a);
      w.b = add(ow.b);
      w.updatedAt = now;
    }
    for (const p of d.points) {
      const op = origin.points[p.id];
      if (!op) continue;
      const wall = p.wallId === null ? undefined : d.walls.find((w) => w.id === p.wallId);
      const target = add({ x: op.x, y: op.y });
      if (wall && !origin.walls[wall.id]) {
        // slide along the (unmoved) wall; keep the same side
        const t = projectOnSegment(target, wall.a, wall.b);
        const anchor = lerp(wall.a, wall.b, op.t ?? projectOnSegment(op, wall.a, wall.b));
        const inset = Math.hypot(op.x - anchor.x, op.y - anchor.y);
        const pos = pointOnWall(wall, t, p.side, inset);
        p.t = t;
        p.x = pos.x;
        p.y = pos.y;
        p.distanceFromCornerCm = Math.round(t * Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y));
      } else {
        p.x = target.x;
        p.y = target.y;
      }
      p.updatedAt = now;
    }
  };
}
