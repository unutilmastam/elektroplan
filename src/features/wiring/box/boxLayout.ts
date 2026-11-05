import type { Cable } from '@/domain/wiring/junctionBox';

/** PHASE 21: positions for the junction box drawing (SVG units, 1000 × 660). Pure. */

export const BOX = { x: 210, y: 190, w: 580, h: 290 };
export const VIEW = { w: 1000, h: 660 };

export interface Pt {
  x: number;
  y: number;
}

export interface CablePlace {
  cable: Cable;
  /** where the device sits (lamp / switch / supply label) */
  device: Pt;
  /** where the cable enters the box */
  entry: Pt;
  /** inward direction of the cores from the entry */
  inward: Pt;
}

const spread = (n: number, from: number, to: number) =>
  Array.from({ length: n }, (_, i) => (n === 1 ? (from + to) / 2 : from + ((to - from) * i) / (n - 1)));

export function placeCables(cables: Cable[]): CablePlace[] {
  const lamps = cables.filter((c) => c.kind === 'lamp');
  const switches = cables.filter((c) => c.kind === 'switch');
  const lx = spread(lamps.length, 90, 910);
  const sx = spread(switches.length, 260, 740);
  const clampX = (x: number) => Math.min(BOX.x + BOX.w - 30, Math.max(BOX.x + 30, x));
  const out: CablePlace[] = [];
  for (const c of cables) {
    if (c.kind === 'supply')
      out.push({
        cable: c,
        device: { x: 40, y: BOX.y + BOX.h / 2 },
        entry: { x: BOX.x, y: BOX.y + BOX.h / 2 },
        inward: { x: 1, y: 0 },
      });
    else if (c.kind === 'lamp') {
      const x = lx[lamps.indexOf(c)]!;
      out.push({
        cable: c,
        device: { x, y: 70 },
        entry: {
          x: clampX(BOX.x + 30 + ((BOX.w - 60) * lamps.indexOf(c)) / Math.max(1, lamps.length - 1 || 1)),
          y: BOX.y,
        },
        inward: { x: 0, y: 1 },
      });
    } else {
      const x = sx[switches.indexOf(c)]!;
      out.push({
        cable: c,
        device: { x, y: 572 },
        entry: { x: clampX(x), y: BOX.y + BOX.h },
        inward: { x: 0, y: -1 },
      });
    }
  }
  // one lamp: straight above the box middle
  if (lamps.length === 1) out.find((p) => p.cable.kind === 'lamp')!.entry.x = BOX.x + BOX.w / 2;
  return out;
}

/** Clamp centres inside the box: one or two rows. */
export function placeClamps(n: number): Pt[] {
  const rows = n > 6 ? 2 : 1;
  const perRow = Math.ceil(n / rows);
  const pts: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    const count = r === rows - 1 ? n - perRow * (rows - 1) : perRow;
    const y = rows === 1 ? BOX.y + BOX.h / 2 : BOX.y + 95 + r * 105;
    spread(count, BOX.x + 70, BOX.x + BOX.w - 70).forEach((x) => pts.push({ x, y }));
  }
  return pts;
}

/** Width of a clamp with `ways` openings. */
export const clampWidth = (ways: number) => 14 + ways * 13;

/** The opening of a clamp a conductor goes into. */
export function slot(c: Pt, ways: number, i: number): Pt {
  const w = clampWidth(ways);
  return { x: c.x - w / 2 + 13 + i * 13, y: c.y };
}

/** A core's loose end (not clamped yet), just inside the box. */
export function looseEnd(p: CablePlace, i: number, n: number): Pt {
  const off = (i - (n - 1) / 2) * 30;
  return {
    x: p.entry.x + p.inward.x * 80 + (p.inward.y !== 0 ? off : 0),
    y: p.entry.y + p.inward.y * 72 + (p.inward.x !== 0 ? off : 0),
  };
}

export function wirePath(a: Pt, b: Pt, inward: Pt): string {
  const k = 60;
  return `M${a.x} ${a.y} C${a.x + inward.x * k} ${a.y + inward.y * k} ${b.x} ${b.y + (b.y > a.y ? -k : k) * (inward.x ? 0.4 : 1)} ${b.x} ${b.y}`;
}
