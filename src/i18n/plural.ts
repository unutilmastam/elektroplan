/**
 * "{n} word" for counts. Uzbek nouns do not change after numbers ("5 xona"); Russian ones do, so a Russian
 * dictionary entry holds three forms "комната|комнаты|комнат" (1 / 2–4 / 5+). Any string without "|" is used as is.
 */
export function plural(n: number, word: string): string {
  if (!word.includes('|')) return word;
  const [one, few, many] = word.split('|') as [string, string, string];
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

/** "5 комнат" / "5 xona" */
export const countOf = (n: number, word: string) => `${n} ${plural(n, word)}`;
