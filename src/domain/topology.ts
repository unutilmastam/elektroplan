import {
  collinear,
  distance,
  distanceToSegment,
  EPS,
  lerp,
  onSegmentInterior,
  projectOnSegment,
  samePoint,
  signedArea,
} from './geometry';
import type { Opening, Project, Room, Vec2, Wall } from './types';
import { pointOnWall } from './walls';

/**
 * Wall topology (ARCHITECTURE §4.2): walls are DERIVED from room edges (+ free walls), split at every
 * T-junction, one wall per shared segment. `reconcile` recomputes them while keeping existing wall ids,
 * and re-attaches points and openings (wallId + t) by geometry. Pure.
 */

export interface ReconcileOptions {
  makeId: () => string;
  now: string;
  /** maps an old wall's endpoints before matching (wall move: that wall's old position → new position) */
  transform?: (v: Vec2, wallId: string) => Vec2;
  /** thickness for brand-new walls */
  thickness?: number;
}

type Topology = Pick<Project, 'rooms' | 'walls' | 'points' | 'openings'>;

const live = <T extends { deletedAt: string | null }>(xs: readonly T[]) =>
  xs.filter((x) => x.deletedAt === null);

/** Clockwise (screen, y down) without duplicate consecutive vertices. */
export function cleanPolygon(vs: readonly Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (const v of vs) if (!out.length || !samePoint(out[out.length - 1]!, v)) out.push({ x: v.x, y: v.y });
  if (out.length > 1 && samePoint(out[0]!, out[out.length - 1]!)) out.pop();
  return signedArea(out) < 0 ? out.reverse() : out;
}

/** Inserts every T-junction vertex (other rooms' corners, free-wall ends) into the edges it lies on. */
export function normalizeRooms(rooms: readonly Room[], freeWalls: readonly Wall[], now: string): Room[] {
  const liveRooms = live(rooms);
  const anchors: Vec2[] = [...liveRooms.flatMap((r) => r.vertices), ...freeWalls.flatMap((w) => [w.a, w.b])];
  return rooms.map((r) => {
    if (r.deletedAt !== null) return r;
    const out: Vec2[] = [];
    let changed = false;
    r.vertices.forEach((a, i) => {
      const b = r.vertices[(i + 1) % r.vertices.length]!;
      out.push(a);
      const inner = anchors
        .filter((c) => onSegmentInterior(c, a, b))
        .map((c) => ({ c, t: projectOnSegment(c, a, b) }))
        .sort((p, q) => p.t - q.t);
      for (const { c } of inner) {
        if (!samePoint(out[out.length - 1]!, c)) {
          out.push({ x: c.x, y: c.y });
          changed = true;
        }
      }
    });
    return changed ? { ...r, vertices: out, updatedAt: now } : r;
  });
}

interface Segment {
  a: Vec2;
  b: Vec2;
  roomIds: string[];
}

const key = (p: Vec2) => `${Math.round(p.x * 2) / 2}:${Math.round(p.y * 2) / 2}`;
const segKey = (a: Vec2, b: Vec2) => [key(a), key(b)].sort().join('|');

/** Splits free walls at every anchor lying on them. */
function splitFree(w: Wall, anchors: readonly Vec2[]): Array<[Vec2, Vec2]> {
  const cuts = anchors
    .filter((c) => onSegmentInterior(c, w.a, w.b))
    .map((c) => ({ c, t: projectOnSegment(c, w.a, w.b) }))
    .sort((p, q) => p.t - q.t)
    .map((x) => x.c);
  const pts = [w.a, ...cuts, w.b];
  const out: Array<[Vec2, Vec2]> = [];
  for (let i = 0; i < pts.length - 1; i++)
    if (!samePoint(pts[i]!, pts[i + 1]!)) out.push([pts[i]!, pts[i + 1]!]);
  return out;
}

function buildSegments(rooms: readonly Room[], freeWalls: readonly Wall[]): Segment[] {
  const map = new Map<string, Segment>();
  const order: Segment[] = [];
  const add = (a: Vec2, b: Vec2, roomId: string | null) => {
    if (samePoint(a, b)) return;
    const k = segKey(a, b);
    let s = map.get(k);
    if (!s) {
      s = { a, b, roomIds: [] };
      map.set(k, s);
      order.push(s);
    }
    if (roomId && !s.roomIds.includes(roomId)) s.roomIds.push(roomId);
  };
  for (const r of live(rooms))
    r.vertices.forEach((a, i) => add(a, r.vertices[(i + 1) % r.vertices.length]!, r.id));
  const anchors = [...live(rooms).flatMap((r) => r.vertices), ...freeWalls.flatMap((w) => [w.a, w.b])];
  for (const w of freeWalls) for (const [a, b] of splitFree(w, anchors)) add(a, b, null);
  return order;
}

/** Old wall that contains segment s (collinear, both ends inside). */
function coveringWall(s: Segment, olds: ReadonlyArray<{ wall: Wall; a: Vec2; b: Vec2 }>) {
  const exact = olds.find(
    (o) => (samePoint(o.a, s.a) && samePoint(o.b, s.b)) || (samePoint(o.a, s.b) && samePoint(o.b, s.a)),
  );
  if (exact) return exact;
  return olds.find(
    (o) =>
      collinear(o.a, o.b, s.a, s.b) &&
      distanceToSegment(s.a, o.a, o.b) <= EPS &&
      distanceToSegment(s.b, o.a, o.b) <= EPS,
  );
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

export function reconcile(project: Topology, opts: ReconcileOptions): Topology {
  const tf = opts.transform ?? ((v: Vec2) => v);
  const freeWalls = live(project.walls).filter((w) => w.roomIds.length === 0);
  const rooms = normalizeRooms(project.rooms, freeWalls, opts.now);
  const segments = buildSegments(rooms, freeWalls);

  const olds = live(project.walls).map((wall) => ({ wall, a: tf(wall.a, wall.id), b: tf(wall.b, wall.id) }));
  const used = new Set<string>();
  // Longest piece of a split wall keeps its id.
  const bySize = [...segments].sort((p, q) => distance(q.a, q.b) - distance(p.a, p.b));
  const assigned = new Map<Segment, Wall>();
  for (const s of bySize) {
    const o = coveringWall(s, olds);
    const reuse = o && !used.has(o.wall.id) ? o : null;
    const forward = !o || projectOnSegment(s.b, o.a, o.b) >= projectOnSegment(s.a, o.a, o.b);
    const [a, b] = forward ? [s.a, s.b] : [s.b, s.a];
    const roomIds = [...s.roomIds].sort();
    if (reuse) {
      used.add(reuse.wall.id);
      const w = reuse.wall;
      const same =
        samePoint(w.a, a, 1e-9) && samePoint(w.b, b, 1e-9) && sameList([...w.roomIds].sort(), roomIds);
      assigned.set(s, same ? w : { ...w, a: { ...a }, b: { ...b }, roomIds, updatedAt: opts.now });
    } else {
      const base = o?.wall;
      assigned.set(s, {
        id: opts.makeId(),
        a: { ...a },
        b: { ...b },
        thickness: base?.thickness ?? opts.thickness ?? 16,
        roomIds,
        name: null,
        createdAt: opts.now,
        updatedAt: opts.now,
        deletedAt: null,
      });
    }
  }
  const newWalls = segments.map((s) => assigned.get(s)!);
  const walls: Wall[] = [
    ...project.walls.map((w) =>
      w.deletedAt !== null || used.has(w.id)
        ? (newWalls.find((n) => n.id === w.id) ?? w)
        : { ...w, deletedAt: opts.now, updatedAt: opts.now },
    ),
    ...newWalls.filter((n) => !project.walls.some((w) => w.id === n.id)),
  ];

  const oldById = new Map(project.walls.map((w) => [w.id, w]));
  const liveNew = newWalls;
  const findWall = (pos: Vec2, roomId: string | null) => {
    const near = liveNew
      .map((w) => ({ w, d: distanceToSegment(pos, w.a, w.b) }))
      .filter((x) => x.d <= EPS * 2)
      .sort((p, q) => p.d - q.d);
    return (roomId ? near.find((x) => x.w.roomIds.includes(roomId)) : undefined)?.w ?? near[0]?.w ?? null;
  };

  const points = project.points.map((p) => {
    if (p.deletedAt !== null || p.wallId === null) return p;
    const old = oldById.get(p.wallId);
    if (!old) return { ...p, wallId: null, t: null, updatedAt: opts.now };
    const t0 = p.t ?? projectOnSegment(p, old.a, old.b);
    const anchor = lerp(old.a, old.b, t0);
    const inset = distance(p, anchor);
    const pos = lerp(tf(old.a, old.id), tf(old.b, old.id), t0);
    const nw = findWall(pos, p.roomId);
    if (!nw) return { ...p, wallId: null, t: null, updatedAt: opts.now };
    const t = projectOnSegment(pos, nw.a, nw.b);
    const xy = pointOnWall(nw, t, p.side, inset);
    if (nw.id === p.wallId && Math.abs(t - t0) < 1e-9 && samePoint(xy, p, 1e-6)) return p;
    return {
      ...p,
      wallId: nw.id,
      t,
      x: xy.x,
      y: xy.y,
      distanceFromCornerCm: Math.round(t * distance(nw.a, nw.b)),
      updatedAt: opts.now,
    };
  });

  const openings: Opening[] = [];
  for (const o of project.openings) {
    const old = oldById.get(o.wallId);
    if (!old || old.deletedAt !== null) continue;
    const pos = lerp(tf(old.a, old.id), tf(old.b, old.id), o.t);
    const nw = findWall(pos, null);
    if (!nw) continue;
    const t = projectOnSegment(pos, nw.a, nw.b);
    openings.push(nw.id === o.wallId && Math.abs(t - o.t) < 1e-9 ? o : { ...o, wallId: nw.id, t });
  }

  return { rooms, walls, points, openings };
}
