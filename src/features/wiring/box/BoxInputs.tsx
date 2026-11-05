'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BoxSwitch } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useWiringStore, wid } from '@/store/wiringStore';

const MAX_SWITCHES = 4;

/** Switches in this box: 1, 2 or 3 keys and how many lamps each key drives. */
export function BoxInputs() {
  const box = useWiringStore((s) => s.box);
  const { setBox, updateSwitch } = useWiringStore.getState();
  const setKeys = (s: BoxSwitch, keys: 1 | 2 | 3) =>
    updateSwitch(s.id, { keys, lamps: Array.from({ length: keys }, (_, i) => s.lamps[i] ?? 1) });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-[15px] font-semibold">{uz.wiring.box.switches}</h3>
        <Button
          size="sm"
          variant="primary"
          disabled={box.switches.length >= MAX_SWITCHES}
          onClick={() => setBox({ switches: [...box.switches, { id: wid('sw'), keys: 1, lamps: [1] }] })}
          data-testid="box-add-switch"
        >
          <Plus size={16} aria-hidden />
          {uz.wiring.box.addSwitch}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {box.switches.map((s, i) => (
          <li
            key={s.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
            data-testid="box-switch"
          >
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[14.5px] font-medium">
                {fmt(uz.wiring.box.switchN, { n: i + 1 })}
              </span>
              <button
                type="button"
                aria-label={uz.wiring.remove}
                disabled={box.switches.length <= 1}
                onClick={() => setBox({ switches: box.switches.filter((x) => x.id !== s.id) })}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-danger/15 hover:text-[#ff7b7b] disabled:opacity-30"
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </div>
            <div
              role="radiogroup"
              aria-label={fmt(uz.wiring.box.switchN, { n: i + 1 })}
              className="mt-2 grid grid-cols-3 gap-1"
            >
              {([1, 2, 3] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={s.keys === k}
                  onClick={() => setKeys(s, k)}
                  className={cn(
                    'h-9 rounded-lg border text-[13px]',
                    s.keys === k
                      ? 'border-primary-hi/60 bg-primary text-white'
                      : 'border-white/12 text-text-muted hover:bg-white/[0.05]',
                  )}
                >
                  {uz.wiring.box.keys[k]}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {Array.from({ length: s.keys }, (_, k) => (
                <div key={k} className="flex items-center gap-2 text-[13.5px]">
                  <span className="flex-1 text-text-muted">
                    {fmt(uz.wiring.box.lampsOnKey, { k: k + 1 })}
                  </span>
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={(s.lamps[k] ?? 1) === n}
                      aria-label={`${fmt(uz.wiring.box.lampsOnKey, { k: k + 1 })}: ${n}`}
                      onClick={() => updateSwitch(s.id, { lamps: s.lamps.map((v, j) => (j === k ? n : v)) })}
                      className={cn(
                        'h-9 w-9 rounded-lg border',
                        (s.lamps[k] ?? 1) === n
                          ? 'border-[#facc15]/70 bg-[#facc15]/20 text-[#fde68a]'
                          : 'border-white/12 text-text-muted',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
