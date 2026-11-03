import { describe, expect, it } from 'vitest';
import { elevationLayout, fromX, fromY, snapCm, toX, toY } from '@/domain/elevation';
import { cornerDistance, leftIsA, tFromCornerDistance } from '@/domain/walls';

describe('viewer-left corner', () => {
  const wall = { a: { x: 0, y: 0 }, b: { x: 300, y: 0 } }; // horizontal, a on the west
  it('from the south (side +1, y down) facing north, west is on the left', () => {
    expect(leftIsA(wall, 1)).toBe(true);
    expect(cornerDistance(wall, 0.2, 1)).toBeCloseTo(60);
  });
  it('from the north the same wall is mirrored', () => {
    expect(leftIsA(wall, -1)).toBe(false);
    expect(cornerDistance(wall, 0.2, -1)).toBeCloseTo(240);
  });
  it('round-trips distance ↔ t on both sides and clamps', () => {
    for (const side of [1, -1] as const) {
      expect(cornerDistance(wall, tFromCornerDistance(wall, 75, side), side)).toBeCloseTo(75);
    }
    expect(tFromCornerDistance(wall, 999, 1)).toBe(1);
  });
  it('vertical walls: facing west from the room east of it, south is on the left', () => {
    const w = { a: { x: 0, y: 200 }, b: { x: 0, y: 0 } };
    // side +1 normal of a→b (up) is (+1, 0): room to the east
    expect(leftIsA(w, 1)).toBe(true);
  });
});

describe('elevation layout', () => {
  const e = { length: 300, displayHeight: 270, points: [{ height: 30 }, { height: 110 }] as never[] };
  const l = elevationLayout(e, 600, 200);
  it('maps distance / height to screen and back', () => {
    for (const d of [0, 60, 150, 300]) expect(fromX(l, toX(l, d))).toBeCloseTo(d);
    for (const h of [0, 30, 110]) expect(fromY(l, toY(l, h))).toBeCloseTo(h);
  });
  it('shows a band ≥120 cm that fits the highest point (1.5×)', () => {
    expect(l.range).toBe(165);
    expect(elevationLayout({ ...e, points: [] }, 600, 200).range).toBe(120);
    expect(elevationLayout({ ...e, points: [{ height: 250 }] as never[] }, 600, 200).range).toBe(270);
  });
  it('clamps drags to the wall and the floor', () => {
    expect(fromX(l, -50)).toBe(0);
    expect(fromX(l, 5000)).toBe(300);
    expect(fromY(l, 9999)).toBe(0);
    expect(toY(l, 0)).toBeLessThan(l.y1); // floor padding keeps badges off the floor line
  });
  it('snaps to 5 cm', () => {
    expect(snapCm(62)).toBe(60);
    expect(snapCm(63)).toBe(65);
  });
});
