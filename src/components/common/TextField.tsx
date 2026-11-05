'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled text input. Font ≥16px so iOS Safari does not zoom (DEVICES §3). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, className, ...props },
  ref,
) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[14px] text-text max-sm:text-[13px]">
        {label}
        {hint ? <span className="ml-1.5 text-text-dim">({hint})</span> : null}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={cn(
          'h-12 max-sm:h-11 rounded-lg border bg-[#0a1222] px-3.5 text-base text-text outline-none placeholder:text-text-dim focus:border-primary-hi/70',
          error ? 'border-danger/70' : 'border-white/12',
        )}
        {...props}
      />
      {error ? (
        <p id={errId} role="alert" className="text-[13px] text-[#ff7b7b]">
          {error}
        </p>
      ) : null}
    </div>
  );
});
