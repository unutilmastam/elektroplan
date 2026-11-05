'use client';

import { useMemo, useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { recommendPanel } from '@/domain/wiring/panel';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useWiringStore } from '@/store/wiringStore';
import { PanelAdvice, PanelBom } from './PanelBom';
import { PanelBoard } from './PanelBoard';
import { PanelInputs } from './PanelInputs';
import { PanelSimControls } from './PanelSimControls';
import { usePanelSim } from './usePanelSim';

type View = 'scheme' | 'materials' | 'advice';

/** Distribution board: circuits on the left, the live board + test bench / materials / advice on the right. */
export function PanelWorkbench() {
  const input = useWiringStore((s) => s.panel);
  const design = useMemo(() => recommendPanel(input), [input]);
  const sim = usePanelSim(design, input);
  const [view, setView] = useState<View>('scheme');
  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-2.5 md:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:gap-3.5">
      <GlassPanel className="p-3 sm:p-4">
        <PanelInputs design={design} />
      </GlassPanel>
      <GlassPanel className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
        <div role="tablist" className="flex gap-1 rounded-xl border border-white/10 p-1">
          {(['scheme', 'materials', 'advice'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                'h-9 flex-1 rounded-[9px] text-[14px] font-medium',
                view === v ? 'bg-primary text-white' : 'text-text-muted hover:bg-white/[0.05]',
              )}
            >
              {uz.wiring.view[v]}
            </button>
          ))}
        </div>
        {view === 'scheme' ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 overflow-x-auto">
              <div className="mx-auto max-w-[620px] min-w-[420px]">
                <PanelBoard
                  design={design}
                  input={input}
                  state={sim.state}
                  flow={sim.flow}
                  flashes={sim.flashes}
                  onToggle={sim.toggle}
                  onTest={sim.test}
                  onLoad={sim.toggleLoad}
                />
              </div>
            </div>
            <PanelSimControls design={design} input={input} sim={sim} />
          </div>
        ) : view === 'materials' ? (
          <PanelBom design={design} />
        ) : (
          <PanelAdvice />
        )}
      </GlassPanel>
    </div>
  );
}
