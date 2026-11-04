'use client';

import { Languages } from 'lucide-react';
import { useLangStore } from '@/i18n/language';
import { LANGS, uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

/** Til / Язык: O‘zbekcha · Русский (saved on this device). */
export function LanguagePicker() {
  const lang = useLangStore((s) => s.lang);
  const set = useLangStore((s) => s.set);
  return (
    <div className="flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Languages size={24} className="mt-0.5 shrink-0 text-primary-hi" aria-hidden />
        <div className="min-w-0">
          <div className="text-[16px] font-medium" id="lang-label">
            {uz.settings.language} / {lang === 'uz' ? 'Язык' : 'Til'}
          </div>
          <p className="mt-1 text-[14px] text-text-muted">{uz.settings.languageHint}</p>
        </div>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="lang-label"
        className="flex shrink-0 gap-1 rounded-[12px] border border-white/10 bg-[#0a1222] p-1 sm:ml-0 ml-10"
      >
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lang === l}
            lang={l}
            onClick={() => set(l)}
            data-testid={`lang-${l}`}
            className={cn(
              'h-11 min-w-[112px] rounded-[9px] px-3 text-[15px] font-medium transition-colors',
              lang === l ? 'bg-primary text-white' : 'text-text-muted hover:text-text',
            )}
          >
            {uz.settings.languageNames[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
