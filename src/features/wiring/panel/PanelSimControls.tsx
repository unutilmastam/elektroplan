'use client';

import { Power, PowerOff, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PanelDesign, PanelInput } from '@/domain/wiring/panel';
import type { Fault, PanelEvent } from '@/domain/wiring/panelSim';
import { fmt, num } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import type { usePanelSim } from './usePanelSim';

const FAULTS: Fault[] = ['none', 'overload', 'short', 'leak'];

export function eventText(e: PanelEvent, design: PanelDesign, input: PanelInput): string {
  const line = (id: string) => input.lines.find((l) => l.id === id)?.name ?? id;
  const device = (id: string) =>
    design.rcds.some((r) => r.id === id)
      ? `${uz.wiring.devices.rcd} ${design.rcds.findIndex((r) => r.id === id) + 1}`
      : `${uz.wiring.devices.rcbo} (${line(id)})`;
  const t = uz.wiring.sim.events;
  switch (e.kind) {
    case 'main-overload':
      return fmt(t['main-overload'], { phase: e.phase, a: num(e.currentA), r: e.ratingA });
    case 'mcb-overload':
      return fmt(t['mcb-overload'], { line: line(e.lineId), a: num(e.currentA), r: e.ratingA });
    case 'mcb-short':
      return fmt(t['mcb-short'], { line: line(e.lineId) });
    case 'rcd-leak':
      return fmt(t['rcd-leak'], { line: line(e.lineId), device: device(e.deviceId) });
    case 'rcd-test':
      return fmt(t['rcd-test'], { device: device(e.deviceId) });
    case 'leak-unprotected':
      return fmt(t['leak-unprotected'], { line: line(e.lineId) });
  }
}

/** Test bench under the board: everything on/off, a fault per circuit, and what happened. */
export function PanelSimControls({
  design,
  input,
  sim,
}: {
  design: PanelDesign;
  input: PanelInput;
  sim: ReturnType<typeof usePanelSim>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] text-text-muted">{uz.wiring.sim.hint}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={sim.allOn} data-testid="sim-all-on">
          <Power size={16} aria-hidden />
          {uz.wiring.sim.allOn}
        </Button>
        <Button size="sm" onClick={sim.allOff}>
          <PowerOff size={16} aria-hidden />
          {uz.wiring.sim.allOff}
        </Button>
        <Button size="sm" variant="ghost" onClick={sim.reset}>
          <RotateCcw size={16} aria-hidden />
          {uz.wiring.sim.reset}
        </Button>
      </div>
      {design.lines.length ? (
        <ul className="flex flex-col gap-1.5">
          {design.lines.map((l) => {
            const amps = sim.flow.current[l.id] ?? 0;
            return (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5"
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    amps > 0 ? 'bg-[#facc15]' : sim.flow.live[l.id] ? 'bg-success' : 'bg-white/20',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[14px]">
                  {input.lines.find((x) => x.id === l.id)?.name}
                </span>
                <span className="w-14 text-right text-[13px] tabular-nums text-text-muted">
                  {num(amps)} A
                </span>
                <select
                  aria-label={`${uz.wiring.sim.fault}: ${input.lines.find((x) => x.id === l.id)?.name ?? ''}`}
                  value={sim.state.fault[l.id] ?? 'none'}
                  onChange={(e) => sim.setFault(l.id, e.target.value as Fault)}
                  className="h-9 rounded-lg border border-white/12 bg-[#0a1222] px-2 text-[13.5px]"
                  data-testid="sim-fault"
                >
                  {FAULTS.map((f) => (
                    <option key={f} value={f}>
                      {uz.wiring.sim.faults[f]}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div>
        <h3 className="mb-1.5 flex items-center gap-2 text-[14px] font-semibold">
          <Zap size={16} className="text-[#facc15]" aria-hidden />
          {uz.wiring.sim.log}
        </h3>
        {sim.log.length === 0 ? (
          <p className="text-[13.5px] text-text-muted">{uz.wiring.sim.empty}</p>
        ) : (
          <ol className="flex flex-col gap-1" data-testid="sim-log" aria-live="polite">
            {sim.log.map(({ id, event }) => (
              <li
                key={id}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[13.5px]',
                  event.kind === 'leak-unprotected'
                    ? 'bg-danger/15 text-[#ffb4b4]'
                    : event.kind === 'rcd-test'
                      ? 'bg-success/12 text-[#c9f5d0]'
                      : 'bg-[#facc15]/10 text-[#fde68a]',
                )}
              >
                {eventText(event, design, input)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
