import { describe, expect, it } from 'vitest';
import type { Opening, Room } from '@/domain/types';
import {
  deriveWallsFromRooms,
  findWallByEndpoints,
  pointOnWall,
  solidIntervals,
  wallDirection,
} from '@/domain/walls';

const NOW = '2026-11-03T00:00:00.000Z';
const room = (id: string, vs: Array<[number, number]>): Room => ({
  id,
  name: id,
  color: '#000',
  shape: 'rect',
  vertices: vs.map(([x, y]) => ({ x, y })),
  labelOffset: { x: 0, y: 0 },
  order: 0,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
});

const a = room('a', [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
]);
const b = room('b', [
  [10, 0],
  [20, 0],
  [20, 10],
  [10, 10],
]);

describe('walls', () => {
  it('creates one wall per edge and shares common edges', () => {
    const walls = deriveWallsFromRooms([a, b], 10, (i) => `w${i}`, NOW);
    expect(walls).toHaveLength(7);
    const shared = findWallByEndpoints(walls, { x: 10, y: 10 }, { x: 10, y: 0 });
    expect(shared?.roomIds).toEqual(['a', 'b']);
  });
  it('skips deleted rooms', () => {
    expect(deriveWallsFromRooms([{ ...a, deletedAt: NOW }], 10, String, NOW)).toHaveLength(0);
  });
  it('names the compass side from the outward normal', () => {
    const walls = deriveWallsFromRooms([a], 10, (i) => `w${i}`, NOW);
    expect(walls.map((w) => wallDirection(w, a))).toEqual(['north', 'east', 'south', 'west']);
  });
  it('offsets a point to either side of the wall', () => {
    const wall = { a: { x: 0, y: 0 }, b: { x: 10, y: 0 } };
    expect(pointOnWall(wall, 0.5, 1, 2)).toEqual({ x: 5, y: 2 });
    expect(pointOnWall(wall, 0.5, -1, 2)).toEqual({ x: 5, y: -2 });
  });
  it('cuts openings out of the wall', () => {
    const wall = { id: 'w', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
    const o: Opening[] = [
      { id: 'o1', wallId: 'w', kind: 'door', t: 0.5, width: 20, swing: 1 },
      { id: 'o2', wallId: 'other', kind: 'window', t: 0.2, width: 20, swing: 1 },
    ];
    expect(solidIntervals(wall, o)).toEqual([
      [0, 0.4],
      [0.6, 1],
    ]);
    expect(solidIntervals(wall, [])).toEqual([[0, 1]]);
  });
});
