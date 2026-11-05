'use client';

import { Cable, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useWiringStore } from '@/store/wiringStore';
import { BoxWorkbench } from './box/BoxWorkbench';
import { PanelWorkbench } from './panel/PanelWorkbench';

type Tab = 'panel' | 'box';

/** PHASE 21 "Elektr sxemalar": distribution board and junction box designers with a live simulation. */
export function WiringScreen() {
  const loaded = useWiringStore((s) => s.loaded);
  const [tab, setTab] = useState<Tab>('panel');
  useEffect(() => {
    if (!useWiringStore.getState().loaded) void useWiringStore.getState().load();
  }, []);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel
        as="header"
        className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-5 sm:py-4"
      >
        <Cable size={26} className="text-primary-hi" aria-hidden />
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-semibold lg:text-[24px]">{uz.wiring.title}</h1>
          <p className="text-[13.5px] text-text-muted">{uz.wiring.subtitle}</p>
        </div>
        <div
          role="tablist"
          aria-label={uz.wiring.title}
          className="flex w-full gap-1 rounded-xl border border-white/10 p-1 sm:w-auto"
        >
          {(['panel', 'box'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'h-10 flex-1 rounded-[9px] px-4 text-[14.5px] font-medium sm:flex-none',
                tab === t ? 'bg-primary text-white' : 'text-text-muted hover:bg-white/[0.05]',
              )}
            >
              {uz.wiring.tabs[t]}
            </button>
          ))}
        </div>
      </GlassPanel>
      <p className="flex shrink-0 items-start gap-2 px-1 text-[12.5px] text-text-dim">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
        {uz.wiring.disclaimer}
      </p>
      {loaded ? tab === 'panel' ? <PanelWorkbench /> : <BoxWorkbench /> : null}
    </div>
  );
}
