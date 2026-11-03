import type { ElectricalPoint } from './types';

export interface Progress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  remaining: number;
  percent: number;
  ready: boolean;
}

/** docs/DATA_MODEL.md §2 — percent = round(completed / total * 100), total 0 → 0 %. */
export function computeProgress(points: readonly Pick<ElectricalPoint, 'status' | 'deletedAt'>[]): Progress {
  const live = points.filter((p) => p.deletedAt === null);
  const total = live.length;
  const completed = live.filter((p) => p.status === 'completed').length;
  const inProgress = live.filter((p) => p.status === 'in_progress').length;
  const pending = total - completed - inProgress;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return {
    total,
    completed,
    inProgress,
    pending,
    remaining: total - completed,
    percent,
    ready: total > 0 && completed === total,
  };
}
