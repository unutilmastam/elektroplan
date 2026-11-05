'use client';

import type { BoxDesign, BoxInput } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { stepText, swName } from './boxTexts';

/** Ready-made box: how to join it, which cables come in, which clamps to buy. */
export function BoxSteps({ input, design }: { input: BoxInput; design: BoxDesign }) {
  const lamps = design.cables.filter((c) => c.kind === 'lamp').length;
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="box-steps">
      <div>
        <h3 className="mb-1.5 text-[14px] font-semibold">{uz.wiring.box.steps}</h3>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[14px]">
          {design.groups.map((g) => (
            <li key={g.id}>{stepText(g, input)}</li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="mb-1.5 text-[14px] font-semibold">{uz.wiring.box.cables}</h3>
          <ul className="flex flex-col gap-1 text-[14px] text-text/90">
            <li>{uz.wiring.box.cableSupply}</li>
            {input.switches.map((s) => (
              <li key={s.id}>{fmt(uz.wiring.box.cableSwitch, { sw: swName(input, s.id), n: s.keys + 1 })}</li>
            ))}
            <li>{fmt(uz.wiring.box.cableLamp, { n: lamps })}</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-1.5 text-[14px] font-semibold">{uz.wiring.box.clamps}</h3>
          <ul className="flex flex-col gap-1 text-[14px] text-text/90">
            {([2, 3, 5] as const)
              .filter((n) => design.clampCount[n] > 0)
              .map((n) => (
                <li key={n}>{fmt(uz.wiring.box.clampN, { n, q: design.clampCount[n] })}</li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
