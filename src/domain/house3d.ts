import { distance, pointInPolygon, polygonCentroid } from './geometry';
import { buildRoom3D, DOOR_HEIGHT, type Fixture, type Quad, type V3 } from './room3d';
import type { Project, Vec2 } from './types';

/**
 * PHASE 25 — the whole home as one 3D scene you can walk through (pure): every room, doors standing open,
 * the walls as obstacles (doorways let you through), and where to stand when you start.
 */

export interface Floor {
  roomId: string;
  poly: Vec2[];
  triangles: Array<[number, number, number]>;
}

export interface Scene3D {
  height: number;
  quads: Quad[];
  floors: Floor[];
  fixtures: Fixture[];
  /** ceiling lamps (and the middle of rooms without one) */
  lights: V3[];
  center: V3;
  radius: number;
}

export const EYE_HEIGHT = 160;
export const BODY_RADIUS = 22;
export const MAX_LIGHTS = 8;

/** One room (or the whole home) for the renderer. */
export function buildHouse3D(project: Project, only?: string): Scene3D | null {
  const rooms = project.rooms.filter((r) => r.deletedAt === null && (!only || r.id === only));
  const quads: Quad[] = [];
  const floors: Floor[] = [];
  const fixtures: Fixture[] = [];
  const lamps: V3[] = [];
  const centres: V3[] = [];
  const H = project.settings.wallDisplayHeightCm;
  for (const r of rooms) {
    const room = buildRoom3D(project, r.id, { openDoors: true });
    if (!room) continue;
    quads.push(...room.quads);
    floors.push({ roomId: r.id, poly: room.floor, triangles: room.triangles });
    fixtures.push(...room.fixtures);
    const own = room.fixtures.filter((f) => f.symbolId === 'ceiling-light').map((f): V3 => [f.c[0], H - 30, f.c[2]]);
    lamps.push(...own);
    if (!own.length) centres.push([room.center[0], H - 30, room.center[2]]);
  }
  if (!floors.length) return null;
  quads.push(...doorLeaves(project, only), ...wallCaps(project, only));
  const all = floors.flatMap((f) => f.poly);
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  const center: V3 = [(minX + maxX) / 2, H / 2, (minY + maxY) / 2];
  return {
    height: H,
    quads,
    floors,
    fixtures,
    lights: [...lamps, ...centres].slice(0, MAX_LIGHTS),
    center,
    radius: Math.hypot(maxX - minX, maxY - minY) / 2,
  };
}

/** Each door once, its leaf swung open (≈ 80°) to the side it opens to — so you can walk through. */
function doorLeaves(project: Project, only?: string): Quad[] {
  const out: Quad[] = [];
  for (const o of project.openings) {
    if (o.kind !== 'door') continue;
    const w = project.walls.find((x) => x.id === o.wallId && x.deletedAt === null);
    if (!w || (only && !w.roomIds.includes(only))) continue;
    const len = distance(w.a, w.b);
    if (len < 1) continue;
    const dir = { x: (w.b.x - w.a.x) / len, y: (w.b.y - w.a.y) / len };
    const side = { x: -dir.y * o.swing, y: dir.x * o.swing };
    const u0 = Math.max(0, o.t * len - o.width / 2) + 4;
    const leafW = Math.max(30, o.width - 8);
    const a = Math.PI * (80 / 180);
    const swing = { x: dir.x * Math.cos(a) + side.x * Math.sin(a), y: dir.y * Math.cos(a) + side.y * Math.sin(a) };
    const hinge = { x: w.a.x + dir.x * u0 + side.x * (w.thickness / 2), y: w.a.y + dir.y * u0 + side.y * (w.thickness / 2) };
    const tip = { x: hinge.x + swing.x * leafW, y: hinge.y + swing.y * leafW };
    const h = DOOR_HEIGHT - 4;
    const n: V3 = [-swing.y, 0, swing.x];
    const p: [V3, V3, V3, V3] = [
      [hinge.x, 0, hinge.y],
      [tip.x, 0, tip.y],
      [tip.x, h, tip.y],
      [hinge.x, h, hinge.y],
    ];
    out.push({ surface: 'door', p, n, size: [leafW, h] });
    out.push({ surface: 'door', p: [p[1], p[0], p[3], p[2]], n: [-n[0], 0, -n[2]], size: [leafW, h] });
  }
  return out;
}

/** The top of every wall (a dark band from above, so the walls read as solid). */
function wallCaps(project: Project, only?: string): Quad[] {
  const H = project.settings.wallDisplayHeightCm;
  const out: Quad[] = [];
  for (const w of project.walls) {
    if (w.deletedAt !== null || (only && !w.roomIds.includes(only))) continue;
    const len = distance(w.a, w.b);
    if (len < 1) continue;
    const n = { x: -(w.b.y - w.a.y) / len, y: (w.b.x - w.a.x) / len };
    const h = w.thickness / 2;
    const c = (p: Vec2, s: number): V3 => [p.x + n.x * h * s, H, p.y + n.y * h * s];
    out.push({ surface: 'cap', p: [c(w.a, -1), c(w.b, -1), c(w.b, 1), c(w.a, 1)], n: [0, 1, 0], size: [len, w.thickness] });
  }
  return out;
}

/** How far along the ray the first solid surface facing it is (glass and sky do not stop it). */
export function rayToSurface(quads: readonly Quad[], eye: V3, d: V3): number {
  let best = Infinity;
  for (const q of quads) {
    if (q.surface === 'glass' || q.surface === 'sky') continue;
    const den = d[0] * q.n[0] + d[1] * q.n[1] + d[2] * q.n[2];
    if (den >= -1e-6) continue; // its back: invisible (culled) from here
    const p0 = q.p[0];
    const s = ((p0[0] - eye[0]) * q.n[0] + (p0[1] - eye[1]) * q.n[1] + (p0[2] - eye[2]) * q.n[2]) / den;
    if (s <= 0 || s >= best) continue;
    const hit: V3 = [eye[0] + d[0] * s - p0[0], eye[1] + d[1] * s - p0[1], eye[2] + d[2] * s - p0[2]];
    const ax = (i: number): V3 => [q.p[i]![0] - p0[0], q.p[i]![1] - p0[1], q.p[i]![2] - p0[2]];
    const inside = (a: V3) => {
      const l2 = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
      const k = (hit[0] * a[0] + hit[1] * a[1] + hit[2] * a[2]) / (l2 || 1);
      return k >= -1e-3 && k <= 1 + 1e-3;
    };
    if (inside(ax(1)) && inside(ax(3))) best = s;
  }
  return best;
}

/** Walls as obstacles: centre segments with their half thickness; doorways are gaps. */
export interface Obstacle {
  a: Vec2;
  b: Vec2;
  r: number;
}

export function obstacles(project: Project): Obstacle[] {
  const out: Obstacle[] = [];
  for (const w of project.walls) {
    if (w.deletedAt !== null) continue;
    const len = distance(w.a, w.b);
    if (len < 1) continue;
    const dir = { x: (w.b.x - w.a.x) / len, y: (w.b.y - w.a.y) / len };
    const at = (u: number) => ({ x: w.a.x + dir.x * u, y: w.a.y + dir.y * u });
    const gaps = project.openings
      .filter((o) => o.wallId === w.id && o.kind === 'door')
      .map((o) => [Math.max(0, o.t * len - o.width / 2), Math.min(len, o.t * len + o.width / 2)] as const)
      .sort((x, y) => x[0] - y[0]);
    let u = 0;
    for (const [g0, g1] of gaps) {
      if (g0 > u) out.push({ a: at(u), b: at(g0), r: w.thickness / 2 });
      u = Math.max(u, g1);
    }
    if (u < len) out.push({ a: at(u), b: at(len), r: w.thickness / 2 });
  }
  // the open door leaves stand in the room: you walk round them, not through them
  for (const q of doorLeaves(project).filter((_, i) => i % 2 === 0))
    out.push({ a: { x: q.p[0][0], y: q.p[0][2] }, b: { x: q.p[1][0], y: q.p[1][2] }, r: 2 });
  return out;
}

/** Steps `delta` from `from`, sliding along walls instead of going through them. */
export function walk(from: Vec2, delta: Vec2, obs: Obstacle[], radius = BODY_RADIUS): Vec2 {
  // long steps are split so a fast move cannot jump over a thin wall
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / 8));
  let p = { ...from };
  for (let s = 0; s < steps; s++) {
    p = { x: p.x + delta.x / steps, y: p.y + delta.y / steps };
    for (let it = 0; it < 3; it++)
      for (const o of obs) {
        const ab = { x: o.b.x - o.a.x, y: o.b.y - o.a.y };
        const l2 = ab.x * ab.x + ab.y * ab.y || 1;
        const t = Math.max(0, Math.min(1, ((p.x - o.a.x) * ab.x + (p.y - o.a.y) * ab.y) / l2));
        const q = { x: o.a.x + ab.x * t, y: o.a.y + ab.y * t };
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        const min = o.r + radius;
        if (d >= min) continue;
        const n = d > 1e-6 ? { x: (p.x - q.x) / d, y: (p.y - q.y) / d } : { x: -ab.y / Math.sqrt(l2), y: ab.x / Math.sqrt(l2) };
        p = { x: q.x + n.x * min, y: q.y + n.y * min };
      }
  }
  return p;
}

export function roomAtPoint(project: Project, p: Vec2): string | null {
  return project.rooms.find((r) => r.deletedAt === null && pointInPolygon(p, r.vertices))?.id ?? null;
}

/**
 * Where you stand when the walk starts: back from the middle of the room, looking at the middle of its
 * farthest wall — so most of the room is in view.
 */
export function startPose(project: Project, roomId: string | null): { pos: Vec2; yaw: number } | null {
  const rooms = project.rooms.filter((r) => r.deletedAt === null);
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0];
  if (!room) return null;
  const c = polygonCentroid(room.vertices);
  const mids = room.vertices.map((v, i) => {
    const w = room.vertices[(i + 1) % room.vertices.length]!;
    return { x: (v.x + w.x) / 2, y: (v.y + w.y) / 2 };
  });
  const far = mids.reduce((best, m) => (distance(m, c) > distance(best, c) + 1e-6 ? m : best), mids[0]!);
  const back = { x: c.x - (far.x - c.x) * 0.35, y: c.y - (far.y - c.y) * 0.35 };
  const at = pointInPolygon(back, room.vertices) ? back : c;
  const pos = walk(at, { x: 0, y: 0 }, obstacles(project));
  return { pos, yaw: (Math.atan2(far.x - pos.x, far.y - pos.y) * 180) / Math.PI };
}
