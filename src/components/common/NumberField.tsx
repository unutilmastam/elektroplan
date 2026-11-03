'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { uz } from '@/i18n/uz';

interface NumberFieldProps {
  label: string;
  value: number | null;
  unit?: string;
  /** null = read-only display (editing arrives with point editing in Phase 6) */
  onChange?: ((value: number) => void) | null;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}

/** Label + compact number input with stepper chevrons (Pol'dan balandlik / Chap burchakdan). */
export function NumberField({
  label,
  value,
  unit,
  onChange = null,
  step = 1,
  min = 0,
  max = 10000,
  className,
}: NumberFieldProps) {
  const id = useId();
  const readOnly = onChange === null;
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <label htmlFor={id} className="min-w-0 flex-1 truncate text-[14.5px] text-text">
        {label}
      </label>
      <div className="flex h-11 w-[66px] items-center rounded-lg border border-white/12 bg-[#0a1222] pl-2.5 pr-1 focus-within:border-primary-hi/70">
        <input
          id={id}
          inputMode="numeric"
          readOnly={readOnly}
          value={value ?? ''}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (onChange && Number.isFinite(n)) onChange(clamp(n));
          }}
          className="tabular w-full min-w-0 bg-transparent text-base text-text outline-none"
        />
        <div className="flex flex-col text-text-muted">
          <button
            type="button"
            aria-label={uz.point.increase}
            disabled={readOnly}
            onClick={() => onChange?.(clamp((value ?? 0) + step))}
            className="flex h-4 w-4 items-center justify-center hover:text-text disabled:cursor-not-allowed"
          >
            <ChevronUp size={13} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label={uz.point.decrease}
            disabled={readOnly}
            onClick={() => onChange?.(clamp((value ?? 0) - step))}
            className="flex h-4 w-4 items-center justify-center hover:text-text disabled:cursor-not-allowed"
          >
            <ChevronDown size={13} strokeWidth={2.4} />
          </button>
        </div>
      </div>
      {unit ? <span className="w-5 text-[14.5px] text-text">{unit}</span> : null}
    </div>
  );
}
