'use client';

import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { uz } from '@/i18n/uz';

interface NumberFieldProps {
  label: string;
  value: number | null;
  unit?: string;
  /** null = read-only display; empty input reports null */
  onChange?: ((value: number | null) => void) | null;
  /** called when editing ends (seal the undo step) */
  onCommit?: () => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}

/** Label + number input with finger-sized − / + buttons (Pol'dan balandlik / Chap burchakdan). */
export function NumberField({
  label,
  value,
  unit,
  onChange = null,
  step = 1,
  min = 0,
  max = 10000,
  className,
  onCommit,
}: NumberFieldProps) {
  const id = useId();
  const readOnly = onChange === null;
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <label htmlFor={id} className="min-w-0 flex-1 truncate text-[14.5px] text-text">
        {label}
      </label>
      <div className="flex h-11 shrink-0 items-center rounded-lg border border-white/12 bg-[#0a1222] focus-within:border-primary-hi/70">
        <button
          type="button"
          aria-label={uz.point.decrease}
          disabled={readOnly}
          onClick={() => {
            onChange?.(clamp((value ?? 0) - step));
            onCommit?.();
          }}
          className="flex h-11 w-9 items-center justify-center rounded-l-lg text-text-muted hover:bg-white/[0.06] hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={16} strokeWidth={2.4} aria-hidden />
        </button>
        <input
          id={id}
          inputMode="numeric"
          readOnly={readOnly}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value.trim().replace(',', '.');
            if (!onChange) return;
            if (raw === '') return onChange(null);
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(clamp(Math.round(n)));
          }}
          onBlur={onCommit}
          className="tabular h-full w-12 min-w-0 bg-transparent text-center text-base text-text outline-none"
        />
        <button
          type="button"
          aria-label={uz.point.increase}
          disabled={readOnly}
          onClick={() => {
            onChange?.(clamp((value ?? 0) + step));
            onCommit?.();
          }}
          className="flex h-11 w-9 items-center justify-center rounded-r-lg text-text-muted hover:bg-white/[0.06] hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      {unit ? <span className="w-5 text-[14.5px] text-text">{unit}</span> : null}
    </div>
  );
}
