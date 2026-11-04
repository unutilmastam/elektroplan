import { original, type Draft } from 'immer';
import { boundsOf, distanceToSegment, projectOnSegment, type Vec2 } from './geometry';
import type { Selection } from './selection';
import { cleanPolygon, reconcile, type ReconcileOptions } from './topology';
import type { ElectricalPoint, Opening, Project, Room, Wall } from './types';
import { deleteWalls } from './wallEdits';
import { pointOnWall } from './walls';

type Opts = Pick<ReconcileOptions, 'makeId' | 'now'>;

/** Room fill palette. The first one is the reference's dark navy. */
export const ROOM_COLORS = [
  '#0d1628',
  '#3b8bff',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#14b8a6',
  '#ef4444',
] as const;
export const DEFAULT_ROOM_COLOR = ROOM_COLORS[0];
export const WALL_THICKNESS = 16;
/** default distance of a room name above the room centre (world units) */
export const LABEL_LIFT = 36;

const live = <T extends { deletedAt: string | null }>(xs: readonly T[]) =>
  xs.filter((x) => x.deletedAt === null);

/** "Xona N" with the next free number (base comes from i18n). */
export function nextRoomName(p: Project, base: string): string {
  const taken = new Set(live(p.rooms).map((r) => r.name));
  let i = live(p.rooms).length + 1;
  while (taken.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

export function addRoom(
  p: Project,
  vertices: readonly Vec2[],
  shape: Room['shape'],
  info: { id: string; name: string; color?: string },
  opts: Opts,
): Project {
  const order = Math.max(-1, ...p.rooms.map((r) => r.order)) + 1;
  const room: Room = {
    id: info.id,
    name: info.name,
    color: info.color ?? DEFAULT_ROOM_COLOR,
    shape,
    vertices: cleanPolygon(vertices),
    // name sits above the centre, where a ceiling light usually goes (as in the reference)
    labelOffset: { x: 0, y: -LABEL_LIFT },
    order,
    createdAt: opts.now,
    updatedAt: opts.now,
    deletedAt: null,
  };
  const next = { ...p, rooms: [...p.rooms, room] };
  return { ...next, ...reconcile(next, { ...opts, thickness: WALL_THICKNESS }) };
}

/** Replaces a room outline (sketch straightening step 2, so one undo restores the raw sketch). */
export function setRoomVertices(
  p: Project,
  roomId: string,
  vertices: readonly Vec2[],
  shape: Room['shape'],
  opts: Opts,
): Project {
  const rooms = p.rooms.map((r) =>
    r.id === roomId ? { ...r, vertices: cleanPolygon(vertices), shape, updatedAt: opts.now } : r,
  );
  const next = { ...p, rooms };
  return { ...next, ...reconcile(next, opts) };
}

/** Free walls along a polyline. Returns the project and the new wall ids. */
export function addWalls(
  p: Project,
  points: readonly Vec2[],
  opts: Opts,
): { project: Project; ids: string[] } {
  const walls: Wall[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    walls.push({
      id: opts.makeId(),
      a: { ...points[i]! },
      b: { ...points[i + 1]! },
      thickness: WALL_THICKNESS,
      roomIds: [],
      name: null,
      createdAt: opts.now,
      updatedAt: opts.now,
      deletedAt: null,
    });
  }
  const next = { ...p, walls: [...p.walls, ...walls] };
  const r = reconcile(next, opts);
  return {
    project: { ...next, ...r },
    ids: walls.map((w) => w.id).filter((id) => r.walls.some((w) => w.id === id && w.deletedAt === null)),
  };
}

/** Swaps free walls for a straightened polyline. */
export function replaceWalls(
  p: Project,
  wallIds: readonly string[],
  points: readonly Vec2[],
  opts: Opts,
): Project {
  const walls = p.walls.map((w) =>
    wallIds.includes(w.id) ? { ...w, deletedAt: opts.now, updatedAt: opts.now } : w,
  );
  return addWalls({ ...p, walls }, points, opts).project;
}

/** Re-attaches wall-less points of `roomId` to the nearest wall of that room (used after duplication). */
function attach(
  points: ElectricalPoint[],
  walls: readonly Wall[],
  roomId: string,
  now: string,
): ElectricalPoint[] {
  const rw = live(walls).filter((w) => w.roomIds.includes(roomId));
  return points.map((pt) => {
    if (pt.roomId !== roomId || pt.wallId !== null || pt.t === null) return pt;
    const best = rw.map((w) => ({ w, d: distanceToSegment(pt, w.a, w.b) })).sort((a, b) => a.d - b.d)[0];
    if (!best || best.d > 60) return { ...pt, t: null };
    const t = projectOnSegment(pt, best.w.a, best.w.b);
    const inset = best.d;
    const xy = pointOnWall(best.w, t, pt.side, inset);
    const side = Math.hypot(xy.x - pt.x, xy.y - pt.y) < 1 ? pt.side : (-pt.side as 1 | -1);
    const fixed = pointOnWall(best.w, t, side, inset);
    return { ...pt, wallId: best.w.id, t, side, x: fixed.x, y: fixed.y, updatedAt: now };
  });
}

/** Copy of a room (and its points) placed to the right of the original. */
export function duplicateRoom(
  p: Project,
  roomId: string,
  info: { id: string; name: string },
  grid: number,
  opts: Opts,
): Project {
  const src = live(p.rooms).find((r) => r.id === roomId);
  if (!src) return p;
  const b = boundsOf(src.vertices)!;
  const dx = Math.ceil((b.maxX - b.minX + Math.max(grid, 20) * 2) / Math.max(grid, 1)) * Math.max(grid, 1);
  const moved = src.vertices.map((v) => ({ x: v.x + dx, y: v.y }));
  let next = addRoom(p, moved, src.shape, { id: info.id, name: info.name, color: src.color }, opts);
  next = {
    ...next,
    rooms: next.rooms.map((r) => (r.id === info.id ? { ...r, labelOffset: { ...src.labelOffset } } : r)),
  };
  const copies: ElectricalPoint[] = live(p.points)
    .filter((pt) => pt.roomId === roomId)
    .map((pt) => ({
      ...pt,
      id: opts.makeId(),
      roomId: info.id,
      wallId: null,
      x: pt.x + dx,
      y: pt.y,
      status: 'pending',
      statusChangedAt: null,
      createdAt: opts.now,
      updatedAt: opts.now,
    }));
  return { ...next, points: attach([...next.points, ...copies], next.walls, info.id, opts.now) };
}

export type DeleteResult = { project: Project; refused: 'exterior' | 'complex' | null };

/** Deletes a mixed selection: points, openings, rooms (with their points), walls (see deleteWalls). */
export function deleteSelection(p: Project, sel: Selection, opts: Opts): DeleteResult {
  const ids = (k: Selection[number]['kind']) => new Set(sel.filter((r) => r.kind === k).map((r) => r.id));
  const roomIds = ids('room');
  const pointIds = ids('point');
  const openingIds = ids('opening');
  const kill = <T extends { deletedAt: string | null; updatedAt: string }>(x: T): T =>
    x.deletedAt === null ? { ...x, deletedAt: opts.now, updatedAt: opts.now } : x;
  let cur: Project = {
    ...p,
    points: p.points.map((pt) => (pointIds.has(pt.id) || roomIds.has(pt.roomId) ? kill(pt) : pt)),
    openings: p.openings.filter((o) => !openingIds.has(o.id)),
    rooms: p.rooms.map((r) => (roomIds.has(r.id) ? kill(r) : r)),
  };
  if (roomIds.size > 0) cur = { ...cur, ...reconcile(cur, opts) };
  const wallIds = [...ids('wall')].filter((id) => cur.walls.some((w) => w.id === id && w.deletedAt === null));
  if (wallIds.length === 0) return { project: cur, refused: null };
  const r = deleteWalls(cur, wallIds, opts);
  return r.ok ? { project: r.project, refused: null } : { project: cur, refused: r.reason };
}

export function addOpening(
  p: Project,
  wallId: string,
  t: number,
  kind: Opening['kind'],
  width: number,
  id: string,
): Project {
  const wall = live(p.walls).find((w) => w.id === wallId);
  if (!wall) return p;
  const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
  const w = Math.min(width, len * 0.9);
  const half = w / 2 / len;
  const tc = Math.min(1 - half, Math.max(half, t));
  const room = p.rooms.find((r) => r.id === wall.roomIds[0]);
  // doors open into the (first) room
  let swing: 1 | -1 = 1;
  if (room) {
    const c = boundsOf(room.vertices)!;
    const center = { x: (c.minX + c.maxX) / 2, y: (c.minY + c.maxY) / 2 };
    const plus = pointOnWall(wall, tc, 1, 10);
    const minus = pointOnWall(wall, tc, -1, 10);
    swing =
      Math.hypot(plus.x - center.x, plus.y - center.y) <= Math.hypot(minus.x - center.x, minus.y - center.y)
        ? 1
        : -1;
  }
  return { ...p, openings: [...p.openings, { id, wallId, kind, t: tc, width: w, swing }] };
}

/** Simple draft recipes (no topology change). */
export const renameRoomRecipe = (roomId: string, name: string, now: string) => (d: Draft<Project>) => {
  const r = d.rooms.find((x) => x.id === roomId);
  if (r && r.name !== name) {
    r.name = name;
    r.updatedAt = now;
  }
};

/** Optional wall name ("TV devori"); empty = no name. */
export const renameWallRecipe = (wallId: string, name: string | null, now: string) => (d: Draft<Project>) => {
  const w = d.walls.find((x) => x.id === wallId);
  const next = name && name.trim() ? name.trim().slice(0, 60) : null;
  if (w && w.name !== next) {
    w.name = next;
    w.updatedAt = now;
  }
};

export const roomColorRecipe = (roomId: string, color: string, now: string) => (d: Draft<Project>) => {
  const r = d.rooms.find((x) => x.id === roomId);
  if (r && r.color !== color) {
    r.color = color;
    r.updatedAt = now;
  }
};

export const labelOffsetRecipe = (roomId: string, offset: Vec2, now: string) => (d: Draft<Project>) => {
  const r = d.rooms.find((x) => x.id === roomId);
  if (r) {
    r.labelOffset = { x: offset.x, y: offset.y };
    r.updatedAt = now;
  }
};

/**
 * Applies a whole-project result to the draft element by element, so unchanged objects produce no patches
 * (small undo entries, small sync ops).
 */
export function topologyRecipe(next: Project) {
  return (d: Draft<Project>) => {
    const sync = <K extends 'rooms' | 'walls' | 'points' | 'openings'>(k: K) => {
      const arr = d[k] as unknown as unknown[];
      const target = next[k] as unknown as unknown[];
      const base = (original(d[k] as never) ?? []) as unknown[];
      if (base.length !== target.length) {
        (d as unknown as Record<K, unknown[]>)[k] = target;
        return;
      }
      for (let i = 0; i < target.length; i++) if (base[i] !== target[i]) arr[i] = target[i];
    };
    sync('rooms');
    sync('walls');
    sync('points');
    sync('openings');
  };
}
