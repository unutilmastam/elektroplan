import type { Vec2 } from './types';

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
