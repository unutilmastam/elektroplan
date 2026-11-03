import { collinear, distance, lerp, lineIntersection, samePoint, snapToGrid } from './geometry';
import { cleanPolygon, reconcile, type ReconcileOptions } from './topology';
import type { Project, Vec2, Wall } from './types';

/** Wall editing on whole projects (pure). Callers wrap results with `topologyRecipe` for undo. */

type Opts = Pick<ReconcileOptions, 'makeId' | 'now'>;

const liveWalls = (p: Project) => p.walls.filter((w) => w.deletedAt === null);

function unitNormal(w: Pick<Wall, 'a' | 'b'>): Vec2 {
  const len = distance(w.a, w.b) || 1;
  return { x: -(w.b.y - w.a.y) / len, y: (w.b.x - w.a.x) / len };
}

/** Where a wall end goes when the wall moves: it slides along the first non-parallel wall meeting it. */
function movedEnd(p: Project, wall: Wall, end: Vec2, offset: Vec2): Vec2 {
  const shifted = { x: end.x + offset.x, y: end.y + offset.y };
  const other = wall.a === end ? wall.b : wall.a;
  const movedLine: [Vec2, Vec2] = [shifted, { x: other.x + offset.x, y: other.y + offset.y }];
  const guide = liveWalls(p).find((w) => {
    if (w.id === wall.id) return false;
    if (!samePoint(w.a, end) && !samePoint(w.b, end)) return false;
    const n1 = unitNormal(w);
    const n2 = unitNormal(wall);
    return Math.abs(n1.x * n2.y - n1.y * n2.x) > 0.05; // not parallel
  });
  if (!guide) return shifted;
  return lineIntersection(guide.a, guide.b, movedLine[0], movedLine[1]) ?? shifted;
}

/**
 * Moves a wall perpendicular to itself by the normal component of `delta` (grid-snapped).
 * Linked rooms stretch with it; points on the wall keep their `t`.
 */
export function moveWall(p: Project, wallId: string, delta: Vec2, grid: number, opts: Opts): Project {
  const wall = liveWalls(p).find((w) => w.id === wallId);
  if (!wall) return p;
  const n = unitNormal(wall);
  let d = delta.x * n.x + delta.y * n.y;
  if (grid > 0) d = Math.round(d / grid) * grid;
  if (d === 0) return p;
  const off = { x: n.x * d, y: n.y * d };
  const A = wall.a;
  const B = wall.b;
  const A2 = movedEnd(p, wall, A, off);
  const B2 = movedEnd(p, wall, B, off);
  // A wall that continues straight on past an end (same line) stays: the moved wall makes a step there.
  const continues = (E: Vec2) =>
    liveWalls(p).filter(
      (w) =>
        w.id !== wall.id && (samePoint(w.a, E) || samePoint(w.b, E)) && collinear(wall.a, wall.b, w.a, w.b),
    );
  const contA = continues(A);
  const contB = continues(B);

  const rooms = p.rooms.map((r) => {
    if (r.deletedAt !== null || !wall.roomIds.includes(r.id)) return r;
    const vs = r.vertices;
    const out: Vec2[] = [];
    vs.forEach((v, i) => {
      const end = samePoint(v, A)
        ? { E: A, E2: A2, other: B, cont: contA }
        : samePoint(v, B)
          ? { E: B, E2: B2, other: A, cont: contB }
          : null;
      if (!end) return out.push(v);
      if (!end.cont.some((c) => c.roomIds.includes(r.id))) return out.push(end.E2);
      const prev = vs[(i - 1 + vs.length) % vs.length]!;
      if (samePoint(prev, end.other)) out.push(end.E2, end.E);
      else out.push(end.E, end.E2);
    });
    return { ...r, vertices: cleanPolygon(out), updatedAt: opts.now };
  });
  const walls = p.walls.map((w) => (w.id === wall.id && w.roomIds.length === 0 ? { ...w, a: A2, b: B2 } : w));
  const transform = (v: Vec2, id: string) =>
    id !== wall.id ? v : samePoint(v, A) ? A2 : samePoint(v, B) ? B2 : v;
  return { ...p, ...reconcile({ ...p, rooms, walls }, { ...opts, transform }) };
}

/** Splits a wall at `t` (rooms get a new corner there, so each half can be moved separately). */
export function splitWall(p: Project, wallId: string, t: number, grid: number, opts: Opts): Project {
  const wall = liveWalls(p).find((w) => w.id === wallId);
  if (!wall) return p;
  let c = lerp(wall.a, wall.b, Math.min(0.95, Math.max(0.05, t)));
  if (grid > 0) {
    const g = snapToGrid(c, grid);
    // keep the cut on the wall: only use the grid point if it lies on it
    const tg =
      ((g.x - wall.a.x) * (wall.b.x - wall.a.x) + (g.y - wall.a.y) * (wall.b.y - wall.a.y)) /
      distance(wall.a, wall.b) ** 2;
    const onWall = lerp(wall.a, wall.b, tg);
    if (samePoint(onWall, g) && tg > 0.02 && tg < 0.98) c = g;
  }
  if (wall.roomIds.length === 0) {
    const second: Wall = {
      ...wall,
      id: opts.makeId(),
      a: { ...c },
      createdAt: opts.now,
      updatedAt: opts.now,
    };
    const walls = p.walls.map((w) => (w.id === wall.id ? { ...w, b: { ...c }, updatedAt: opts.now } : w));
    return { ...p, ...reconcile({ ...p, walls: [...walls, second] }, opts) };
  }
  const rooms = p.rooms.map((r) => {
    if (r.deletedAt !== null || !wall.roomIds.includes(r.id)) return r;
    const vs = r.vertices;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i]!;
      const b = vs[(i + 1) % vs.length]!;
      if ((samePoint(a, wall.a) && samePoint(b, wall.b)) || (samePoint(a, wall.b) && samePoint(b, wall.a))) {
        return { ...r, vertices: [...vs.slice(0, i + 1), { ...c }, ...vs.slice(i + 1)], updatedAt: opts.now };
      }
    }
    return r;
  });
  return { ...p, ...reconcile({ ...p, rooms }, opts) };
}

export type DeleteWallResult = { ok: true; project: Project } | { ok: false; reason: 'exterior' | 'complex' };

/**
 * Deleting walls: a free wall disappears; a wall shared by two rooms merges them into one room;
 * a room's outer wall cannot be deleted alone (delete or move the room instead).
 */
export function deleteWalls(p: Project, wallIds: readonly string[], opts: Opts): DeleteWallResult {
  let cur = p;
  for (const id of wallIds) {
    const wall = liveWalls(cur).find((w) => w.id === id);
    if (!wall) continue;
    if (wall.roomIds.length === 0) {
      const walls = cur.walls.map((w) =>
        w.id === id ? { ...w, deletedAt: opts.now, updatedAt: opts.now } : w,
      );
      const points = cur.points.map((pt) =>
        pt.wallId === id && pt.deletedAt === null
          ? { ...pt, wallId: null, t: null, updatedAt: opts.now }
          : pt,
      );
      cur = {
        ...cur,
        ...reconcile({ ...cur, walls, points, openings: cur.openings.filter((o) => o.wallId !== id) }, opts),
      };
      continue;
    }
    if (wall.roomIds.length === 1) return { ok: false, reason: 'exterior' };
    const merged = mergeAcross(cur, wall, opts);
    if (!merged) return { ok: false, reason: 'complex' };
    cur = merged;
  }
  return { ok: true, project: cur };
}

function edgeIndex(vs: readonly Vec2[], p: Vec2, q: Vec2): number {
  return vs.findIndex((v, i) => samePoint(v, p) && samePoint(vs[(i + 1) % vs.length]!, q));
}

/** Union of the two rooms of a shared wall (they must share exactly this one wall). */
function mergeAcross(p: Project, wall: Wall, opts: Opts): Project | null {
  const [idA, idB] = [...wall.roomIds].sort((x, y) => {
    const rx = p.rooms.find((r) => r.id === x)!;
    const ry = p.rooms.find((r) => r.id === y)!;
    return rx.order - ry.order;
  }) as [string, string];
  const shared = liveWalls(p).filter((w) => w.roomIds.includes(idA) && w.roomIds.includes(idB));
  if (shared.length !== 1) return null;
  const A = p.rooms.find((r) => r.id === idA)!;
  const B = p.rooms.find((r) => r.id === idB)!;
  let av = A.vertices;
  let i = edgeIndex(av, wall.a, wall.b);
  if (i < 0) {
    av = [...av].reverse();
    i = edgeIndex(av, wall.a, wall.b);
  }
  let bv = B.vertices;
  let j = edgeIndex(bv, wall.b, wall.a);
  if (j < 0) {
    bv = [...bv].reverse();
    j = edgeIndex(bv, wall.b, wall.a);
  }
  if (i < 0 || j < 0) return null;
  const n = av.length;
  const m = bv.length;
  const loopA = Array.from({ length: n }, (_, k) => av[(i + 1 + k) % n]!); // q … p
  const loopB = Array.from({ length: m - 2 }, (_, k) => bv[(j + 2 + k) % m]!); // after p … before q
  const vertices = cleanPolygon([...loopA, ...loopB]);
  const rooms = p.rooms.map((r) =>
    r.id === idA
      ? { ...r, vertices, updatedAt: opts.now }
      : r.id === idB
        ? { ...r, deletedAt: opts.now, updatedAt: opts.now }
        : r,
  );
  const points = p.points.map((pt) => {
    if (pt.deletedAt !== null) return pt;
    let q = pt;
    if (q.roomId === idB) q = { ...q, roomId: idA, updatedAt: opts.now };
    if (q.wallId === wall.id) q = { ...q, wallId: null, t: null, updatedAt: opts.now };
    return q;
  });
  const openings = p.openings.filter((o) => o.wallId !== wall.id);
  return { ...p, ...reconcile({ ...p, rooms, points, openings }, opts) };
}
