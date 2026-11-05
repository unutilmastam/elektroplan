'use client';

import { CheckCircle2, Eraser, Lightbulb, Plus, ShieldCheck, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { boxStatus, checkBox, type BoxIssue, type KeyState } from '@/domain/wiring/boxCheck';
import { designBox } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useWiringStore } from '@/store/wiringStore';
import { BoxDiagram } from './BoxDiagram';
import { BoxInputs } from './BoxInputs';
import { BoxSteps } from './BoxSteps';
import { coreName, groupLabel, issueText } from './boxTexts';

type Mode = 'auto' | 'manual';

/** Junction box: switches on the left; the box (ready-made or wired by you) with live keys on the right. */
export function BoxWorkbench() {
  const input = useWiringStore((s) => s.box);
  const manual = useWiringStore((s) => s.manual);
  const setManual = useWiringStore((s) => s.setManual);
  const design = useMemo(() => designBox(input), [input]);
  const [mode, setMode] = useState<Mode>('auto');
  const [keys, setKeys] = useState<KeyState>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; issues: BoxIssue[] } | null>(null);
  const joins = mode === 'auto' ? design.groups.map((g) => g.ends) : manual;
  const labels =
    mode === 'auto' ? design.groups.map((g) => groupLabel(g, input)) : manual.map((_, i) => String(i + 1));
  const status = boxStatus(input, joins, keys, design.cables);

  const editManual = (next: string[][]) => {
    setManual(next.filter((j) => j.length));
    setResult(null);
  };
  const onCore = (id: string) => {
    if (manual.some((j) => j.includes(id))) return editManual(manual.map((j) => j.filter((e) => e !== id)));
    setPicked((p) => (p === id ? null : id));
  };
  const onClamp = (i: number) => {
    if (!picked) return;
    editManual(manual.map((j, k) => (k === i ? [...j, picked] : j)));
    setPicked(null);
  };

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-2.5 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-3.5">
      <GlassPanel className="p-3 sm:p-4">
        <BoxInputs />
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
                setPicked(null);
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
        <p className="flex items-center gap-2 text-[13.5px] text-text-muted">
          <Lightbulb size={16} className="shrink-0 text-[#facc15]" aria-hidden />
          {mode === 'auto' ? uz.wiring.box.tryHint : uz.wiring.box.manualHint}
        </p>
        <div className="min-w-0 overflow-x-auto">
          <div className="mx-auto max-w-[900px] min-w-[520px]">
            <BoxDiagram
              input={input}
              cables={design.cables}
              joins={joins}
              joinLabels={labels}
              keys={keys}
              status={status}
              onKey={(id, k) =>
                setKeys((s) => ({
                  ...s,
                  [id]: Array.from({ length: 3 }, (_, i) => (i === k ? !s[id]?.[i] : s[id]?.[i] === true)),
                }))
              }
              picked={mode === 'manual' ? picked : null}
              onCore={mode === 'manual' ? onCore : undefined}
              onClamp={mode === 'manual' ? onClamp : undefined}
            />
          </div>
        </div>
        {mode === 'manual' ? (
          <div className="flex flex-col gap-2">
            {picked ? (
              <p className="text-[13.5px] text-[#fde68a]">
                {fmt(uz.wiring.box.picked, { core: coreName(input, design.cables, picked) })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!picked}
                onClick={() => (editManual([...manual, [picked!]]), setPicked(null))}
                data-testid="box-new-clamp"
              >
                <Plus size={16} aria-hidden />
                {uz.wiring.box.newClamp}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setResult(checkBox(input, manual))}
                data-testid="box-check"
              >
                <ShieldCheck size={16} aria-hidden />
                {uz.wiring.box.check}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => editManual([])}>
                <Eraser size={16} aria-hidden />
                {uz.wiring.box.clear}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editManual(design.groups.map((g) => [...g.ends]))}
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
