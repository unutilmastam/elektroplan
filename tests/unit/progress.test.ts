import { describe, expect, it } from 'vitest';
import { computeProgress } from '@/domain/progress';
import type { PointStatus } from '@/domain/types';

const pts = (...s: PointStatus[]) => s.map((status) => ({ status, deletedAt: null }));

describe('computeProgress', () => {
  it('returns 0% for an empty project', () => {
    expect(computeProgress([])).toEqual({
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      remaining: 0,
      percent: 0,
      ready: false,
    });
  });
  it('rounds the percentage and counts states', () => {
    const p = computeProgress(pts('completed', 'completed', 'in_progress'));
    expect(p).toMatchObject({
      total: 3,
      completed: 2,
      inProgress: 1,
      pending: 0,
      remaining: 1,
      percent: 67,
      ready: false,
    });
  });
  it('ignores soft-deleted points', () => {
    const p = computeProgress([...pts('completed'), { status: 'pending', deletedAt: '2026-01-01' }]);
    expect(p).toMatchObject({ total: 1, percent: 100, ready: true });
  });
});
