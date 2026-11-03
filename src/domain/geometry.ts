import type { Vec2 } from './types';

export type { Vec2 };

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Signed polygon area (shoelace). Positive = clockwise in screen coordinates (y down). */
export function signedArea(vertices: readonly Vec2[]): number {
  let s = 0;
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i]!;
    const q = vertices[(i + 1) % vertices.length]!;
    s += p.x * q.y - q.x * p.y;
  }
  return s / 2;
}

/** Area centroid of a simple polygon; falls back to the vertex average for degenerate input. */
export function polygonCentroid(vertices: readonly Vec2[]): Vec2 {
  const area = signedArea(vertices);
  if (vertices.length === 0) return { x: 0, y: 0 };
  if (Math.abs(area) < 1e-9) {
    const sum = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
    return { x: sum.x / vertices.length, y: sum.y / vertices.length };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i]!;
    const q = vertices[(i + 1) % vertices.length]!;
    const f = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsOf(points: readonly Vec2[]): Bounds | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

/** Viewport that fits `bounds` into a `width × height` screen with `padding` px on each side. */
export function fitViewport(bounds: Bounds, width: number, height: number, padding: number): Viewport {
  const bw = Math.max(bounds.maxX - bounds.minX, 1);
  const bh = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.max(0.05, Math.min((width - padding * 2) / bw, (height - padding * 2) / bh));
  return {
    scale,
    x: (width - bw * scale) / 2 - bounds.minX * scale,
    y: (height - bh * scale) / 2 - bounds.minY * scale,
  };
}

/** Zoom by `factor` keeping the screen point `anchor` fixed. Scale is clamped to [min, max]. */
export function zoomAt(v: Viewport, factor: number, anchor: Vec2, min = 0.1, max = 8): Viewport {
  const scale = Math.min(max, Math.max(min, v.scale * factor));
  const k = scale / v.scale;
  return { scale, x: anchor.x - (anchor.x - v.x) * k, y: anchor.y - (anchor.y - v.y) * k };
}

// ── Viewport transforms ────────────────────────────────────────────────────────

export function screenToWorld(v: Viewport, p: Vec2): Vec2 {
  return { x: (p.x - v.x) / v.scale, y: (p.y - v.y) / v.scale };
}

export function worldToScreen(v: Viewport, p: Vec2): Vec2 {
  return { x: p.x * v.scale + v.x, y: p.y * v.scale + v.y };
}

export function panBy(v: Viewport, dx: number, dy: number): Viewport {
  return { ...v, x: v.x + dx, y: v.y + dy };
}

/**
 * Two-finger gesture: the world points under both fingers at gesture start stay under the fingers
 * (pan + pinch zoom in one). Scale is clamped to [min, max].
 */
export function pinchViewport(
  start: Viewport,
  a0: Vec2,
  b0: Vec2,
  a1: Vec2,
  b1: Vec2,
  min = 0.1,
  max = 8,
): Viewport {
  const d0 = Math.max(distance(a0, b0), 1);
  const d1 = Math.max(distance(a1, b1), 1);
  const scale = Math.min(max, Math.max(min, start.scale * (d1 / d0)));
  const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  const world = screenToWorld(start, m0);
  return { scale, x: m1.x - world.x * scale, y: m1.y - world.y * scale };
}

export type WheelKind = 'zoom' | 'pan';

/**
 * Mouse wheel → zoom to cursor; trackpad pinch (ctrlKey) → zoom; trackpad two-finger scroll → pan.
 * A wheel "notch" is a line-mode event or a large integer vertical-only delta.
 */
export function classifyWheel(e: {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
}): WheelKind {
  if (e.ctrlKey) return 'zoom';
  if (e.deltaMode === 1 || e.deltaMode === 2) return 'zoom';
  if (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50) return 'zoom';
  return 'pan';
}

/** Zoom factor for a wheel delta (smooth, symmetric: +d then −d returns to the same scale). */
export function wheelZoomFactor(deltaY: number, deltaMode: number): number {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  return Math.exp(-px * 0.0022);
}

// ── Snapping ───────────────────────────────────────────────────────────────────

export function snapToGrid(p: Vec2, grid: number): Vec2 {
  if (grid <= 0) return { ...p };
  return { x: Math.round(p.x / grid) * grid, y: Math.round(p.y / grid) * grid };
}

/** Keeps the length of origin→p but rotates it to the nearest multiple of `stepDeg` (0/45/90…). */
export function snapAngle(origin: Vec2, p: Vec2, stepDeg = 45): Vec2 {
  const len = distance(origin, p);
  if (len === 0) return { ...p };
  const step = (stepDeg * Math.PI) / 180;
  const a = Math.round(Math.atan2(p.y - origin.y, p.x - origin.x) / step) * step;
  const r = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n);
  return { x: r(origin.x + Math.cos(a) * len), y: r(origin.y + Math.sin(a) * len) };
}

// ── Hit testing primitives ─────────────────────────────────────────────────────

/** Parameter t ∈ [0,1] of the closest point on segment a–b to p. */
export function projectOnSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  return Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
}

export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  return distance(p, lerp(a, b, projectOnSegment(p, a, b)));
}

/** Even–odd rule; points exactly on an edge may go either way. */
export function pointInPolygon(p: Vec2, vertices: readonly Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[i]!;
    const b = vertices[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Normalised rectangle from two corners. */
export function rectFromPoints(a: Vec2, b: Vec2): Bounds {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

export function rectContains(r: Bounds, p: Vec2): boolean {
  return p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY;
}
