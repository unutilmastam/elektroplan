import { distance, samePoint } from './geometry';
import { reconcile, type ReconcileOptions } from './topology';
import type { Project, Vec2, Wall } from './types';
import { moveWall } from './wallEdits';

/**
 * PHASE 18 — optional sizes. One plan unit is one centimetre (walls are 16 cm, the grid 20 cm), so a
 * drawing has real sizes without anyone typing them; typing a length is optional.
 */
export const CM_PER_UNIT = 1;
export const MIN_WALL_CM = 20;
export const MAX_WALL_CM = 10_000;

export const lengthCm = (a: Vec2, b: Vec2) => Math.round(distance(a, b) * CM_PER_UNIT);

/** "85 sm", "3,2 m", "12,45 m" (units come from the dictionary; comma decimals as written in UZ/RU). */
export function formatLength(cm: number, units: { m: string; cm: string }): string {
  const v = Math.round(cm);
  if (v < 100) return `${v} ${units.cm}`;
  const m = (v / 100).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
  return `${m} ${units.m}`;
}

/** "3,2" / "320 sm" / "3.2 m" / "320" → cm. Bare numbers ≤ 30 are metres, larger ones centimetres. */
export function parseLength(input: string): number | null {
  const s = input.trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
  const m = /^(\d+(?:\.\d+)?)(m|м|sm|cm|см)?$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  const cm = unit === 'm' || unit === 'м' ? n * 100 : unit ? n : n <= 30 ? n * 100 : n;
  const r = Math.round(cm);
  return r >= MIN_WALL_CM && r <= MAX_WALL_CM ? r : null;
}

type Opts = Pick<ReconcileOptions, 'makeId' | 'now'>;

const live = (p: Project) => p.walls.filter((w) => w.deletedAt === null);

/** A wall meeting `end` that is not parallel to `wall` (the one that moves to stretch it). */
function crossWallAt(p: Project, wall: Wall, end: Vec2): Wall | null {
  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  const len = Math.hypot(dx, dy) || 1;
  return (
    live(p).find((w) => {
      if (w.id === wall.id || (!samePoint(w.a, end) && !samePoint(w.b, end))) return false;
      const ex = w.b.x - w.a.x;
      const ey = w.b.y - w.a.y;
      return Math.abs(dx * ey - dy * ex) / (len * (Math.hypot(ex, ey) || 1)) > 0.05;
    }) ?? null
  );
}

/**
 * Sets a wall to `cm` long. The wall at its `b` end (else its `a` end) moves, so a rectangular room stays
 * rectangular and the rooms beside it stretch with it — the same as dragging that wall by hand.
 * A free-standing wall just gets a new `b`.
 */
export function setWallLength(p: Project, wallId: string, cm: number, opts: Opts): Project {
  const wall = live(p).find((w) => w.id === wallId);
  if (!wall) return p;
  const len = distance(wall.a, wall.b);
  if (len === 0) return p;
  const target = cm / CM_PER_UNIT;
  const delta = target - len;
  if (Math.abs(delta) < 0.5) return p;
  const dir = { x: (wall.b.x - wall.a.x) / len, y: (wall.b.y - wall.a.y) / len };
  if (wall.roomIds.length === 0 && !crossWallAt(p, wall, wall.b) && !crossWallAt(p, wall, wall.a)) {
    const b = { x: wall.a.x + dir.x * target, y: wall.a.y + dir.y * target };
    const walls = p.walls.map((w) => (w.id === wall.id ? { ...w, b } : w));
    const transform = (v: Vec2, id: string) => (id === wall.id && samePoint(v, wall.b) ? b : v);
    return { ...p, ...reconcile({ ...p, walls }, { ...opts, transform }) };
  }
  const atB = crossWallAt(p, wall, wall.b);
  if (atB) return moveWall(p, atB.id, { x: dir.x * delta, y: dir.y * delta }, 0, opts);
  const atA = crossWallAt(p, wall, wall.a);
  if (atA) return moveWall(p, atA.id, { x: -dir.x * delta, y: -dir.y * delta }, 0, opts);
  return p;
}

/** The live wall that `old` became after `setWallLength(…, cm)` (one end stays put, same direction). */
export function resizedWall(p: Project, old: Pick<Wall, 'a' | 'b'>, cm: number): string | null {
  const len = distance(old.a, old.b) || 1;
  const dir = { x: (old.b.x - old.a.x) / len, y: (old.b.y - old.a.y) / len };
  const t = cm / CM_PER_UNIT;
  const options: Array<[Vec2, Vec2]> = [
    [old.a, { x: old.a.x + dir.x * t, y: old.a.y + dir.y * t }],
    [{ x: old.b.x - dir.x * t, y: old.b.y - dir.y * t }, old.b],
  ];
  const hit = live(p).find((w) =>
    options.some(
      ([a, b]) => (samePoint(w.a, a) && samePoint(w.b, b)) || (samePoint(w.a, b) && samePoint(w.b, a)),
    ),
  );
  return hit?.id ?? null;
}
