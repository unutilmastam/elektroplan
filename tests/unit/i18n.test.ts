import { describe, expect, it } from 'vitest';
import { ruStrings } from '@/i18n/dict/ru';
import { uzStrings } from '@/i18n/dict/uz';
import { detectLang, useLangStore } from '@/i18n/language';
import { countOf, plural } from '@/i18n/plural';
import { uz } from '@/i18n/uz';

type Tree = { [k: string]: unknown };
const leaves = (t: unknown, path = ''): Array<[string, unknown]> =>
  t && typeof t === 'object' && !Array.isArray(t)
    ? Object.entries(t as Tree).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
    : [[path, t]];

describe('dictionaries', () => {
  const u = new Map(leaves(uzStrings));
  const r = new Map(leaves(ruStrings));

  it('Russian has exactly the Uzbek keys', () => {
    expect([...r.keys()].sort()).toEqual([...u.keys()].sort());
  });

  it('no empty texts; arrays have the same length; placeholders kept', () => {
    for (const [k, v] of r) {
      const ref = u.get(k);
      if (Array.isArray(ref)) {
        expect(Array.isArray(v), k).toBe(true);
        expect((v as unknown[]).length, k).toBe(ref.length);
        continue;
      }
      expect(typeof v, k).toBe('string');
      expect((v as string).trim().length, k).toBeGreaterThan(0);
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(ph(v as string), k).toEqual(ph(ref as string));
    }
  });

  it('Russian is really Russian (Cyrillic in most texts) — not a copy of Uzbek', () => {
    const texts = [...r.values()].filter((v): v is string => typeof v === 'string' && v.length > 3);
    const cyr = texts.filter((t) => /[а-яё]/i.test(t)).length;
    expect(cyr / texts.length).toBeGreaterThan(0.85);
  });
});

describe('language switch', () => {
  it('`uz` answers in the current language', () => {
    useLangStore.getState().set('ru', false);
    expect(uz.nav.projects).toBe('Проекты');
    expect(uz.status.done).toBe('Выполнено');
    useLangStore.getState().set('uz', false);
    expect(uz.nav.projects).toBe('Loyihalar');
  });

  it('first start follows the phone; a saved choice wins', () => {
    expect(detectLang(null, ['ru-RU', 'en'])).toBe('ru');
    expect(detectLang(null, ['uz-UZ'])).toBe('uz');
    expect(detectLang(null, ['en-US'])).toBe('uz');
    expect(detectLang('uz', ['ru-RU'])).toBe('uz');
  });
});

describe('Russian plural forms', () => {
  const w = 'комната|комнаты|комнат';
  it.each([
    [1, 'комната'],
    [2, 'комнаты'],
    [4, 'комнаты'],
    [5, 'комнат'],
    [11, 'комнат'],
    [12, 'комнат'],
    [21, 'комната'],
    [22, 'комнаты'],
    [25, 'комнат'],
    [101, 'комната'],
    [111, 'комнат'],
    [0, 'комнат'],
  ])('%i', (n, form) => expect(plural(n, w)).toBe(form));
  it('Uzbek words stay the same', () => {
    expect(countOf(5, 'xona')).toBe('5 xona');
  });
});
