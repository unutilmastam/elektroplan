'use client';

import { ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUiScale, IS_DESKTOP, setUiScale, UI_SCALES } from '@/infra/desktop/desktop';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

/** PHASE 19 (Windows app only): "Interfeys o‘lchami" — 70 / 80 / 90 / 100 %. */
export function UiScalePicker() {
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    if (IS_DESKTOP) void getUiScale().then(setScale);
  }, []);
  if (!IS_DESKTOP) return null;
  const pick = async (s: number) => {
    const v = await setUiScale(s);
    if (v !== null) setScale(v);
  };
  return (
    <div className="flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <ZoomIn size={24} className="mt-0.5 shrink-0 text-primary-hi" aria-hidden />
        <div className="min-w-0">
          <div className="text-[16px] font-medium">{uz.settings.uiScale}</div>
          <p className="mt-1 text-[14px] text-text-muted">{uz.settings.uiScaleHint}</p>
        </div>
      </div>
      <div role="radiogroup" aria-label={uz.settings.uiScale} className="flex shrink-0 gap-1.5 pl-10 sm:pl-0">
        {UI_SCALES.map((s) => {
          const on = scale !== null && Math.abs(scale - s) < 0.01;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => void pick(s)}
              className={cn(
                'h-10 min-w-14 rounded-[10px] border px-3 text-[15px] transition-colors',
                on
                  ? 'border-primary-hi/60 bg-primary text-white'
                  : 'border-white/12 text-text hover:bg-white/[0.05]',
              )}
            >
              {Math.round(s * 100)}%
            </button>
          );
        })}
      </div>
    </div>
  );
}
