'use client';

import { AlertTriangle } from 'lucide-react';
import type { BomItem, PanelDesign } from '@/domain/wiring/panel';
import { fmt, num } from '@/i18n/format';
import { uz } from '@/i18n/uz';

export function bomText(b: BomItem): string {
  const t = uz.wiring.bom;
  switch (b.kind) {
    case 'main':
      return fmt(t.main, { poles: b.poles, a: b.ratingA });
    case 'relay':
      return fmt(t.relay, { a: b.ratingA, phases: b.phases });
    case 'spd':
      return fmt(t.spd, { poles: b.poles });
    case 'rcd':
      return fmt(t.rcd, { a: b.ratingA });
    case 'rcbo':
      return fmt(t.rcbo, { curve: b.curve, a: b.ratingA });
    case 'mcb':
      return fmt(t.mcb, { curve: b.curve, a: b.ratingA });
    case 'bus':
      return fmt(t.bus, { bus: b.bus, n: b.terminals });
    case 'comb':
      return fmt(t.comb, { poles: b.poles });
    case 'enclosure':
      return fmt(t.enclosure, { n: b.modules });
    case 'cable':
      return fmt(t.cable, { cores: b.cores, mm2: num(b.mm2), n: b.qty });
  }
}

/** What to buy for the board + the board totals. */
export function PanelBom({ design }: { design: PanelDesign }) {
  const t = uz.wiring.totals;
  const rows: Array<[string, string]> = [
    [t.connected, `${num(design.totals.connectedKw)} ${uz.wiring.kw}`],
    [t.demand, `${num(design.totals.demandKw)} ${uz.wiring.kw} · ${num(design.totals.demandA)} A`],
    [t.allowed, `${num(design.totals.allocatedA)} A`],
    [t.modules, `${design.modules}`],
    [t.enclosure, fmt(uz.wiring.bom.enclosure, { n: design.enclosure })],
  ];
  if (design.phases === 3)
    rows.push([
      t.phases,
      `L1 ${num(design.phaseLoadA.L1)} A · L2 ${num(design.phaseLoadA.L2)} A · L3 ${num(design.phaseLoadA.L3)} A`,
    ]);
  return (
    <div className="flex flex-col gap-3" data-testid="panel-bom">
      {design.totals.overAllocation ? (
        <p className="flex gap-2 rounded-lg bg-[#facc15]/10 px-3 py-2 text-[13.5px] text-[#fde68a]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t.over}
        </p>
      ) : null}
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-text-muted">{k}</dt>
            <dd className="text-right font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/10">
        {design.bom.map((b, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2 text-[14px]">
            <span className="min-w-0 flex-1">{bomText(b)}</span>
            {b.kind !== 'cable' ? (
              <span className="shrink-0 text-text-muted tabular-nums">
                {fmt(uz.wiring.bom.qty, { n: b.qty })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Why the board is built like this (short, practical). */
export function PanelAdvice() {
  const a = uz.wiring.advice;
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-[14px] text-text/90" data-testid="panel-advice">
      {[a.order, a.relay, a.spd, a.rcd, a.rcbo, a.curve, a.cable, a.colors, a.nPe, a.ac].map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}
