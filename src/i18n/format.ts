/** "{a} A > {r} A" + { a: 21, r: 16 } → "21 A > 16 A" (unknown names stay as they are). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** 2.5 → "2,5" (decimal comma, as written in Uzbek and Russian). */
export const num = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
