import { describe, expect, it } from 'vitest';
import {
  classifyWheel,
  distanceToSegment,
  panBy,
  pinchViewport,
  pointInPolygon,
  projectOnSegment,
  rectContains,
  rectFromPoints,
  screenToWorld,
  snapAngle,
  snapToGrid,
  wheelZoomFactor,
  worldToScreen,
} from '@/domain/geometry';

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
};

describe('viewport transforms', () => {
  const v = { x: 100, y: 50, scale: 2 };
  it('round-trips screen ↔ world', () => {
    close(screenToWorld(v, worldToScreen(v, { x: 7, y: -3 })), { x: 7, y: -3 });
    expect(screenToWorld(v, { x: 100, y: 50 })).toEqual({ x: 0, y: 0 });
  });
  it('pans by a screen delta', () => {
    expect(panBy(v, 10, -5)).toEqual({ x: 110, y: 45, scale: 2 });
  });
});

describe('pinchViewport', () => {
  const start = { x: 0, y: 0, scale: 1 };
  it('keeps the world points under the fingers', () => {
    const a0 = { x: 100, y: 100 };
    const b0 = { x: 200, y: 100 };
    const a1 = { x: 50, y: 120 };
    const b1 = { x: 250, y: 120 };
    const v = pinchViewport(start, a0, b0, a1, b1);
    expect(v.scale).toBeCloseTo(2);
    close(worldToScreen(v, screenToWorld(start, a0)), a1);
    close(worldToScreen(v, screenToWorld(start, b0)), b1);
  });
  it('pure two-finger drag pans without zooming', () => {
    const v = pinchViewport(start, { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 7 }, { x: 15, y: 7 });
    expect(v).toEqual({ x: 5, y: 7, scale: 1 });
  });
  it('clamps the scale', () => {
    expect(
      pinchViewport(start, { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }, { x: 1000, y: 0 }).scale,
    ).toBe(8);
  });
});

describe('wheel', () => {
  it('classifies mouse wheel, trackpad pinch and trackpad scroll', () => {
    expect(classifyWheel({ deltaX: 0, deltaY: 100, deltaMode: 0, ctrlKey: false })).toBe('zoom');
    expect(classifyWheel({ deltaX: 0, deltaY: 3, deltaMode: 1, ctrlKey: false })).toBe('zoom');
    expect(classifyWheel({ deltaX: 0, deltaY: 2.5, deltaMode: 0, ctrlKey: true })).toBe('zoom');
    expect(classifyWheel({ deltaX: 4, deltaY: 12.3, deltaMode: 0, ctrlKey: false })).toBe('pan');
    expect(classifyWheel({ deltaX: 0, deltaY: 8, deltaMode: 0, ctrlKey: false })).toBe('pan');
  });
  it('zoom factor is symmetric and direction-correct', () => {
    expect(wheelZoomFactor(-100, 0)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0) * wheelZoomFactor(-100, 0)).toBeCloseTo(1);
    expect(wheelZoomFactor(3, 1)).toBeCloseTo(wheelZoomFactor(48, 0));
  });
});

describe('snapping', () => {
  it('snaps to the grid', () => {
    expect(snapToGrid({ x: 29, y: -11 }, 20)).toEqual({ x: 20, y: -20 });
    expect(snapToGrid({ x: 29, y: 11 }, 0)).toEqual({ x: 29, y: 11 });
  });
  it('snaps direction to 0/45/90° keeping length', () => {
    close(snapAngle({ x: 0, y: 0 }, { x: 10, y: 1 }), { x: 10.0498756, y: 0 });
    const d = snapAngle({ x: 0, y: 0 }, { x: 10, y: 9 });
    expect(d.x).toBeCloseTo(d.y);
    close(snapAngle({ x: 5, y: 5 }, { x: 6, y: 25 }), { x: 5, y: 5 + Math.hypot(1, 20) });
    expect(snapAngle({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
  });
});

describe('hit primitives', () => {
  it('projects onto and measures distance to a segment', () => {
    expect(projectOnSegment({ x: 5, y: 9 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0.5);
    expect(projectOnSegment({ x: -5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
    expect(projectOnSegment({ x: 3, y: 3 }, { x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
    expect(distanceToSegment({ x: 5, y: 9 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(9);
    expect(distanceToSegment({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
  });
  it('tests points in polygons (incl. concave)', () => {
    const L = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon({ x: 2, y: 8 }, L)).toBe(true);
    expect(pointInPolygon({ x: 8, y: 8 }, L)).toBe(false);
    expect(pointInPolygon({ x: 8, y: 2 }, L)).toBe(true);
    expect(pointInPolygon({ x: -1, y: 2 }, L)).toBe(false);
  });
  it('builds and queries rectangles', () => {
    const r = rectFromPoints({ x: 10, y: 0 }, { x: 0, y: 5 });
    expect(r).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 5 });
    expect(rectContains(r, { x: 10, y: 5 })).toBe(true);
    expect(rectContains(r, { x: 11, y: 5 })).toBe(false);
  });
});

describe('labelAnchor', () => {
  it('uses the centroid for convex rooms and a deep inside point for L shapes', async () => {
    const { labelAnchor, pointInPolygon, distanceToSegment } = await import('@/domain/geometry');
    const sq = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(labelAnchor(sq)).toEqual({ x: 50, y: 50 });
    const L = [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 60 },
      { x: 60, y: 60 },
      { x: 60, y: 300 },
      { x: 0, y: 300 },
    ];
    const a = labelAnchor(L);
    expect(pointInPolygon(a, L)).toBe(true);
    const d = Math.min(...L.map((p, i) => distanceToSegment(a, p, L[(i + 1) % L.length]!)));
    expect(d).toBeGreaterThan(20);
  });
});
