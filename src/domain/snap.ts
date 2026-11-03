import { distance, lerp, projectOnSegment, snapAngle, type Vec2 } from './geometry';
import type { Project } from './types';

export interface SnapOptions {
  /** pick radius in world units */
  tolerance: number;
  grid: number;
  /** previous point: enables 0/45/90° snapping */
  from?: Vec2;
}

export type SnapKind = 'corner' | 'wall' | 'angle' | 'grid' | 'free';

const nz = (n: number) => n + 0;

/** Existing corners (room vertices, wall ends) of live geometry. */
export function planAnchors(p: Project): Vec2[] {
  const out: Vec2[] = [];
  for (const r of p.rooms) if (r.deletedAt === null) out.push(...r.vertices);
  for (const w of p.walls) if (w.deletedAt === null) out.push(w.a, w.b);
  return out;
}

/** Drawing snap: existing corner → onto a wall → 45° from `from` (grid along it) → grid. */
export function snapToPlan(p: Project, at: Vec2, o: SnapOptions): { point: Vec2; kind: SnapKind } {
  let best: Vec2 | null = null;
  let bd = o.tolerance;
  for (const a of planAnchors(p)) {
    const d = distance(a, at);
    if (d <= bd) {
      bd = d;
      best = a;
    }
  }
  if (best) return { point: { ...best }, kind: 'corner' };
  const g = (n: number) => (o.grid > 0 ? nz(Math.round(n / o.grid) * o.grid) : n);

  if (o.from) {
    const s = snapAngle(o.from, at, 45);
    if (distance(s, at) <= o.tolerance * 1.5) {
      const dx = s.x - o.from.x;
      const dy = s.y - o.from.y;
      let q: Vec2;
      // line up with an existing corner's x / y when close, else the grid
      const align = (axis: 'x' | 'y', v: number) => {
        let bestA: number | null = null;
        let bestD = o.tolerance;
        for (const a of planAnchors(p)) {
          const d = Math.abs(a[axis] - v);
          if (d <= bestD) {
            bestD = d;
            bestA = a[axis];
          }
        }
        return bestA ?? g(v);
      };
      if (Math.abs(dy) < 1e-9) q = { x: align('x', at.x), y: o.from.y };
      else if (Math.abs(dx) < 1e-9) q = { x: o.from.x, y: align('y', at.y) };
      else {
        const len = Math.abs(g(dx)) || Math.abs(dx);
        q = { x: o.from.x + Math.sign(dx) * len, y: o.from.y + Math.sign(dy) * len };
      }
      return { point: q, kind: 'angle' };
    }
  }

  let bestWall: { a: Vec2; b: Vec2 } | null = null;
  for (const w of p.walls) {
    if (w.deletedAt !== null) continue;
    const t = projectOnSegment(at, w.a, w.b);
    const q = lerp(w.a, w.b, t);
    const d = distance(q, at);
    if (d <= bd) {
      bd = d;
      best = q;
      bestWall = w;
    }
  }
  if (best && bestWall && o.grid > 0) {
    // slide along an axis-aligned wall to the grid, so neighbouring rooms line up exactly
    const w = bestWall;
    const horizontal = Math.abs(w.a.y - w.b.y) < 1e-9;
    const vertical = Math.abs(w.a.x - w.b.x) < 1e-9;
    if (horizontal) {
      const x = Math.min(Math.max(g(best.x), Math.min(w.a.x, w.b.x)), Math.max(w.a.x, w.b.x));
      best = { x, y: w.a.y };
    } else if (vertical) {
      const y = Math.min(Math.max(g(best.y), Math.min(w.a.y, w.b.y)), Math.max(w.a.y, w.b.y));
      best = { x: w.a.x, y };
    }
    for (const a of planAnchors(p))
      if (distance(a, best) <= o.tolerance) return { point: { ...a }, kind: 'corner' };
  }
  if (best) return { point: best, kind: 'wall' };
  if (o.grid > 0) return { point: { x: g(at.x), y: g(at.y) }, kind: 'grid' };
  return { point: { ...at }, kind: 'free' };
}
