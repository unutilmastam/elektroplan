'use client';

import type { CoreCurrent } from '@/domain/wiring/boxFlow';
import type { BoxDesign, BoxInput } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { lampName, swName } from '../box/boxTexts';

/** "Tok yo‘li": the circuit of the first lit lamp in words, next to the animation; plus the legend. */
export function FlowSteps({
  input,
  design,
  currents,
  lit,
}: {
  input: BoxInput;
  design: BoxDesign;
  currents: Map<string, CoreCurrent>;
  lit: Record<string, boolean>;
}) {
  const f = uz.wiring.flow;
  const lamp = design.cables.find((c) => c.kind === 'lamp' && lit[c.id]);
  let steps: string[] = [];
  if (lamp) {
    const sw = input.switches.find((s) => s.id === lamp.switchId)!;
    const key = lamp.key!;
    const clamp = `${input.switches.indexOf(sw) + 1}.${key}`;
    const color = f.color[(['S1', 'S2', 'S3'] as const)[key - 1]!];
    steps = [
      f.s1,
      fmt(f.s2, { sw: swName(input, sw.id) }),
      fmt(f.s3, { k: key, color, clamp }),
      fmt(f.s4, { clamp, lamp: lampName(input, lamp) }),
      f.s5,
    ];
  }
  return (
    <div className="flex flex-col gap-2" data-testid="flow-steps">
      <h3 className="text-[15px] font-semibold">{f.title}</h3>
      {lamp && currents.size ? (
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-[14px]">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : (
        <p className="text-[14px] text-text-muted">{f.idle}</p>
      )}
      <ul className="mt-1 flex flex-col gap-1 text-[13px] text-text-muted">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ffb347] shadow-[0_0_8px_#ffb347]" aria-hidden />
          {f.legendL}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#7cc4ff] shadow-[0_0_8px_#7cc4ff]" aria-hidden />
          {f.legendN}
        </li>
        <li>{f.colors}</li>
        <li>{f.pe}</li>
      </ul>
    </div>
  );
}
