import type { LineDesign, PanelDesign } from '@/domain/wiring/panel';

/** PHASE 21: where every device of the board sits on the DIN rails (SVG units). Pure. */

export const MW = 36; // one DIN module
export const DH = 96; // device height
export const ROW_MODULES = 12;
const ROW_H = 250; // device + outgoing cables + consumer card
const LEFT = 24;
const TOP = 96;

export type DeviceKind = 'main' | 'relay' | 'spd' | 'rcd' | 'rcbo' | 'mcb';

export interface PlacedDevice {
  key: string;
  kind: DeviceKind;
  /** line id (mcb / rcbo) or RCD id */
  ref: string | null;
  /** RCD a breaker sits behind */
  group: string | null;
  modules: number;
  x: number;
  y: number;
  w: number;
  row: number;
  line: LineDesign | null;
}

export interface BoardLayout {
  devices: PlacedDevice[];
  width: number;
  height: number;
  rows: number;
  busY: number;
}

export function boardLayout(d: PanelDesign): BoardLayout {
  const poles = d.phases === 3 ? 4 : 2;
  const seq: Array<Omit<PlacedDevice, 'x' | 'y' | 'w' | 'row'>> = [
    { key: 'main', kind: 'main', ref: null, group: null, modules: poles, line: null },
    { key: 'relay', kind: 'relay', ref: null, group: null, modules: poles, line: null },
    { key: 'spd', kind: 'spd', ref: null, group: null, modules: poles, line: null },
  ];
  const blocks: Array<typeof seq> = [seq];
  for (const r of d.rcds) {
    blocks.push([
      { key: r.id, kind: 'rcd', ref: r.id, group: null, modules: 2, line: null },
      ...r.lineIds.map((id) => {
        const line = d.lines.find((l) => l.id === id)!;
        return { key: id, kind: 'mcb' as const, ref: id, group: r.id, modules: 1, line };
      }),
    ]);
  }
  const rest = d.lines.filter((l) => l.rcdId === null);
  blocks.push(
    rest.map((line) => ({
      key: line.id,
      kind: line.protection === 'rcbo' ? ('rcbo' as const) : ('mcb' as const),
      ref: line.id,
      group: null,
      modules: line.protection === 'rcbo' ? 2 : 1,
      line,
    })),
  );

  const devices: PlacedDevice[] = [];
  let row = 0;
  let used = 0;
  for (const block of blocks) {
    const size = block.reduce((s, b) => s + b.modules, 0);
    // keep an RCD with its breakers when it fits in a fresh row
    if (used > 0 && used + size > ROW_MODULES && size <= ROW_MODULES) {
      row++;
      used = 0;
    }
    for (const b of block) {
      if (used + b.modules > ROW_MODULES) {
        row++;
        used = 0;
      }
      devices.push({ ...b, x: LEFT + used * MW, y: TOP + row * ROW_H, w: b.modules * MW, row });
      used += b.modules;
    }
  }
  const rows = row + 1;
  const busY = TOP + rows * ROW_H - 18;
  return { devices, width: LEFT * 2 + ROW_MODULES * MW, height: busY + 60, rows, busY };
}
