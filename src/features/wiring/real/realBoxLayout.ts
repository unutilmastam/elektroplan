import type { BoxDesign, Cable } from '@/domain/wiring/junctionBox';
import { wagoWidth } from './RealWago';
import type { P } from './RealWire';

/** PHASE 22: geometry of the realistic junction box view (SVG px ≈ 4.5 px/mm). Pure. */

export interface VisualClamp {
  id: string;
  ways: number;
  /** core id, `jumper:…` for a link to the next clamp of a chain, or null (free opening) */
  ends: Array<string | null>;
  label: string;
  /** conductor colour of this join (jumpers) */
  color: 'L' | 'N' | 'PE' | 'S1';
}

export interface CableGeo {
  cable: Cable;
  /** device end (lamp / switch / panel) */
  outside: P;
  /** where it passes the box wall */
  entry: P;
  inward: P;
  sheathEnd: P;
  side: 'l' | 't' | 'b';
}

export interface BoxGeo {
  view: { w: number; h: number };
  box: { x: number; y: number; w: number; h: number };
  cables: CableGeo[];
  /** core id → where its insulation leaves the sheath, and the direction it leaves in */
  coreStart: Map<string, { at: P; dir: P }>;
  /** core id → its resting tip when not clamped */
  rest: Map<string, P>;
  clamps: Array<VisualClamp & { c: P; up: boolean }>;
}

const spread = (n: number, a: number, b: number) =>
  Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + ((b - a) * i) / (n - 1)));

/** Ready-made joins → clamps to draw (a join of more than 5 is a chain linked by short jumpers). */
export function clampsFromDesign(
  d: BoxDesign,
  label: (g: BoxDesign['groups'][number]) => string,
): VisualClamp[] {
  const out: VisualClamp[] = [];
  for (const g of d.groups) {
    const color = g.kind === 'key' ? 'S1' : g.kind;
    const sizes = g.clamps;
    let rest = [...g.ends];
    sizes.forEach((size, i) => {
      const jumpersIn = i > 0 ? 1 : 0;
      const jumpersOut = i < sizes.length - 1 ? 1 : 0;
      const take = size - jumpersIn - jumpersOut;
      const ends: Array<string | null> = [];
      if (jumpersIn) ends.push(`jumper:${g.id}:${i - 1}`);
      ends.push(...rest.slice(0, take));
      rest = rest.slice(take);
      if (jumpersOut) ends.push(`jumper:${g.id}:${i}`);
      while (ends.length < size) ends.push(null);
      out.push({
        id: `${g.id}-${i}`,
        ways: size,
        ends,
        label: sizes.length > 1 ? `${label(g)}${i + 1}` : label(g),
        color,
      });
    });
  }
  return out;
}

export function boxGeometry(
  cables: Cable[],
  clamps: VisualClamp[],
  rowOf: (c: VisualClamp, i: number) => 'top' | 'bottom',
): BoxGeo {
  const rows = { top: [] as VisualClamp[], bottom: [] as VisualClamp[] };
  clamps.forEach((c, i) => rows[rowOf(c, i)].push(c));
  const gap = 26;
  const rowW = (r: VisualClamp[]) =>
    r.reduce((s, c) => s + wagoWidth(c.ways), 0) + gap * Math.max(0, r.length - 1);
  const boxW = Math.max(600, Math.max(rowW(rows.top), rowW(rows.bottom)) + 180);
  const boxH = 560;
  const lamps = cables.filter((c) => c.kind === 'lamp');
  const switches = cables.filter((c) => c.kind === 'switch');
  const viewW = Math.max(boxW + 560, lamps.length * 150 + 120, 1200);
  const box = { x: (viewW - boxW) / 2, y: 260, w: boxW, h: boxH };
  const view = { w: viewW, h: 1100 };

  const geo: CableGeo[] = [];
  const lampX = spread(lamps.length, 110, viewW - 110);
  const lampEntry = spread(lamps.length, box.x + 90, box.x + boxW - 90);
  const swX = spread(switches.length, box.x + 120, box.x + boxW - 120);
  for (const c of cables) {
    if (c.kind === 'supply') {
      const entry = { x: box.x, y: box.y + boxH / 2 };
      geo.push({
        cable: c,
        outside: { x: 0, y: entry.y },
        entry,
        inward: { x: 1, y: 0 },
        sheathEnd: { x: entry.x + 64, y: entry.y },
        side: 'l',
      });
    } else if (c.kind === 'lamp') {
      const i = lamps.indexOf(c);
      const entry = { x: lampEntry[i]!, y: box.y };
      geo.push({
        cable: c,
        outside: { x: lampX[i]!, y: 150 },
        entry,
        inward: { x: 0, y: 1 },
        sheathEnd: { x: entry.x, y: entry.y + 58 },
        side: 't',
      });
    } else {
      const i = switches.indexOf(c);
      const entry = { x: swX[i]!, y: box.y + boxH };
      geo.push({
        cable: c,
        outside: { x: swX[i]!, y: 960 },
        entry,
        inward: { x: 0, y: -1 },
        sheathEnd: { x: entry.x, y: entry.y - 58 },
        side: 'b',
      });
    }
  }

  const coreStart = new Map<string, { at: P; dir: P }>();
  const rest = new Map<string, P>();
  for (const g of geo) {
    const n = g.cable.cores.length;
    g.cable.cores.forEach((core, i) => {
      const off = (i - (n - 1) / 2) * 13;
      const perp = { x: -g.inward.y, y: g.inward.x };
      const at = { x: g.sheathEnd.x + perp.x * off, y: g.sheathEnd.y + perp.y * off };
      coreStart.set(core.id, { at, dir: g.inward });
      const fan = (i - (n - 1) / 2) * 34;
      rest.set(core.id, {
        x: at.x + g.inward.x * 70 + perp.x * fan,
        y: at.y + g.inward.y * 70 + perp.y * fan,
      });
    });
  }

  const place = (r: VisualClamp[], y: number, up: boolean) => {
    let x = box.x + (boxW - rowW(r)) / 2;
    return r.map((c) => {
      const w = wagoWidth(c.ways);
      const out = { ...c, c: { x: x + w / 2, y }, up };
      x += w + gap;
      return out;
    });
  };
  const placed = [...place(rows.top, box.y + 205, true), ...place(rows.bottom, box.y + 360, false)];
  // keep the caller's order (index = clamp index)
  const order = new Map(clamps.map((c, i) => [c.id, i]));
  placed.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return { view, box, cables: geo, coreStart, rest, clamps: placed };
}

/** Clamp contents → electrical joins (clamps linked by a jumper are one join; jumper ends are dropped). */
export function joinsFromClamps(clamps: Array<{ ends: Array<string | null> }>): string[][] {
  const groups = clamps.map((c) => c.ends.filter((e): e is string => e !== null));
  const parent = groups.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const byJumper = new Map<string, number>();
  groups.forEach((g, i) =>
    g.forEach((e) => {
      if (!e.startsWith('jumper:')) return;
      const j = byJumper.get(e);
      if (j === undefined) byJumper.set(e, i);
      else parent[find(i)] = find(j);
    }),
  );
  const merged = new Map<number, string[]>();
  groups.forEach((g, i) => {
    const r = find(i);
    merged.set(r, [...(merged.get(r) ?? []), ...g.filter((e) => !e.startsWith('jumper:'))]);
  });
  return [...merged.values()].filter((j) => j.length > 0);
}
