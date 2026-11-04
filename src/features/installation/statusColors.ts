import type { PointStatus } from '@/domain/types';

/** Status colours (DESIGN_SYSTEM): no Konva here, so list screens do not load the canvas library. */
export const STATUS_COLOR: Record<PointStatus, string> = {
  pending: '#94a3b8',
  in_progress: '#f59e0b',
  completed: '#22c55e',
};
