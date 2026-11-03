'use client';

import { cn } from '@/lib/cn';

export interface Swatch {
  value: string;
  label: string;
}

interface ColorSwatchesProps {
  swatches: readonly Swatch[];
  value: string | null;
  /** null = display only (editing arrives in Phase 6) */
  onChange?: ((value: string) => void) | null;
}

/** Round colour picker (Rang). */
export function ColorSwatches({ swatches, value, onChange = null }: ColorSwatchesProps) {
  return (
    <div role="radiogroup" className="flex items-center gap-[11px]">
      {swatches.map((s) => {
        const active = value?.toLowerCase() === s.value.toLowerCase();
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={s.label}
            disabled={onChange === null}
            onClick={() => onChange?.(s.value)}
            className={cn(
              'relative h-[22px] w-[22px] rounded-full transition-transform duration-150 disabled:cursor-default',
              active && 'ring-2 ring-white ring-offset-2 ring-offset-[#101a2e]',
            )}
            style={{ background: s.value }}
          />
        );
      })}
    </div>
  );
}
