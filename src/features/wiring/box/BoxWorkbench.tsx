'use client';

import { CheckCircle2, Eraser, Hand, Lightbulb, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { boxStatus, checkBox, type BoxIssue, type KeyState } from '@/domain/wiring/boxCheck';
import { boxCurrents } from '@/domain/wiring/boxFlow';
import { designBox } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useWiringStore } from '@/store/wiringStore';
import { BoxRealView } from '../real/BoxRealView';
import { FlowSteps } from '../real/FlowSteps';
import { boxGeometry, clampsFromDesign, joinsFromClamps, type VisualClamp } from '../real/realBoxLayout';
import { BoxInputs } from './BoxInputs';
import { BoxSteps } from './BoxSteps';
import { groupLabel, issueText } from './boxTexts';

type Mode = 'auto' | 'manual';

/** Junction box: switches on the left; the real-looking box with live keys and current on the right. */
export function BoxWorkbench() {
  const input = useWiringStore((s) => s.box);
  const stored = useWiringStore((s) => s.clamps);
  const setClamps = useWiringStore((s) => s.setClamps);
  const design = useMemo(() => designBox(input), [input]);
  const [mode, setMode] = useState<Mode>('auto');
  const [keys, setKeys] = useState<KeyState>({});
  const [result, setResult] = useState<{ ok: boolean; issues: BoxIssue[] } | null>(null);

  const visual: VisualClamp[] =
    mode === 'auto'
      ? clampsFromDesign(design, (g) => groupLabel(g, input))
      : stored.map((c, i) => ({
          id: `m${i}`,
          ways: c.size,
          ends: c.ends,
          label: String(i + 1),
          color: 'L' as const,
        }));
  const geo = boxGeometry(design.cables, visual, (c, i) =>
    mode === 'auto'
      ? c.color === 'N' || c.color === 'PE'
        ? 'top'
        : 'bottom'
      : i % 2 === 0
        ? 'bottom'
        : 'top',
  );
  const joins = joinsFromClamps(visual);
  const status = boxStatus(input, joins, keys, design.cables);
  const currents = boxCurrents(input, joins, keys, design.cables);

  const edit = (next: typeof stored) => {
    setClamps(next);
    setResult(null);
  };
  const remove = (core: string) =>
    edit(stored.map((c) => ({ ...c, ends: c.ends.map((e) => (e === core ? null : e)) })));
  const insert = (core: string, ci: number, si: number) =>
    edit(
      stored.map((c, i) => ({
        ...c,
        ends: c.ends.map((e, j) => (i === ci && j === si ? core : e === core ? null : e)),
      })),
    );

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-2.5 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-3.5">
      <GlassPanel className="flex flex-col gap-4 p-3 sm:p-4">
        <BoxInputs />
        <FlowSteps input={input} design={design} currents={currents} lit={status.lit} />
      </GlassPanel>
      <GlassPanel className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
        <div role="tablist" className="flex gap-1 rounded-xl border border-white/10 p-1">
          {(['auto', 'manual'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setResult(null);
              }}
              className={cn(
                'h-9 flex-1 rounded-[9px] text-[14px] font-medium',
                mode === m ? 'bg-primary text-white' : 'text-text-muted hover:bg-white/[0.05]',
              )}
            >
              {uz.wiring.box.mode[m]}
            </button>
          ))}
        </div>
        <p className="flex items-start gap-2 text-[13.5px] text-text-muted">
          {mode === 'auto' ? (
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#facc15]" aria-hidden />
          ) : (
            <Hand size={16} className="mt-0.5 shrink-0 text-[#facc15]" aria-hidden />
          )}
          {mode === 'auto' ? uz.wiring.box.tryHint : uz.wiring.flow.dragHint}
        </p>
        {mode === 'manual' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] text-text-muted">{uz.wiring.flow.addWago}:</span>
            {([2, 3, 5] as const).map((n) => (
              <Button
                key={n}
                size="sm"
                onClick={() => edit([...stored, { size: n, ends: Array<null>(n).fill(null) }])}
                data-testid={`add-wago-${n}`}
                disabled={stored.length >= 16}
              >
                {fmt(uz.wiring.flow.wagoN, { n })}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="min-w-0 overflow-x-auto rounded-xl">
          <div className="mx-auto min-w-[560px] max-w-[980px]">
            <BoxRealView
              input={input}
              geo={geo}
              keys={keys}
              lit={status.lit}
              currents={currents}
              short={status.short}
              onKey={(id, k) =>
                setKeys((s) => ({
                  ...s,
                  [id]: Array.from({ length: 3 }, (_, i) => (i === k ? !s[id]?.[i] : s[id]?.[i] === true)),
                }))
              }
              editable={mode === 'manual'}
              onInsert={insert}
              onRemove={remove}
            />
          </div>
        </div>
        {mode === 'manual' ? (
          <div className="flex flex-col gap-2">
            {stored.length ? (
              <div className="flex flex-wrap gap-1.5">
                {stored.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => edit(stored.filter((_, j) => j !== i))}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-white/12 px-2.5 text-[13px] text-text-muted hover:border-danger/50 hover:text-[#ff9b9b]"
                    aria-label={fmt(uz.wiring.flow.removeWago, { n: i + 1 })}
                  >
                    <Trash2 size={14} aria-hidden />
                    {i + 1} · {c.size}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  setResult(checkBox(input, joinsFromClamps(stored.map((c) => ({ ends: c.ends })))))
                }
                data-testid="box-check"
              >
                <ShieldCheck size={16} aria-hidden />
                {uz.wiring.box.check}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => edit([])}>
                <Eraser size={16} aria-hidden />
                {uz.wiring.box.clear}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  edit(
                    clampsFromDesign(design, (g) => groupLabel(g, input)).map((c) => ({
                      size: c.ways as 2 | 3 | 5,
                      ends: c.ends,
                    })),
                  )
                }
                data-testid="box-answer"
              >
                {uz.wiring.box.answer}
              </Button>
            </div>
            {result ? (
              result.ok ? (
                <p
                  className="flex gap-2 rounded-lg bg-success/15 px-3 py-2 text-[14px] text-[#c9f5d0]"
                  data-testid="box-ok"
                >
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden />
                  {uz.wiring.box.ok}
                </p>
              ) : (
                <ul className="flex flex-col gap-1" data-testid="box-issues">
                  {result.issues.slice(0, 12).map((i, k) => (
                    <li
                      key={k}
                      className="flex gap-2 rounded-lg bg-danger/12 px-3 py-1.5 text-[13.5px] text-[#ffc4c4]"
                    >
                      <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                      {issueText(i, input, design.cables)}
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        ) : (
          <BoxSteps input={input} design={design} />
        )}
      </GlassPanel>
    </div>
  );
}
