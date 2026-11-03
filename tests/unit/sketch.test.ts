import { describe, expect, it } from 'vitest';
import { signedArea, type Vec2 } from '@/domain/geometry';
import { rdp, straightenSketch, type SketchOptions } from '@/domain/sketch';

/** Deterministic pseudo-random jitter (shaky finger). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 - 0.5;
  };
}

/** Walks the polygon outline every `step` units adding ±amp jitter and a slight overshoot at the end. */
function shaky(path: Vec2[], { amp = 5, step = 4, seed = 7, close = true } = {}): Vec2[] {
  const r = rng(seed);
  const pts: Vec2[] = [];
  const route = close ? [...path, path[0]!] : path;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]!;
    const b = route[i + 1]!;
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let k = 0; k < n; k++)
      pts.push({
        x: a.x + ((b.x - a.x) * k) / n + r() * amp * 2,
        y: a.y + ((b.y - a.y) * k) / n + r() * amp * 2,
      });
  }
  const last = route[route.length - 1]!;
  pts.push({ x: last.x + 9, y: last.y + 6 }); // finger stops a bit off the start
  return pts;
}

const opts = (extra: Partial<SketchOptions> = {}): SketchOptions => ({
  scale: 1,
  grid: 20,
  anchors: [],
  walls: [],
  ...extra,
});
const v = (x: number, y: number) => ({ x, y });
const sorted = (vs: Vec2[]) => [...vs].sort((a, b) => a.x - b.x || a.y - b.y);

describe('rdp', () => {
  it('keeps only significant corners', () => {
    expect(rdp([v(0, 0), v(5, 0.5), v(10, 0), v(10, 10)], 1)).toEqual([v(0, 0), v(10, 0), v(10, 10)]);
  });
});

describe('straightenSketch', () => {
  it('turns a shaky rectangle into an exact, grid-snapped rectangle', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = straightenSketch(shaky([v(0, 0), v(300, 0), v(300, 200), v(0, 200)], { seed }), opts());
      expect(r?.kind).toBe('room');
      if (r?.kind !== 'room') return;
      expect(r.shape).toBe('rect');
      expect(sorted(r.vertices)).toEqual(sorted([v(0, 0), v(300, 0), v(300, 200), v(0, 200)]));
      expect(signedArea(r.vertices)).toBeGreaterThan(0); // clockwise
      expect(r.raw.length).toBeGreaterThanOrEqual(4); // the un-straightened version for undo
    }
  });

  it('almost-equal sides become a square', () => {
    const r = straightenSketch(shaky([v(100, 100), v(305, 100), v(305, 295), v(100, 295)]), opts());
    expect(r?.kind === 'room' && r.shape).toBe('square');
    if (r?.kind !== 'room') return;
    const xs = r.vertices.map((p) => p.x);
    const ys = r.vertices.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(Math.max(...ys) - Math.min(...ys));
  });

  it('keeps an L-shaped room with right angles', () => {
    const L = [v(0, 0), v(400, 0), v(400, 160), v(200, 160), v(200, 300), v(0, 300)];
    const r = straightenSketch(shaky(L, { seed: 11 }), opts());
    expect(r?.kind === 'room' && r.shape).toBe('polygon');
    if (r?.kind !== 'room') return;
    expect(sorted(r.vertices)).toEqual(sorted(L));
  });

  it('snaps a diagonal side to 45°', () => {
    const shape = [v(0, 0), v(300, 0), v(300, 150), v(150, 300), v(0, 300)];
    const r = straightenSketch(shaky(shape, { seed: 5, amp: 4 }), opts());
    if (r?.kind !== 'room') throw new Error('expected a room');
    expect(r.vertices).toHaveLength(5);
    const diag = r.vertices.find((p, i) => {
      const q = r.vertices[(i + 1) % r.vertices.length]!;
      return p.x !== q.x && p.y !== q.y;
    })!;
    const q = r.vertices[(r.vertices.indexOf(diag) + 1) % r.vertices.length]!;
    expect(Math.abs(q.x - diag.x)).toBe(Math.abs(q.y - diag.y));
  });

  it('snaps to an existing corner instead of the grid', () => {
    const r = straightenSketch(
      shaky([v(310, 0), v(500, 0), v(500, 200), v(310, 200)]),
      opts({ anchors: [v(306, 0), v(306, 200)] }),
    );
    if (r?.kind !== 'room') throw new Error('expected a room');
    expect(Math.min(...r.vertices.map((p) => p.x))).toBe(306);
  });

  it('an open stroke becomes straight walls', () => {
    const r = straightenSketch(shaky([v(0, 0), v(240, 6)], { close: false, amp: 3 }), opts());
    expect(r?.kind).toBe('walls');
    if (r?.kind !== 'walls') return;
    expect(r.points).toEqual([v(0, 0), v(240, 0)]);
    const corner = straightenSketch(
      shaky([v(0, 0), v(200, 0), v(200, 180)], { close: false, amp: 3 }),
      opts(),
    );
    expect(corner?.kind === 'walls' && corner.points).toEqual([v(0, 0), v(200, 0), v(200, 180)]);
  });

  it('ignores taps and tiny scribbles', () => {
    expect(straightenSketch([v(0, 0), v(3, 2)], opts())).toBeNull();
    expect(straightenSketch([], opts())).toBeNull();
  });

  it('tolerances follow the zoom (screen pixels)', () => {
    // Drawn small at high zoom (scale 4): still a clean rectangle on a 5-unit grid.
    const pts = shaky([v(0, 0), v(75, 0), v(75, 50), v(0, 50)], { amp: 1.2, step: 1 });
    const r = straightenSketch(pts, opts({ scale: 4, grid: 5 }));
    if (r?.kind !== 'room') throw new Error('expected a room');
    expect(sorted(r.vertices)).toEqual(sorted([v(0, 0), v(75, 0), v(75, 50), v(0, 50)]));
  });
});
