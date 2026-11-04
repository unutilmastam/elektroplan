'use client';

import { Fragment, useEffect, type ReactNode } from 'react';
import { detectLang, savedLang, useLangStore } from '@/i18n/language';

/**
 * Applies the saved / phone language after the static (Uzbek) HTML has loaded, and re-renders the whole app
 * when the language changes (every component reads `uz.*` while rendering).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useLangStore((s) => s.lang);
  useEffect(() => {
    const l = detectLang();
    if (l !== useLangStore.getState().lang) useLangStore.getState().set(l, savedLang() !== null);
  }, []);
  return <Fragment key={lang}>{children}</Fragment>;
}
