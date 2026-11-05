import type { BoxIssue } from '@/domain/wiring/boxCheck';
import type { BoxDesign, BoxInput, Cable, CoreRole } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';

/** Human names for cables, cores and check results of the junction box (read at render time). */
export const swName = (input: BoxInput, id: string | null) =>
  fmt(uz.wiring.box.switchN, { n: input.switches.findIndex((s) => s.id === id) + 1 });

export const lampName = (input: BoxInput, c: Cable | undefined) =>
  c
    ? fmt(uz.wiring.box.lampN, {
        sw: input.switches.findIndex((s) => s.id === c.switchId) + 1,
        k: c.key ?? 0,
        n: c.lamp ?? 0,
      })
    : '';

export function coreName(input: BoxInput, cables: Cable[], coreId: string): string {
  const [cableId, role] = coreId.split(':') as [string, CoreRole];
  const c = cables.find((x) => x.id === cableId);
  const r = uz.wiring.box.roles[role];
  if (!c || c.kind === 'supply') return `${uz.wiring.box.supply} — ${r}`;
  if (c.kind === 'switch') return `${swName(input, c.switchId)} — ${r}`;
  return `${lampName(input, c)} — ${r}`;
}

export function issueText(i: BoxIssue, input: BoxInput, cables: Cable[]): string {
  const t = uz.wiring.box.issues;
  const lamp = (id: string) =>
    lampName(
      input,
      cables.find((c) => c.id === id),
    );
  switch (i.code) {
    case 'short':
      return i.toEarth ? t.shortEarth : t.short;
    case 'lamp-never':
    case 'lamp-always':
    case 'lamp-wrong':
    case 'no-earth':
      return fmt(t[i.code], { lamp: lamp(i.cableId) });
    case 'lamp-wrong-key':
      return fmt(t['lamp-wrong-key'], { lamp: lamp(i.cableId), sw: swName(input, i.switchId), k: i.key });
    case 'neutral-switched':
      return fmt(t['neutral-switched'], { sw: swName(input, i.switchId) });
    case 'loose':
      return fmt(t.loose, { core: coreName(input, cables, i.coreId) });
  }
}

export function groupLabel(g: BoxDesign['groups'][number], input: BoxInput): string {
  if (g.kind !== 'key') return g.kind;
  return `${input.switches.findIndex((s) => s.id === g.switchId) + 1}.${g.key}`;
}

export function stepText(g: BoxDesign['groups'][number], input: BoxInput): string {
  const s = uz.wiring.box.step;
  if (g.kind !== 'key') return fmt(s[g.kind], { n: g.ends.length });
  return fmt(s.key, { sw: swName(input, g.switchId), k: g.key ?? 0, lamps: g.ends.length - 1 });
}
