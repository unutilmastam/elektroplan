import { uzStrings, type Strings } from './dict/uz';

/**
 * UI text (PHASE 16: Uzbek + Russian). Components keep `import { uz } from '@/i18n/uz'` and read
 * `uz.section.key` while rendering; `uz` always answers from the CURRENT language, so switching the language
 * and re-rendering (LanguageProvider) is all that is needed. Non-React code (notices, PDF) reads it at call time.
 */
export type Lang = 'uz' | 'ru';
export const LANGS: readonly Lang[] = ['uz', 'ru'];
export type { Strings };

let current: Strings = uzStrings;
let currentLang: Lang = 'uz';
const dictionaries: Partial<Record<Lang, Strings>> = { uz: uzStrings };

export function registerDictionary(lang: Lang, dict: Strings) {
  dictionaries[lang] = dict;
}

export function setLang(lang: Lang): void {
  current = dictionaries[lang] ?? uzStrings;
  currentLang = dictionaries[lang] ? lang : 'uz';
}

export const getLang = (): Lang => currentLang;

export const uz: Strings = new Proxy({} as Strings, {
  get: (_t, key) => (current as unknown as Record<PropertyKey, unknown>)[key],
  has: (_t, key) => key in current,
  ownKeys: () => Reflect.ownKeys(current),
  getOwnPropertyDescriptor: (_t, key) => ({
    ...Reflect.getOwnPropertyDescriptor(current, key),
    configurable: true,
  }),
});
