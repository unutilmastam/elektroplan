'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SymbolChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  icon: ReactNode;
  label: string;
}

/** Outlined chip in the symbol bar; active = solid blue (DESIGN_SYSTEM §2). */
export const SymbolChip = forwardRef<HTMLButtonElement, SymbolChipProps>(function SymbolChip(
  { active, icon, label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        'flex h-11 shrink-0 items-center gap-2.5 rounded-[10px] border px-3.5 text-[15px] whitespace-nowrap transition-[background,border-color,box-shadow] duration-150 md:h-[42px] lg:h-12 lg:px-4 lg:text-[16px] xl:px-5',
        active
          ? 'glow-primary border-primary-hi/60 bg-primary text-white'
          : 'border-white/[0.12] bg-[#0d1527]/85 text-text hover:border-white/25 hover:bg-[#121d33]',
        className,
      )}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
});
