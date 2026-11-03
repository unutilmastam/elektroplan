import {
  boundsOf,
  distance,
  distanceToSegment,
  lerp,
  lineIntersection,
  projectOnSegment,
  signedArea,
  type Vec2,
} from './geometry';

/**
 * Freehand sketch → clean shape (owner requirement, PHASES Phase 4):
 * smooth → simplify (Ramer–Douglas–Peucker) → close → merge near-straight corners →
 * snap directions to 0/45/90° → rectangle / square → snap to existing corners, walls and the grid.
 * Open strokes become walls. Pure; tolerances are given in SCREEN pixels and converted with `scale`.
 */

export interface SketchOptions {
  /** viewport scale (screen px per world unit) */
  scale: number;
  /** grid size in world units (0 = off) */
  grid: number;
  /** existing corners / wall ends to snap to */
  anchors: readonly Vec2[];
  /** existing walls to snap onto */
  walls: ReadonlyArray<{ a: Vec2; b: Vec2 }>;
}

export type SketchShape = 'rect' | 'square' | 'polygon';

export type SketchResult =
  | { kind: 'room'; vertices: Vec2[]; raw: Vec2[]; shape: SketchShape }
  | { kind: 'walls'; points: Vec2[]; raw: Vec2[] };

const DEG45 = Math.PI / 4;

function pathLength(pts: readonly Vec2[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += distance(pts[i - 1]!, pts[i]!);
  return s;
}

function smooth(pts: readonly Vec2[], w = 2): Vec2[] {
  return pts.map((_, i) => {
    if (i < w || i >= pts.length - w) return pts[i]!;
    let x = 0;
    let y = 0;
    for (let k = -w; k <= w; k++) {
      x += pts[i + k]!.x;
      y += pts[i + k]!.y;
    }
    return { x: x / (2 * w + 1), y: y / (2 * w + 1) };
  });
}

/** Ramer–Douglas–Peucker on an open polyline. */
export function rdp(pts: readonly Vec2[], eps: number): Vec2[] {
  if (pts.length < 3) return [...pts];
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  let idx = -1;
  let max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distanceToSegment(pts[i]!, a, b);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= eps) return [a, b];
  const left = rdp(pts.slice(0, idx + 1), eps);
  return [...left.slice(0, -1), ...rdp(pts.slice(idx), eps)];
}

/** Turn angle at b (0 = straight). */
function turn(a: Vec2, b: Vec2, c: Vec2): number {
  const t1 = Math.atan2(b.y - a.y, b.x - a.x);
  const t2 = Math.atan2(c.y - b.y, c.x - b.x);
  let d = Math.abs(t2 - t1);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d;
}

/** Drops corners that are nearly straight or make tiny edges. */
function pruneCorners(vs: Vec2[], closed: boolean, minEdge: number): Vec2[] {
  const out = [...vs];
  let changed = true;
  while (changed && out.length > (closed ? 3 : 2)) {
    changed = false;
    const n = out.length;
    const range = closed ? [...Array(n).keys()] : [...Array(n).keys()].slice(1, -1);
    let worst = -1;
    let worstScore = Infinity;
    for (const i of range) {
      const a = out[(i - 1 + n) % n]!;
      const b = out[i]!;
      const c = out[(i + 1) % n]!;
      const ang = turn(a, b, c);
      const short = Math.min(distance(a, b), distance(b, c)) < minEdge;
      if (ang < (25 * Math.PI) / 180 || short) {
        const score = short ? ang - 10 : ang;
        if (score < worstScore) {
          worstScore = score;
          worst = i;
        }
      }
    }
    if (worst >= 0) {
      out.splice(worst, 1);
      changed = true;
    }
  }
  return out;
}

interface Line {
  p: Vec2;
  angle: number;
  len: number;
}

const dir = (angle: number): Vec2 => ({ x: Math.cos(angle), y: Math.sin(angle) });
const sameDir = (a: number, b: number) => {
  let d = Math.abs(a - b) % Math.PI;
  if (d > Math.PI / 2) d = Math.PI - d;
  return d < 1e-6;
};

/** Edge lines snapped to 45° multiples; consecutive parallel lines are merged. */
function snappedLines(vs: readonly Vec2[], closed: boolean): Line[] {
  const n = vs.length;
  const edges = closed ? n : n - 1;
  let lines: Line[] = [];
  for (let i = 0; i < edges; i++) {
    const a = vs[i]!;
    const b = vs[(i + 1) % n]!;
    lines.push({
      p: lerp(a, b, 0.5),
      angle: Math.round(Math.atan2(b.y - a.y, b.x - a.x) / DEG45) * DEG45,
      len: distance(a, b),
    });
  }
  let merged = true;
  while (merged && lines.length > 1) {
    merged = false;
    for (let i = 0; i < lines.length; i++) {
      const j = (i + 1) % lines.length;
      if (!closed && j === 0) break;
      const l1 = lines[i]!;
      const l2 = lines[j]!;
      if (!sameDir(l1.angle, l2.angle)) continue;
      const len = l1.len + l2.len;
      const p = {
        x: (l1.p.x * l1.len + l2.p.x * l2.len) / len,
        y: (l1.p.y * l1.len + l2.p.y * l2.len) / len,
      };
      const next = [...lines];
      next.splice(i, 1, { p, angle: l1.len >= l2.len ? l1.angle : l2.angle, len });
      next.splice(j > i ? j : 0, 1);
      lines = next;
      merged = true;
      break;
    }
  }
  return lines;
}

function intersect(l1: Line, l2: Line): Vec2 | null {
  const d1 = dir(l1.angle);
  const d2 = dir(l2.angle);
  return lineIntersection(l1.p, { x: l1.p.x + d1.x, y: l1.p.y + d1.y }, l2.p, {
    x: l2.p.x + d2.x,
    y: l2.p.y + d2.y,
  });
}

function projectOnLine(p: Vec2, l: Line): Vec2 {
  const d = dir(l.angle);
  const t = (p.x - l.p.x) * d.x + (p.y - l.p.y) * d.y;
  return { x: l.p.x + d.x * t, y: l.p.y + d.y * t };
}

const r2 = (n: number) => Math.round(n * 1000) / 1000;

function snapPoint(p: Vec2, o: SketchOptions, tol: number): Vec2 {
  let best: Vec2 | null = null;
  let bd = tol;
  for (const a of o.anchors) {
    const d = distance(p, a);
    if (d <= bd) {
      bd = d;
      best = a;
    }
  }
  if (best) return { ...best };
  for (const w of o.walls) {
    const q = lerp(w.a, w.b, projectOnSegment(p, w.a, w.b));
    const d = distance(p, q);
    if (d <= bd) {
      bd = d;
      best = q;
    }
  }
  if (best) return { x: r2(best.x), y: r2(best.y) };
  return o.grid > 0
    ? { x: nz(Math.round(p.x / o.grid) * o.grid), y: nz(Math.round(p.y / o.grid) * o.grid) }
    : p;
}

/** Axis value snap for rectangles: an anchor with that coordinate, else the grid. */
function snapCoord(v: number, axis: 'x' | 'y', o: SketchOptions, tol: number): number {
  let best: number | null = null;
  let bd = tol;
  for (const a of o.anchors) {
    const d = Math.abs(a[axis] - v);
    if (d <= bd) {
      bd = d;
      best = a[axis];
    }
  }
  if (best !== null) return best;
  return o.grid > 0 ? nz(Math.round(v / o.grid) * o.grid) : v;
}

const nz = (n: number) => n + 0; // turns -0 into 0

/** The constant a line keeps: y (horizontal), x (vertical), x−y (45° down-right) or x+y (45° down-left). */
function lineKind(angle: number): 'h' | 'v' | 'd1' | 'd2' {
  const k = (((Math.round(angle / DEG45) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  return (['h', 'd1', 'v', 'd2'] as const)[k];
}

/** Moves a line through a nearby existing corner, else onto the grid (keeps its direction). */
function snapLine(l: Line, o: SketchOptions, tol: number): Line {
  const d = dir(l.angle);
  let best: Vec2 | null = null;
  let bd = tol;
  for (const a of o.anchors) {
    const off = Math.abs((a.x - l.p.x) * d.y - (a.y - l.p.y) * d.x);
    if (off <= bd) {
      bd = off;
      best = a;
    }
  }
  if (best) return { ...l, p: { ...best } };
  if (o.grid <= 0) return l;
  const g = (n: number) => nz(Math.round(n / o.grid) * o.grid);
  switch (lineKind(l.angle)) {
    case 'h':
      return { ...l, p: { x: l.p.x, y: g(l.p.y) } };
    case 'v':
      return { ...l, p: { x: g(l.p.x), y: l.p.y } };
    case 'd1':
      return { ...l, p: { x: l.p.y + g(l.p.x - l.p.y), y: l.p.y } };
    default:
      return { ...l, p: { x: g(l.p.x + l.p.y) - l.p.y, y: l.p.y } };
  }
}

const clockwise = (vs: Vec2[]) => (signedArea(vs) < 0 ? [...vs].reverse() : vs);

export function straightenSketch(stroke: readonly Vec2[], o: SketchOptions): SketchResult | null {
  const px = 1 / o.scale;
  const pts: Vec2[] = [];
  for (const p of stroke) if (!pts.length || distance(pts[pts.length - 1]!, p) > px) pts.push(p);
  if (pts.length < 2 || pathLength(pts) < 24 * px) return null;
  const b = boundsOf(pts)!;
  const diag = Math.hypot(b.maxX - b.minX, b.maxY - b.minY);
  const sm = smooth(pts);
  const closeTol = Math.max(32 * px, 0.2 * diag);
  const bigEnough = b.maxX - b.minX > 20 * px && b.maxY - b.minY > 20 * px;
  const closed = bigEnough && distance(sm[0]!, sm[sm.length - 1]!) <= closeTol && pathLength(sm) > 1.6 * diag;
  const eps = Math.max(6 * px, 0.035 * diag);
  const snapTol = 18 * px;

  if (!closed) {
    const raw = rdp(sm, eps);
    const simple = pruneCorners(raw, false, Math.max(14 * px, 0.06 * diag));
    const lines = snappedLines(simple, false);
    const out: Vec2[] = [projectOnLine(simple[0]!, lines[0]!)];
    for (let i = 0; i < lines.length - 1; i++)
      out.push(intersect(lines[i]!, lines[i + 1]!) ?? lines[i + 1]!.p);
    out.push(projectOnLine(simple[simple.length - 1]!, lines[lines.length - 1]!));
    const snapped = out.map((p) => snapPoint(p, o, snapTol));
    return { kind: 'walls', points: snapped, raw };
  }

  // closed: RDP from the point farthest from the start, so the start position does not bias corners
  const ring = distance(sm[0]!, sm[sm.length - 1]!) < px * 2 ? sm.slice(0, -1) : sm;
  let far = 0;
  ring.forEach((p, i) => {
    if (distance(p, ring[0]!) > distance(ring[far]!, ring[0]!)) far = i;
  });
  const h1 = rdp(ring.slice(0, far + 1), eps);
  const h2 = rdp([...ring.slice(far), ring[0]!], eps);
  const rawRing = [...h1.slice(0, -1), ...h2.slice(0, -1)];
  const raw = clockwise(rawRing);
  const corners = pruneCorners(rawRing, true, Math.max(14 * px, 0.08 * diag));
  if (corners.length < 3) return null;
  const rawLines = snappedLines(corners, true);
  if (rawLines.length < 3) return null;
  const lines = rawLines.map((l) => snapLine(l, o, snapTol));
  let vs: Vec2[] = [];
  for (let i = 0; i < lines.length; i++) {
    const p = intersect(lines[(i - 1 + lines.length) % lines.length]!, lines[i]!);
    if (!p) return null;
    vs.push({ x: nz(r2(p.x)), y: nz(r2(p.y)) });
  }

  const axisRect =
    vs.length === 4 &&
    lines.every((l) => Math.abs(Math.sin(l.angle * 2)) < 1e-6) &&
    new Set(vs.map((v) => Math.round(v.x))).size === 2;
  let shape: SketchShape = 'polygon';
  if (axisRect) {
    let x0 = Math.min(...vs.map((v) => v.x));
    let x1 = Math.max(...vs.map((v) => v.x));
    let y0 = Math.min(...vs.map((v) => v.y));
    let y1 = Math.max(...vs.map((v) => v.y));
    const w = x1 - x0;
    const h = y1 - y0;
    shape = Math.abs(w - h) <= 0.12 * Math.max(w, h) ? 'square' : 'rect';
    if (shape === 'square') {
      const side0 = (w + h) / 2;
      const side = o.grid > 0 ? Math.max(o.grid, Math.round(side0 / o.grid) * o.grid) : side0;
      x0 = snapCoord((x0 + x1) / 2 - side0 / 2, 'x', o, snapTol);
      y0 = snapCoord((y0 + y1) / 2 - side0 / 2, 'y', o, snapTol);
      x1 = x0 + side;
      y1 = y0 + side;
    } else {
      x0 = snapCoord(x0, 'x', o, snapTol);
      y0 = snapCoord(y0, 'y', o, snapTol);
      x1 = snapCoord(x1, 'x', o, snapTol);
      y1 = snapCoord(y1, 'y', o, snapTol);
    }
    vs = [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ];
  }
  const clean: Vec2[] = [];
  for (const v of vs) if (!clean.length || distance(clean[clean.length - 1]!, v) > px) clean.push(v);
  if (clean.length >= 2 && distance(clean[0]!, clean[clean.length - 1]!) <= px) clean.pop();
  if (clean.length < 3 || Math.abs(signedArea(clean)) < (30 * px) ** 2) return null;
  return { kind: 'room', vertices: clockwise(clean), raw, shape };
}
