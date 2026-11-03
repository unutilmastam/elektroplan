import {
  distance,
  distanceToSegment,
  lerp,
  pointInPolygon,
  labelAnchor,
  projectOnSegment,
  rectContains,
  type Bounds,
} from './geometry';
import type { Project, Vec2 } from './types';

export type EntityKind = 'room' | 'wall' | 'point' | 'opening';
export interface EntityRef {
  kind: EntityKind;
  id: string;
  /** a room hit on its name label (dragging moves the label) */
  part?: 'label';
}
export type Selection = EntityRef[];

export const sameRef = (a: EntityRef, b: EntityRef) => a.kind === b.kind && a.id === b.id;

/** Selection entry without the hit detail (`part`). */
export const plainRef = (r: EntityRef): EntityRef => ({ kind: r.kind, id: r.id });
export const hasRef = (sel: Selection, r: EntityRef) => sel.some((s) => sameRef(s, r));

/** Adds `r`, or removes it when already selected (Shift/Ctrl click). */
export function toggleRef(sel: Selection, r: EntityRef): Selection {
  return hasRef(sel, r) ? sel.filter((s) => !sameRef(s, r)) : [...sel, r];
}

/** Union without duplicates (Shift + marquee). */
export function mergeSelection(a: Selection, b: Selection): Selection {
  return [...a, ...b.filter((r) => !hasRef(a, r))];
}

export interface HitOptions {
  /** extra pick radius in world units (finger ≈ 22px / scale, mouse ≈ 6px / scale) */
  tolerance: number;
  /** half size of a point badge in world units */
  pointRadius: number;
  /** room label font size in world units (0 = labels not pickable) */
  labelSize?: number;
}

/** Centre of a room's name label. */
export function labelCenter(room: {
  vertices: readonly { x: number; y: number }[];
  labelOffset: { x: number; y: number };
}) {
  const c = labelAnchor(room.vertices);
  return { x: c.x + room.labelOffset.x, y: c.y + room.labelOffset.y };
}

/** Topmost entity under `p`: points → walls → rooms (smallest room wins when nested). */
export function hitTest(project: Project, p: Vec2, o: HitOptions): EntityRef | null {
  let best: { id: string; d: number } | null = null;
  for (const pt of project.points) {
    if (pt.deletedAt !== null) continue;
    const d = distance(p, pt);
    if (d <= o.pointRadius + o.tolerance && (!best || d < best.d)) best = { id: pt.id, d };
  }
  if (best) return { kind: 'point', id: best.id };

  // Directly on a wall body (no tolerance) beats a room label drawn over it.
  const strict = { ...o, tolerance: 0 };
  const onOpening = hitOpening(project, p, strict);
  if (onOpening) return onOpening;
  const onWall = hitWall(project, p, 0);
  if (onWall) return onWall;

  const fs = o.labelSize ?? 0;
  if (fs > 0) {
    for (const r of project.rooms) {
      if (r.deletedAt !== null) continue;
      const c = labelCenter(r);
      const hw = Math.max(2, r.name.length) * fs * 0.3 + o.tolerance;
      const hh = fs * 0.6 + o.tolerance * 0.5;
      if (Math.abs(p.x - c.x) <= hw && Math.abs(p.y - c.y) <= hh)
        return { kind: 'room', id: r.id, part: 'label' };
    }
  }

  const nearOpening = hitOpening(project, p, o);
  if (nearOpening) return nearOpening;
  const nearWall = hitWall(project, p, o.tolerance);
  if (nearWall) return nearWall;

  let room: { id: string; area: number } | null = null;
  for (const r of project.rooms) {
    if (r.deletedAt !== null || !pointInPolygon(p, r.vertices)) continue;
    const area = polygonAreaAbs(r.vertices);
    if (!room || area < room.area) room = { id: r.id, area };
  }
  return room ? { kind: 'room', id: room.id } : null;
}

function hitOpening(project: Project, p: Vec2, o: HitOptions): EntityRef | null {
  for (const op of project.openings) {
    const w = project.walls.find((x) => x.id === op.wallId && x.deletedAt === null);
    if (!w) continue;
    const len = distance(w.a, w.b) || 1;
    const t = projectOnSegment(p, w.a, w.b);
    const d = distance(p, lerp(w.a, w.b, t));
    if (Math.abs(t - op.t) * len <= op.width / 2 && d <= w.thickness / 2 + o.tolerance)
      return { kind: 'opening', id: op.id };
  }
  return null;
}

function hitWall(project: Project, p: Vec2, tolerance: number): EntityRef | null {
  let best: { id: string; d: number } | null = null;
  for (const w of project.walls) {
    if (w.deletedAt !== null) continue;
    const d = distanceToSegment(p, w.a, w.b);
    if (d <= w.thickness / 2 + tolerance && (!best || d < best.d)) best = { id: w.id, d };
  }
  return best ? { kind: 'wall', id: best.id } : null;
}

function polygonAreaAbs(vs: readonly Vec2[]): number {
  let s = 0;
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i]!;
    const b = vs[(i + 1) % vs.length]!;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s / 2);
}

/** Marquee: everything lying completely inside the rectangle. */
export function entitiesInRect(project: Project, r: Bounds): Selection {
  const out: Selection = [];
  for (const room of project.rooms)
    if (room.deletedAt === null && room.vertices.length > 0 && room.vertices.every((v) => rectContains(r, v)))
      out.push({ kind: 'room', id: room.id });
  for (const w of project.walls)
    if (w.deletedAt === null && rectContains(r, w.a) && rectContains(r, w.b))
      out.push({ kind: 'wall', id: w.id });
  for (const p of project.points)
    if (p.deletedAt === null && rectContains(r, p)) out.push({ kind: 'point', id: p.id });
  return out;
}

/** Every live entity (Ctrl/Cmd+A). */
export function selectAll(project: Project): Selection {
  return entitiesInRect(project, { minX: -Infinity, minY: -Infinity, maxX: Infinity, maxY: Infinity });
}

/** Drops refs to deleted / unknown entities (after delete or undo). */
export function liveSelection(project: Project, sel: Selection): Selection {
  return sel.filter((r) => {
    if (r.kind === 'opening') return project.openings.some((o) => o.id === r.id);
    const list = r.kind === 'room' ? project.rooms : r.kind === 'wall' ? project.walls : project.points;
    return list.some((e) => e.id === r.id && e.deletedAt === null);
  });
}

export interface PanelFocus {
  pointId: string | null;
  roomId: string | null;
  wallId: string | null;
}

/**
 * What the side panels show for a selection: first selected point → its room/wall;
 * else first wall (+ its first room); else first room (its busiest wall is picked by the caller).
 */
export function panelFocus(project: Project, sel: Selection): PanelFocus {
  const live = liveSelection(project, sel);
  const pointRef = live.find((r) => r.kind === 'point');
  if (pointRef) {
    const p = project.points.find((x) => x.id === pointRef.id)!;
    return { pointId: p.id, roomId: p.roomId, wallId: p.wallId };
  }
  const opening = live.find((r) => r.kind === 'opening');
  const openingWall = opening ? project.openings.find((o) => o.id === opening.id)?.wallId : undefined;
  const wallRef =
    live.find((r) => r.kind === 'wall') ??
    (openingWall ? { kind: 'wall' as const, id: openingWall } : undefined);
  if (wallRef) {
    const w = project.walls.find((x) => x.id === wallRef.id)!;
    const room = live.find((r) => r.kind === 'room' && w.roomIds.includes(r.id));
    return { pointId: null, roomId: room?.id ?? w.roomIds[0] ?? null, wallId: w.id };
  }
  const roomRef = live.find((r) => r.kind === 'room');
  return { pointId: null, roomId: roomRef?.id ?? null, wallId: null };
}
