'use client';

import { PenLine } from 'lucide-react';
import { useId } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/store/settingsStore';

/** Sozlamalar: per-device preferences (stored in IndexedDB meta, work offline). */
export function SettingsScreen() {
  const penOnly = useSettingsStore((s) => s.penOnly);
  const setPenOnly = useSettingsStore((s) => s.setPenOnly);
  const id = useId();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="shrink-0 px-5 py-4">
        <h1 className="text-[22px] font-semibold lg:text-[26px]">{uz.settings.title}</h1>
      </GlassPanel>
      <GlassPanel className="flex flex-col gap-1 p-2">
        <h2 className="px-3 pt-2 pb-1 text-[13px] font-medium tracking-wide text-text-dim uppercase">
          {uz.settings.device}
        </h2>
        <div className="flex items-start gap-4 rounded-xl px-3 py-3">
          <PenLine size={24} className="mt-0.5 shrink-0 text-primary-hi" aria-hidden />
          <div className="min-w-0 flex-1">
            <label htmlFor={id} className="text-[16px] font-medium">
              {uz.settings.penOnly}
            </label>
            <p className="mt-1 text-[14px] text-text-muted">{uz.settings.penOnlyHint}</p>
          </div>
          <button
            id={id}
            type="button"
            role="switch"
            aria-checked={penOnly}
            onClick={() => void setPenOnly(!penOnly)}
            className={cn(
              'relative mt-0.5 h-8 w-[52px] shrink-0 rounded-full transition-colors duration-150',
              penOnly ? 'bg-primary' : 'bg-white/15',
            )}
          >
            <span
              className={cn(
                'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-150',
                penOnly && 'translate-x-5',
              )}
            />
          </button>
        </div>
      </GlassPanel>
      <p className="px-2 text-[14px] text-text-muted">{uz.settings.more}</p>
    </div>
  );
}
