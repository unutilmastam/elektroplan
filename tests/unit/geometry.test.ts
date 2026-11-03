import { describe, expect, it } from 'vitest';
import { boundsOf, fitViewport, polygonCentroid, signedArea, zoomAt } from '@/domain/geometry';

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe('geometry', () => {
  it('computes signed area and centroid', () => {
    expect(signedArea(square)).toBe(100);
    expect(polygonCentroid(square)).toEqual({ x: 5, y: 5 });
  });
  it('falls back to vertex average for degenerate polygons', () => {
    expect(
      polygonCentroid([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
      ]),
    ).toEqual({ x: 2, y: 0 });
    expect(polygonCentroid([])).toEqual({ x: 0, y: 0 });
  });
  it('computes bounds', () => {
    expect(boundsOf([])).toBeNull();
    expect(boundsOf(square)).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
  });
  it('fits bounds centred into the screen', () => {
    const v = fitViewport({ minX: 0, minY: 0, maxX: 100, maxY: 50 }, 220, 220, 10);
    expect(v.scale).toBe(2);
    expect(v.x).toBe(10);
    expect(v.y).toBe(60);
  });
  it('zooms around an anchor and clamps the scale', () => {
    const v = zoomAt({ x: 0, y: 0, scale: 1 }, 2, { x: 100, y: 100 });
    expect(v).toEqual({ x: -100, y: -100, scale: 2 });
    expect(zoomAt({ x: 0, y: 0, scale: 7 }, 4, { x: 0, y: 0 }).scale).toBe(8);
  });
});
