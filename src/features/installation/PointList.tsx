'use client';

import type { ElectricalPoint, Project } from '@/domain/types';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { STATUS_COLOR } from './statusColors';

const STATUS_LABEL = {
  get pending() {
    return uz.status.pending;
  },
  get in_progress() {
    return uz.status.inProgress;
  },
  get completed() {
    return uz.status.done;
  },
} as const;

/** Work-order list of points (56 px rows); tap selects. */
export function PointList({
  project,
  points,
  selectedId,
  onSelect,
  showRoom,
}: {
  project: Project;
  points: ElectricalPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showRoom: boolean;
}) {
  if (!points.length)
    return (
      <p className="py-8 text-center text-[14px] text-text-muted" data-testid="install-list">
        {uz.install.noPoints}
      </p>
    );
  return (
    <ul aria-label={uz.install.points} className="flex flex-col gap-1.5" data-testid="install-list">
      {points.map((p) => {
        const room = project.rooms.find((r) => r.id === p.roomId);
        const where = [
          showRoom ? room?.name : null,
          p.mountHeightCm !== null ? `${p.mountHeightCm} ${uz.point.cm}` : uz.install.ceiling,
          p.wallId !== null && p.distanceFromCornerCm !== null
            ? `← ${p.distanceFromCornerCm} ${uz.point.cm}`
            : null,
        ].filter(Boolean);
        return (
          <li key={p.id}>
            <button
              type="button"
              aria-pressed={p.id === selectedId}
              onClick={() => onSelect(p.id)}
              data-point-id={p.id}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left',
                p.id === selectedId
                  ? 'border-primary-hi/70 bg-primary/20'
                  : 'border-white/[0.07] bg-[#0b1322]/70',
              )}
            >
              <SymbolIcon id={p.symbolId} size={32} color={p.color} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{uz.symbols[p.symbolId]}</span>
                <span className="tabular block truncate text-[13px] text-text-muted">
                  {where.join(' · ')}
                </span>
              </span>
              <span
                className="flex shrink-0 items-center gap-1.5 text-[12.5px]"
                style={{ color: STATUS_COLOR[p.status] }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATUS_COLOR[p.status] }}
                  aria-hidden
                />
                {STATUS_LABEL[p.status]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
