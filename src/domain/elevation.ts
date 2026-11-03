import type { WallElevation } from './selectors';

/**
 * Screen layout of the wall view (SVG). Schematic, not CAD: the horizontal axis is the wall length from the
 * viewer's left corner; the vertical axis shows the band that holds the points (≥120 cm, ≤ wall height),
 * so low sockets don't sit on the floor line. Pure and invertible (used for dragging).
 */
export interface ElevationLayout {
  x0: number;
  x1: number;
  y0: number;
  /** floor line */
  y1: number;
  length: number;
  /** vertical range shown, cm */
  range: number;
  floorPad: number;
  badge: number;
  maxHeight: number;
}

export const ELEVATION_MARGIN = { left: 26, right: 84, top: 8, bottom: 34 };

export function elevationLayout(
  e: Pick<WallElevation, 'length' | 'displayHeight' | 'points'>,
  width: number,
  height: number,
): ElevationLayout {
  const M = ELEVATION_MARGIN;
  const x0 = M.left;
  const x1 = Math.max(x0 + 40, width - M.right);
  const y0 = M.top;
  const y1 = Math.max(y0 + 40, height - M.bottom);
  const badge = Math.max(18, Math.min(26, (y1 - y0) * 0.16));
  const maxHeight = e.points.reduce((m, p) => Math.max(m, p.height), 0);
  const range = Math.min(e.displayHeight, Math.max(120, maxHeight * 1.5));
  return { x0, x1, y0, y1, length: e.length, range, floorPad: badge * 0.9, badge, maxHeight };
}

export function toX(l: ElevationLayout, distance: number): number {
  return l.x0 + (Math.min(Math.max(distance, 0), l.length) / (l.length || 1)) * (l.x1 - l.x0);
}

export function toY(l: ElevationLayout, height: number): number {
  return l.y1 - l.floorPad - (Math.min(Math.max(height, 0), l.range) / l.range) * (l.y1 - l.y0 - l.floorPad);
}

/** Screen x → distance from the left corner (cm), clamped to the wall. */
export function fromX(l: ElevationLayout, x: number): number {
  const f = (x - l.x0) / (l.x1 - l.x0 || 1);
  return Math.min(l.length, Math.max(0, f * l.length));
}

/** Screen y → height above the floor (cm), clamped to the visible band. */
export function fromY(l: ElevationLayout, y: number): number {
  const f = (l.y1 - l.floorPad - y) / (l.y1 - l.y0 - l.floorPad || 1);
  return Math.min(l.range, Math.max(0, f * l.range));
}

/** Electricians think in whole 5 cm steps when dragging. */
export function snapCm(v: number, step = 5): number {
  return Math.round(v / step) * step;
}
