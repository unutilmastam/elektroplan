'use client';

import { FolderInput, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { AnchoredMenu } from '@/components/common/AnchoredMenu';
import { NumberField } from '@/components/common/NumberField';
import { Button } from '@/components/ui/button';
import { CONSUMERS, CONSUMER_TYPES, type ConsumerType } from '@/domain/wiring/catalog';
import { linesFromProject } from '@/domain/wiring/fromProject';
import type { PanelDesign } from '@/domain/wiring/panel';
import { fmt, num } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { useWiringStore, wid } from '@/store/wiringStore';

/** Supply + list of circuits. Each circuit shows what the board needs for it. */
export function PanelInputs({ design }: { design: PanelDesign }) {
  const panel = useWiringStore((s) => s.panel);
  const { setPanel, addLine, updateLine, removeLine, setLines } = useWiringStore.getState();
  const [open, setOpen] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);

  const fromProject = () => {
    const st = useProjectStore.getState();
    const live = st.projects.filter((p) => p.deletedAt === null);
    const p =
      live.find((x) => x.id === st.currentId) ??
      [...live].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const lines = p
      ? linesFromProject(
          p,
          (t, d) => [uz.wiring.consumers[t], d].filter(Boolean).join(' · '),
          () => wid('line'),
        )
      : [];
    if (!lines.length) return useUiStore.getState().notify(uz.wiring.fromProjectEmpty);
    setLines(lines);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label={uz.wiring.supply}
        className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 p-1"
      >
        {([1, 3] as const).map((ph) => (
          <button
            key={ph}
            type="button"
            role="radio"
            aria-checked={panel.phases === ph}
            onClick={() => setPanel({ phases: ph, allocatedKw: ph === 1 ? 10 : 15 })}
            className={cn(
              'h-10 rounded-[9px] text-[14px] font-medium',
              panel.phases === ph ? 'bg-primary text-white' : 'text-text-muted hover:bg-white/[0.05]',
            )}
          >
            {ph === 1 ? uz.wiring.phases1 : uz.wiring.phases3}
          </button>
        ))}
      </div>
      <NumberField
        label={uz.wiring.allocated}
        unit={uz.wiring.kw}
        value={panel.allocatedKw}
        min={1}
        max={500}
        onChange={(v) => setPanel({ allocatedKw: Math.max(1, v ?? 1) })}
      />
      <div className="flex items-center gap-2 pt-1">
        <h3 className="flex-1 text-[15px] font-semibold">
          {uz.wiring.lines} <span className="text-text-muted">· {panel.lines.length}</span>
        </h3>
        <Button
          size="sm"
          onClick={fromProject}
          title={uz.wiring.fromProjectHint}
          data-testid="wiring-from-project"
        >
          <FolderInput size={16} aria-hidden />
          {uz.wiring.fromProject}
        </Button>
        <Button
          ref={addRef}
          size="sm"
          variant="primary"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          data-testid="wiring-add-line"
        >
          <Plus size={16} aria-hidden />
          {uz.wiring.addLine}
        </Button>
        <AnchoredMenu
          anchorRef={addRef}
          open={open}
          onClose={() => setOpen(false)}
          width={260}
          label={uz.wiring.addLine}
        >
          {CONSUMER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitem"
              onClick={() => {
                addLine({ type: t, name: uz.wiring.consumers[t], powerW: CONSUMERS[t].powerW });
                setOpen(false);
              }}
              className="flex h-10 items-center rounded-lg px-2.5 text-left text-[14.5px] hover:bg-white/[0.06]"
            >
              {uz.wiring.consumers[t]}
            </button>
          ))}
        </AnchoredMenu>
      </div>
      {panel.lines.length === 0 ? <p className="text-[14px] text-text-muted">{uz.wiring.noLines}</p> : null}
      <ul className="flex flex-col gap-2" data-testid="wiring-lines">
        {panel.lines.map((l, i) => {
          const d = design.lines.find((x) => x.id === l.id);
          return (
            <li key={l.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-[13px] text-text-dim">{i + 1}</span>
                <select
                  aria-label={uz.wiring.lines}
                  value={l.type}
                  onChange={(e) => {
                    const type = e.target.value as ConsumerType;
                    updateLine(l.id, {
                      type,
                      powerW: CONSUMERS[type].powerW,
                      name: uz.wiring.consumers[type],
                    });
                  }}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-white/12 bg-[#0a1222] px-2 text-[14px]"
                >
                  {CONSUMER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {uz.wiring.consumers[t]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={uz.wiring.remove}
                  onClick={() => removeLine(l.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-danger/15 hover:text-[#ff7b7b]"
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 pl-8">
                <input
                  aria-label={uz.wiring.lineName}
                  value={l.name}
                  maxLength={80}
                  onChange={(e) => updateLine(l.id, { name: e.target.value })}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-white/12 bg-[#0a1222] px-2.5 text-base sm:text-[14px]"
                />
                <input
                  aria-label={uz.wiring.power}
                  inputMode="numeric"
                  value={l.powerW}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/\D/g, ''));
                    if (v >= 10 && v <= 50000) updateLine(l.id, { powerW: v });
                  }}
                  className="h-9 w-20 rounded-lg border border-white/12 bg-[#0a1222] px-2 text-right text-base sm:text-[14px]"
                />
                <span className="text-[13px] text-text-muted">{uz.wiring.watt}</span>
              </div>
              {d ? (
                <p
                  className={cn('mt-1.5 pl-8 text-[13px]', d.tooBig ? 'text-[#ffb86b]' : 'text-text-muted')}
                  data-testid="wiring-line-summary"
                >
                  {num(d.currentA)} A → {d.curve}
                  {d.breakerA} · {num(d.cableMm2)} mm² · {uz.wiring.line.prot[d.protection]}
                  {design.phases === 3 ? ` · ${d.phase}` : ''}
                  {d.tooBig ? ` · ${uz.wiring.line.tooBig}` : ''}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-text-dim">
        {fmt(uz.wiring.advice.main, {
          a: design.main.ratingA,
          kw: num(panel.allocatedKw),
          allowed: num(design.totals.allocatedA),
          mm2: num(design.main.cableMm2),
        })}
      </p>
    </div>
  );
}
