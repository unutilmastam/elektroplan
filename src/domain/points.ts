import type { Draft } from 'immer';
import {
  distance,
  distanceToSegment,
  labelAnchor,
  lerp,
  pointInPolygon,
  projectOnSegment,
  type Vec2,
} from './geometry';
import type {
  ElectricalPoint,
  PointStatus,
  Project,
  ProjectSettings,
  Room,
  SymbolDef,
  SymbolId,
  Wall,
} from './types';
import { cornerDistance, pointOnWall, tFromCornerDistance } from './walls';

/** Electrical points (Phase 6): placement on walls / ceilings, moving between walls, editing. Pure. */

/** How far a wall point sits from the wall centre line (world units ≈ cm). */
export const POINT_INSET = 22;

export type PlacementTarget =
  | { kind: 'wall'; wallId: string; roomId: string; t: number; side: 1 | -1; pos: Vec2; rotation: number }
  | { kind: 'room'; roomId: string; pos: Vec2 };

export interface PlacementOptions {
  /** wall pick radius (world units) */
  tolerance: number;
  /** Shift: put a wall symbol freely inside the room (no wall) */
  free?: boolean;
}

type SymbolInfo = Pick<SymbolDef, 'placement' | 'category' | 'defaultMountHeightCm'>;

const liveRooms = (p: Project) => p.rooms.filter((r) => r.deletedAt === null);
const liveWalls = (p: Project) => p.walls.filter((w) => w.deletedAt === null);

/** Smallest live room containing `at`. */
export function roomAt(p: Project, at: Vec2): Room | null {
  let best: { r: Room; area: number } | null = null;
  for (const r of liveRooms(p)) {
    if (!pointInPolygon(at, r.vertices)) continue;
    let a = 0;
    r.vertices.forEach((v, i) => {
      const q = r.vertices[(i + 1) % r.vertices.length]!;
      a += v.x * q.y - q.x * v.y;
    });
    if (!best || Math.abs(a) < best.area) best = { r, area: Math.abs(a) };
  }
  return best?.r ?? null;
}

/** Wall angle normalised to (-90°, 90°] so glyphs never render upside down. */
export function wallAngle(w: Pick<Wall, 'a' | 'b'>): number {
  let deg = (Math.atan2(w.b.y - w.a.y, w.b.x - w.a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return deg;
}

/** Which side of `wall` the room lies on (the side the point faces). */
function sideToward(wall: Wall, t: number, room: Room): 1 | -1 {
  const plus = pointOnWall(wall, t, 1, 10);
  return pointInPolygon(plus, room.vertices) ? 1 : -1;
}

/** The wall `at` is on / near, the room on that side, and the position the point would get. */
export function wallTarget(
  p: Project,
  at: Vec2,
  tolerance: number,
): Extract<PlacementTarget, { kind: 'wall' }> | null {
  let best: { w: Wall; d: number } | null = null;
  for (const w of liveWalls(p)) {
    const d = distanceToSegment(at, w.a, w.b);
    if (d <= w.thickness / 2 + tolerance && (!best || d < best.d)) best = { w, d };
  }
  if (!best) return null;
  const w = best.w;
  const len = distance(w.a, w.b) || 1;
  const margin = Math.min(0.45, 15 / len);
  const t = Math.min(1 - margin, Math.max(margin, projectOnSegment(at, w.a, w.b)));
  // the room on the cursor's side; outside an outer wall → the wall's only room
  const cross = (w.b.x - w.a.x) * (at.y - w.a.y) - (w.b.y - w.a.y) * (at.x - w.a.x);
  const cursorSide: 1 | -1 = cross >= 0 ? 1 : -1;
  const rooms = w.roomIds
    .map((id) => p.rooms.find((r) => r.id === id && r.deletedAt === null))
    .filter((r): r is Room => !!r);
  const probe = pointOnWall(w, t, cursorSide, 10);
  // the room on the tapped side: one of the wall's rooms, or the room around it (a room drawn inside a room:
  // its walls' outer faces are in the outer room), else the wall's own room (tap just outside an outer wall)
  const room = rooms.find((r) => pointInPolygon(probe, r.vertices)) ?? roomAt(p, probe) ?? rooms[0];
  if (!room) return null;
  // the side that was tapped when it is inside the room (both sides of a wall standing inside one room),
  // otherwise the room's side (a tap just outside an outer wall still lands inside)
  const side = pointInPolygon(probe, room.vertices) ? cursorSide : sideToward(w, t, room);
  return {
    kind: 'wall',
    wallId: w.id,
    roomId: room.id,
    t,
    side,
    pos: pointOnWall(w, t, side, POINT_INSET),
    rotation: wallAngle(w),
  };
}

/** Where a symbol goes for a tap at `at` (null = nowhere sensible: outside every room and wall). */
export function placementTarget(
  p: Project,
  at: Vec2,
  symbol: SymbolInfo,
  o: PlacementOptions,
): PlacementTarget | null {
  const room = roomAt(p, at);
  if (symbol.placement === 'ceiling' || o.free) {
    if (!room) return null;
    // a light tapped near the middle of a room goes exactly to the middle
    const c = labelAnchor(room.vertices);
    const near = distance(c, at) <= Math.max(o.tolerance * 1.5, 30);
    return { kind: 'room', roomId: room.id, pos: symbol.placement === 'ceiling' && near ? c : { ...at } };
  }
  const wall = wallTarget(p, at, o.tolerance);
  if (wall) return wall;
  if (symbol.placement === 'any' && room) return { kind: 'room', roomId: room.id, pos: { ...at } };
  return null;
}

/** Default mount height: sockets / switches from the project settings, others from the catalog. */
export function defaultHeight(symbol: SymbolInfo, settings: ProjectSettings): number | null {
  if (symbol.placement === 'ceiling') return null;
  if (symbol.category === 'socket') return settings.defaultSocketHeightCm;
  if (symbol.category === 'switch') return settings.defaultSwitchHeightCm;
  return symbol.defaultMountHeightCm;
}

export function newPoint(
  p: Project,
  target: PlacementTarget,
  symbolId: SymbolId,
  symbol: SymbolInfo & { defaultColor: string },
  id: string,
  now: string,
): ElectricalPoint {
  const wall = target.kind === 'wall' ? p.walls.find((w) => w.id === target.wallId)! : null;
  return {
    id,
    symbolId,
    roomId: target.roomId,
    wallId: wall ? wall.id : null,
    t: target.kind === 'wall' ? target.t : null,
    side: target.kind === 'wall' ? target.side : 1,
    x: target.pos.x,
    y: target.pos.y,
    mountHeightCm: defaultHeight(symbol, p.settings),
    distanceFromCornerCm:
      wall && target.kind === 'wall' ? Math.round(cornerDistance(wall, target.t, target.side)) : null,
    description: '',
    color: symbol.defaultColor,
    label: null,
    status: 'pending',
    statusChangedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export const addPointRecipe = (point: ElectricalPoint) => (d: Draft<Project>) => {
  d.points.push(point);
};

/** Moves one point to where the pointer is: onto the nearest wall (any room) or freely inside a room. */
export function movePointRecipe(base: Project, pointId: string, at: Vec2, o: PlacementOptions, now: string) {
  const pt = base.points.find((x) => x.id === pointId);
  return (d: Draft<Project>) => {
    const dp = d.points.find((x) => x.id === pointId);
    if (!pt || !dp) return;
    // ceiling points (and Shift) move freely inside rooms; wall points jump to a wall near the pointer,
    // otherwise they keep sliding along their own wall
    const room = roomAt(base, at);
    let target: PlacementTarget | null = null;
    if (pt.wallId === null || o.free)
      target = room ? { kind: 'room', roomId: room.id, pos: { ...at } } : null;
    else {
      target = wallTarget(base, at, o.tolerance);
      const own = base.walls.find((w) => w.id === pt.wallId && w.deletedAt === null);
      if (!target && own) {
        const len = distance(own.a, own.b) || 1;
        const margin = Math.min(0.45, 15 / len);
        const t = Math.min(1 - margin, Math.max(margin, projectOnSegment(at, own.a, own.b)));
        const inset = pt.t === null ? POINT_INSET : distance(pt, lerp(own.a, own.b, pt.t));
        target = {
          kind: 'wall',
          wallId: own.id,
          roomId: pt.roomId,
          t,
          side: pt.side,
          pos: pointOnWall(own, t, pt.side, inset),
          rotation: wallAngle(own),
        };
      }
    }
    if (!target) return;
    dp.roomId = target.roomId;
    dp.x = target.pos.x;
    dp.y = target.pos.y;
    if (target.kind === 'wall') {
      const w = base.walls.find((x) => x.id === target.wallId)!;
      dp.wallId = w.id;
      dp.t = target.t;
      dp.side = target.side;
      dp.distanceFromCornerCm = Math.round(cornerDistance(w, target.t, target.side));
    } else {
      dp.wallId = null;
      dp.t = null;
    }
    dp.updatedAt = now;
  };
}

export interface PointPatch {
  symbolId?: SymbolId;
  mountHeightCm?: number | null;
  distanceFromCornerCm?: number | null;
  description?: string;
  color?: string;
  status?: PointStatus;
  x?: number;
  y?: number;
}

/**
 * Edits from the "Tanlangan nuqta" panel. "Chap burchakdan" on a wall point moves it along the wall;
 * X/Y move a ceiling point. Status changes stamp statusChangedAt.
 */
export function updatePointRecipe(pointId: string, patch: PointPatch, now: string) {
  return (d: Draft<Project>) => {
    const p = d.points.find((x) => x.id === pointId);
    if (!p) return;
    let changed = false;
    const set = <K extends keyof PointPatch>(k: K) => {
      const v = patch[k];
      if (v === undefined || (p as unknown as Record<string, unknown>)[k] === v) return;
      (p as unknown as Record<string, unknown>)[k] = v;
      changed = true;
    };
    set('symbolId');
    set('mountHeightCm');
    set('description');
    set('color');
    if (patch.status !== undefined && patch.status !== p.status) {
      p.status = patch.status;
      p.statusChangedAt = now;
      changed = true;
    }
    const wall = p.wallId === null ? undefined : d.walls.find((w) => w.id === p.wallId);
    if (patch.distanceFromCornerCm !== undefined && patch.distanceFromCornerCm !== p.distanceFromCornerCm) {
      p.distanceFromCornerCm = patch.distanceFromCornerCm;
      if (wall && patch.distanceFromCornerCm !== null) {
        const t = tFromCornerDistance(wall, patch.distanceFromCornerCm, p.side);
        const inset = p.t === null ? POINT_INSET : distance(p, lerp(wall.a, wall.b, p.t));
        const xy = pointOnWall(wall, t, p.side, inset);
        p.t = t;
        p.x = xy.x;
        p.y = xy.y;
      }
      changed = true;
    }
    if (!wall && (patch.x !== undefined || patch.y !== undefined)) {
      if (patch.x !== undefined && patch.x !== p.x) {
        p.x = patch.x;
        changed = true;
      }
      if (patch.y !== undefined && patch.y !== p.y) {
        p.y = patch.y;
        changed = true;
      }
    }
    if (changed) p.updatedAt = now;
  };
}

/** Copy next to the original (40 along the wall, or 40 to the right for ceiling points). */
export function duplicatePoint(p: Project, pointId: string, id: string, now: string): ElectricalPoint | null {
  const src = p.points.find((x) => x.id === pointId && x.deletedAt === null);
  if (!src) return null;
  const base = {
    ...src,
    id,
    status: 'pending' as const,
    statusChangedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const wall = src.wallId === null ? undefined : p.walls.find((w) => w.id === src.wallId);
  if (!wall || src.t === null) return { ...base, x: src.x + 40, y: src.y };
  // 40 further from the viewer's left corner (or back, if the wall ends)
  const len = distance(wall.a, wall.b) || 1;
  const d0 = cornerDistance(wall, src.t, src.side);
  const d = d0 + 40 <= len ? d0 + 40 : Math.max(0, d0 - 40);
  const t = tFromCornerDistance(wall, d, src.side);
  const inset = distance(src, lerp(wall.a, wall.b, src.t));
  const xy = pointOnWall(wall, t, src.side, inset);
  return { ...base, t, x: xy.x, y: xy.y, distanceFromCornerCm: Math.round(d) };
}

export const settingsRecipe = (patch: Partial<ProjectSettings>) => (d: Draft<Project>) => {
  Object.assign(d.settings, patch);
};
