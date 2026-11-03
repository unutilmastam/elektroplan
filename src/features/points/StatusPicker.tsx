'use client';

import type { PointStatus } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ value: PointStatus; label: string; active: string }> = [
  { value: 'pending', label: uz.status.pending, active: 'bg-white/15 text-white' },
  { value: 'in_progress', label: uz.status.inProgress, active: 'bg-warning/25 text-[#fcd34d]' },
  { value: 'completed', label: uz.status.done, active: 'bg-success/25 text-[#86efac]' },
];

/** Kutilmoqda / Jarayonda / Bajarildi segmented control. */
export function StatusPicker({
  value,
  onChange,
}: {
  value: PointStatus;
  onChange: (v: PointStatus) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={uz.point.status}
      className="grid grid-cols-3 gap-0.5 rounded-[10px] bg-[#0a1222] p-0.5"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-8 items-center lg:h-9 justify-center rounded-[8px] px-0.5 text-[12.5px] font-medium transition-colors',
            value === o.value ? o.active : 'text-text-muted hover:text-text',
          )}
        >
          <span className="truncate">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
