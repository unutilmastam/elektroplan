'use client';

import { CircleCheck, CircleDashed, Hammer } from 'lucide-react';
import type { PointStatus } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ value: PointStatus; label: string; icon: typeof CircleCheck; on: string }> = [
  {
    value: 'pending',
    get label() {
      return uz.status.pending;
    },
    icon: CircleDashed,
    on: 'border-white/40 bg-white/15 text-white',
  },
  {
    value: 'in_progress',
    get label() {
      return uz.status.inProgress;
    },
    icon: Hammer,
    on: 'border-warning bg-warning/25 text-[#fde68a]',
  },
  {
    value: 'completed',
    get label() {
      return uz.status.done;
    },
    icon: CircleCheck,
    on: 'border-success bg-success/25 text-[#bbf7d0]',
  },
];

/** Three big status buttons — 64 px tall, usable with work gloves and one thumb. */
export function StatusButtons({
  value,
  onChange,
}: {
  value: PointStatus;
  onChange: (s: PointStatus) => void;
}) {
  return (
    <div role="radiogroup" aria-label={uz.install.setStatus} className="grid grid-cols-3 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-[14px] font-semibold transition-colors active:scale-[0.98]',
            value === o.value ? o.on : 'border-white/10 bg-[#0a1222] text-text-muted',
          )}
        >
          <o.icon size={22} aria-hidden />
          {o.label}
        </button>
      ))}
    </div>
  );
}
