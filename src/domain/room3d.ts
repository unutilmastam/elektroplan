import { distance, pointInPolygon, polygonCentroid, signedArea } from './geometry';
import type { ElectricalPoint, Project, SymbolId, Vec2 } from './types';

/**
 * PHASE 23 — a room as 3D surfaces (pure). One plan unit = 1 cm. Axes: X = plan x, Z = plan y, Y = up.
 * Walls are drawn at their inner face with real holes for doors and windows; points sit on the wall at
 * their mounting height; ceiling lights hang from the ceiling.
 */

export type V3 = [number, number, number];

export type Surface =
  | 'wall'
  | 'floor'
  | 'ceiling'
  | 'reveal' // the wall thickness inside a door / window opening
  | 'door'
  | 'frame'
  | 'sill'
  | 'glass'
  | 'sky'
  | 'skirting'
  | 'cap'; // top of a wall, seen from above

/** A flat four-cornered piece, corners in order around it; `n` faces the viewer inside the room. */
export interface Quad {
  surface: Surface;
  p: [V3, V3, V3, V3];
  n: V3;
  /** texture size in cm (u along p0→p1, v along p0→p3) */
  size: [number, number];
}

export interface Fixture {
  roomId: string;
  pointId: string;
  symbolId: SymbolId;
  color: string;
  /** centre of the face, slightly off the wall / ceiling */
  c: V3;
  /** facing direction (into the room) */
  n: V3;
  /** horizontal axis of the face */
  u: V3;
  w: number;
  h: number;
  heightCm: number | null;
  wallId: string | null;
}

export interface Room3D {
  roomId: string;
  name: string;
  height: number;
  floor: Vec2[];
  /** floor / ceiling triangles (plan indices into `floor`) */
  triangles: Array<[number, number, number]>;
  quads: Quad[];
  fixtures: Fixture[];
  eye: V3;
  center: V3;
  /** furthest distance from the centre (for the top view) */
  radius: number;
}

export const DOOR_HEIGHT = 210;
export const WINDOW_SILL = 85;
export const WINDOW_TOP = 210;

/** Real sizes of what hangs on the wall (cm): plates, the AC indoor unit, a TV, a ceiling lamp. */
export function fixtureSize(s: SymbolId): [number, number] {
  switch (s) {
    case 'socket-double':
      return [15.5, 8.5];
    case 'socket-triple':
      return [22.5, 8.5];
    case 'socket-quad':
      return [15.5, 15.5];
    case 'switch-double':
    case 'switch-single':
    case 'socket-single':
    case 'internet':
      return [8.5, 8.5];
    case 'tv':
      return [8.5, 8.5];
    case 'ac':
      return [80, 29];
    case 'ceiling-light':
      return [50, 50];
    case 'led':
      return [100, 4];
    default:
      return [8.5, 8.5];
  }
}

export const DEFAULT_HEIGHT: Partial<Record<SymbolId, number>> = { ac: 220 };

/** Ear clipping for a simple polygon (no holes). */
export function triangulate(poly: readonly Vec2[]): Array<[number, number, number]> {
  const n = poly.length;
  if (n < 3) return [];
  const ccw = signedArea(poly) > 0;
  const idx = Array.from({ length: n }, (_, i) => i);
  const tris: Array<[number, number, number]> = [];
  const cross = (a: Vec2, b: Vec2, c: Vec2) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const inside = (p: Vec2, a: Vec2, b: Vec2, c: Vec2) => {
    const d1 = cross(a, b, p);
    const d2 = cross(b, c, p);
    const d3 = cross(c, a, p);
    return ccw ? d1 > 0 && d2 > 0 && d3 > 0 : d1 < 0 && d2 < 0 && d3 < 0;
  };
  let guard = 0;
  while (idx.length > 3 && guard++ < 10_000) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length]!;
      const ib = idx[i]!;
      const ic = idx[(i + 1) % idx.length]!;
      const [a, b, c] = [poly[ia]!, poly[ib]!, poly[ic]!];
      const convex = ccw ? cross(a, b, c) > 1e-9 : cross(a, b, c) < -1e-9;
      if (!convex) continue;
      if (idx.some((j) => j !== ia && j !== ib && j !== ic && inside(poly[j]!, a, b, c))) continue;
      tris.push([ia, ib, ic]);
      idx.splice(i, 1);
      cut = true;
      break;
    }
    if (!cut) break; // degenerate: give up gracefully
  }
  if (idx.length === 3) tris.push([idx[0]!, idx[1]!, idx[2]!]);
  return tris;
}

const v3 = (p: Vec2, h: number): V3 => [p.x, h, p.y];

/** `openDoors`: leave the door leaves out (the walk-through house adds them, opened, once per door). */
export function buildRoom3D(project: Project, roomId: string, opts: { openDoors?: boolean } = {}): Room3D | null {
  const room = project.rooms.find((r) => r.id === roomId && r.deletedAt === null);
  if (!room || room.vertices.length < 3) return null;
  const H = project.settings.wallDisplayHeightCm;
  const quads: Quad[] = [];
  const fixtures: Fixture[] = [];
  const centroid = polygonCentroid(room.vertices);
  const walls = project.walls.filter((w) => w.deletedAt === null && w.roomIds.includes(room.id));

  for (const w of walls) {
    const len = distance(w.a, w.b);
    if (len < 1) continue;
    const dir = { x: (w.b.x - w.a.x) / len, y: (w.b.y - w.a.y) / len };
    let nrm = { x: -dir.y, y: dir.x };
    const mid = { x: (w.a.x + w.b.x) / 2, y: (w.a.y + w.b.y) / 2 };
    if (!pointInPolygon({ x: mid.x + nrm.x * 4, y: mid.y + nrm.y * 4 }, room.vertices))
      nrm = { x: -nrm.x, y: -nrm.y };
    const half = w.thickness / 2;
    const at = (u: number, inset: number): Vec2 => ({
      x: w.a.x + dir.x * u + nrm.x * inset,
      y: w.a.y + dir.y * u + nrm.y * inset,
    });
    const n: V3 = [nrm.x, 0, nrm.y];
    const rect = (surface: Surface, u0: number, u1: number, v0: number, v1: number, inset = half) => {
      if (u1 - u0 < 0.5 || v1 - v0 < 0.5) return;
      const a = at(u0, inset);
      const b = at(u1, inset);
      quads.push({ surface, p: [v3(a, v0), v3(b, v0), v3(b, v1), v3(a, v1)], n, size: [u1 - u0, v1 - v0] });
    };
    // openings on this wall, left to right, clipped to the wall
    const holes = project.openings
      .filter((o) => o.wallId === w.id)
      .map((o) => {
        const c = o.t * len;
        return {
          o,
          u0: Math.max(0, c - o.width / 2),
          u1: Math.min(len, c + o.width / 2),
          v0: o.kind === 'door' ? 0 : WINDOW_SILL,
          v1: Math.min(H - 5, o.kind === 'door' ? DOOR_HEIGHT : WINDOW_TOP),
        };
      })
      .sort((a, b) => a.u0 - b.u0);
    let u = 0;
    for (const h of holes) {
      rect('wall', u, h.u0, 0, H);
      rect('wall', h.u0, h.u1, 0, h.v0); // under a window
      rect('wall', h.u0, h.u1, h.v1, H); // lintel
      // reveal: the opening goes through the wall
      const side = (uu: number, flip: boolean) => {
        const a = at(uu, half);
        const b = at(uu, -half);
        const s: V3 = flip ? [-dir.x, 0, -dir.y] : [dir.x, 0, dir.y];
        quads.push({
          surface: 'reveal',
          p: [v3(a, h.v0), v3(b, h.v0), v3(b, h.v1), v3(a, h.v1)],
          n: s,
          size: [w.thickness, h.v1 - h.v0],
        });
      };
      side(h.u0, false);
      side(h.u1, true);
      const top0 = at(h.u0, half);
      const top1 = at(h.u1, half);
      const top2 = at(h.u1, -half);
      const top3 = at(h.u0, -half);
      quads.push({
        surface: 'reveal',
        p: [v3(top0, h.v1), v3(top1, h.v1), v3(top2, h.v1), v3(top3, h.v1)],
        n: [0, -1, 0],
        size: [h.u1 - h.u0, w.thickness],
      });
      if (h.o.kind === 'window') {
        quads.push({
          surface: 'sill',
          p: [
            v3(at(h.u0 - 4, half + 6), h.v0),
            v3(at(h.u1 + 4, half + 6), h.v0),
            v3(at(h.u1 + 4, -half), h.v0),
            v3(at(h.u0 - 4, -half), h.v0),
          ],
          n: [0, 1, 0],
          size: [h.u1 - h.u0 + 8, w.thickness + 6],
        });
        // PVC frame: four bars and a mullion, the glass between them
        const fw = 6;
        const midU = (h.u0 + h.u1) / 2;
        rect('frame', h.u0, h.u1, h.v0, h.v0 + fw, 0.5);
        rect('frame', h.u0, h.u1, h.v1 - fw, h.v1, 0.5);
        rect('frame', h.u0, h.u0 + fw, h.v0 + fw, h.v1 - fw, 0.5);
        rect('frame', h.u1 - fw, h.u1, h.v0 + fw, h.v1 - fw, 0.5);
        rect('frame', midU - fw / 2, midU + fw / 2, h.v0 + fw, h.v1 - fw, 0.5);
        rect('glass', h.u0 + fw, h.u1 - fw, h.v0 + fw, h.v1 - fw, 0);
        rect('sky', h.u0 - 260, h.u1 + 260, h.v0 - 200, h.v1 + 320, -half - 90);
      } else {
        if (!opts.openDoors) rect('door', h.u0 + 4, h.u1 - 4, 0, h.v1 - 4, 0);
        // door casing: two jambs and the head
        rect('frame', h.u0 - 6, h.u0, 0, h.v1 + 6, half + 0.8);
        rect('frame', h.u1, h.u1 + 6, 0, h.v1 + 6, half + 0.8);
        rect('frame', h.u0, h.u1, h.v1, h.v1 + 6, half + 0.8);
      }
      u = h.u1;
    }
    rect('wall', u, len, 0, H);
    // skirting board along the floor, broken by the doors
    let su = 0;
    for (const h of holes.filter((x) => x.o.kind === 'door')) {
      rect('skirting', su, h.u0 - 6, 0, 8, half + 1.2);
      su = h.u1 + 6;
    }
    rect('skirting', su, len, 0, 8, half + 1.2);

    // what hangs on this wall, on this room's side
    for (const p of project.points) {
      if (p.deletedAt !== null || p.wallId !== w.id || p.roomId !== room.id || p.t === null) continue;
      fixtures.push(wallFixture(p, at(p.t * len, half + 0.6), nrm, H));
    }
  }

  // ceiling lights and LED (no wall)
  for (const p of project.points) {
    if (p.deletedAt !== null || p.roomId !== room.id || p.wallId !== null) continue;
    if (p.symbolId !== 'ceiling-light' && p.symbolId !== 'led') continue;
    const [w, h] = fixtureSize(p.symbolId);
    fixtures.push({
      pointId: p.id,
      roomId: p.roomId,
      symbolId: p.symbolId,
      color: p.color,
      c: [p.x, H - 0.8, p.y],
      n: [0, -1, 0],
      u: [1, 0, 0],
      w,
      h,
      heightCm: null,
      wallId: null,
    });
  }

  const radius = Math.max(...room.vertices.map((v) => distance(v, centroid)));
  return {
    roomId: room.id,
    name: room.name,
    height: H,
    floor: room.vertices,
    triangles: triangulate(room.vertices),
    quads,
    fixtures,
    eye: [centroid.x, 155, centroid.y],
    center: [centroid.x, H / 2, centroid.y],
    radius,
  };
}

function wallFixture(p: ElectricalPoint, base: Vec2, nrm: Vec2, H: number): Fixture {
  const [w, h] = fixtureSize(p.symbolId);
  const height = Math.min(
    H - h / 2 - 2,
    Math.max(h / 2 + 2, p.mountHeightCm ?? DEFAULT_HEIGHT[p.symbolId] ?? 30),
  );
  return {
    pointId: p.id,
    roomId: p.roomId,
    symbolId: p.symbolId,
    color: p.color,
    c: [base.x, height, base.y],
    n: [nrm.x, 0, nrm.y],
    // the face's x axis points to the right as seen from inside the room
    u: [nrm.y, 0, -nrm.x],
    w,
    h,
    heightCm: p.mountHeightCm,
    wallId: p.wallId,
  };
}
