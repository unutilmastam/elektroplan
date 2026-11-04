import { create } from 'zustand';
import { ruStrings } from './dict/ru';
import { registerDictionary, setLang, type Lang } from './uz';

registerDictionary('ru', ruStrings);

/** Chosen language: localStorage (read synchronously at start, works offline); first start follows the phone. */
const KEY = 'elektroplan:lang';

export function savedLang(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'uz' || v === 'ru' ? v : null;
  } catch {
    return null;
  }
}

export function detectLang(
  saved = savedLang(),
  languages: readonly string[] = navigator.languages ?? [],
): Lang {
  if (saved) return saved;
  return languages.some((l) => l.toLowerCase().startsWith('ru')) ? 'ru' : 'uz';
}

interface LangState {
  lang: Lang;
  /** switch language (re-renders the whole app via LanguageProvider) */
  set: (lang: Lang, remember?: boolean) => void;
}

export const useLangStore = create<LangState>()((set) => ({
  lang: 'uz',
  set: (lang, remember = true) => {
    setLang(lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    if (remember)
      try {
        localStorage.setItem(KEY, lang);
      } catch {
        // private mode: this session only
      }
    set({ lang });
  },
}));
