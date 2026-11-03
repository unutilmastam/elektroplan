import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '@/domain/project';
import { addRoom } from '@/domain/rooms';
import { snapToPlan } from '@/domain/snap';

const NOW = '2026-11-03T00:00:00.000Z';
let n = 0;
const opts = { makeId: () => `s${++n}`, now: NOW };
const v = (x: number, y: number) => ({ x, y });
const base = addRoom(
  createEmptyProject('p', 'T', NOW),
  [v(-400, -220), v(-80, -220), v(-80, 0), v(-400, 0)],
  'rect',
  { id: 'A', name: 'A' },
  opts,
);

describe('snapToPlan', () => {
  it('prefers an existing corner', () => {
    expect(snapToPlan(base, v(-84, 3), { tolerance: 7, grid: 20 })).toEqual({
      point: v(-80, 0),
      kind: 'corner',
    });
  });
  it('on a wall it slides to the grid along the wall (rooms line up exactly)', () => {
    expect(snapToPlan(base, v(-150, -224), { tolerance: 7, grid: 20 }).point).toEqual(v(-140, -220));
    // near the corner but outside the pick radius: the wall + grid snap still lands on the corner
    expect(snapToPlan(base, v(-90, -226), { tolerance: 7, grid: 20 })).toEqual({
      point: v(-80, -220),
      kind: 'corner',
    });
  });
  it('a horizontal line lines up with an existing corner column', () => {
    // previous point far right on y=300; the cursor is near x = -80 (room corner column)
    expect(snapToPlan(base, v(-71, 304), { tolerance: 12, grid: 20, from: v(200, 300) }).point).toEqual(
      v(-80, 300),
    );
  });

  it('angle snap from the previous point, then the grid', () => {
    expect(snapToPlan(base, v(205, 103), { tolerance: 7, grid: 20, from: v(100, 100) })).toEqual({
      point: v(200, 100),
      kind: 'angle',
    });
    expect(snapToPlan(base, v(311, 312), { tolerance: 7, grid: 20 })).toEqual({
      point: v(320, 320),
      kind: 'grid',
    });
  });
});
