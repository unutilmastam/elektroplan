import type { LineDesign, PanelDesign, Phase } from '@/domain/wiring/panel';
import { DIN_H, MOD, poleXs, type DinKind } from './RealDin';
import { ortho, route, type P } from './RealWire';

/**
 * PHASE 22: geometry of the realistic board — devices on DIN rails, the phase comb, N / PE bars, every
 * conductor inside and the cables leaving. Each conductor is drawn in the direction its current flows
 * (phase: supply → load, neutral: load → supply), tagged so the view can animate the ones in use.
 */

export const ROW_MODULES = 12;

export interface DevGeo {
  key: string;
  kind: DinKind;
  ref: string | null;
  group: string | null;
  line: LineDesign | null;
  modules: number;
  poles: number;
  x: number;
  y: number;
  row: number;
  top: P[];
  bottom: P[];
}

export type Tag =
  | { t: 'feed' }
  | { t: 'phase'; phase: Phase }
  | { t: 'row'; row: number }
  | { t: 'rcd'; id: string }
  | { t: 'line'; id: string }
  | { t: 'nbar'; row: number }
  | { t: 'none' };

export interface Conductor {
  id: string;
  d: string;
  color: string;
  kind: 'L' | 'N' | 'PE';
  tag: Tag;
  /** copper bar (comb, busbar) instead of an insulated wire */
  bar?: boolean;
}

export interface BarGeo {
  kind: 'N' | 'PE';
  x: number;
  y: number;
  w: number;
  label: string;
  terminals: P[];
}

export interface CableGeo {
  line: LineDesign;
  start: P;
  d: string;
  exit: P;
}

export interface BoardGeo {
  view: { w: number; h: number };
  enc: { x: number; y: number; w: number; h: number };
  meter: P;
  devices: DevGeo[];
  rails: Array<{ y: number }>;
  bars: BarGeo[];
  conductors: Conductor[];
  cables: CableGeo[];
}

const PHASE_COLOR: Record<Phase, string> = { L1: 'L', L2: 'L2', L3: 'L3' };

export function boardRealGeo(d: PanelDesign): BoardGeo {
  const three = d.phases === 3;
  const encX = 40;
  const devX0 = encX + (three ? 150 : 120);
  const encW = devX0 - encX + ROW_MODULES * MOD + 40;
  const meter = { x: encX + 30, y: 24 };
  const encY = 330;

  // ---- devices in rows (an RCD stays with its breakers when it fits) ----
  type Item = Omit<DevGeo, 'x' | 'y' | 'row' | 'top' | 'bottom'>;
  const head: Item[] = [
    {
      key: 'main',
      kind: 'main',
      ref: null,
      group: null,
      line: null,
      modules: three ? 4 : 2,
      poles: three ? 4 : 2,
    },
    {
      key: 'relay',
      kind: 'relay',
      ref: null,
      group: null,
      line: null,
      modules: three ? 4 : 2,
      poles: three ? 4 : 2,
    },
    {
      key: 'spd',
      kind: 'spd',
      ref: null,
      group: null,
      line: null,
      modules: three ? 4 : 2,
      poles: three ? 4 : 2,
    },
  ];
  const blocks: Item[][] = [head];
  for (const r of d.rcds)
    blocks.push([
      { key: r.id, kind: 'rcd', ref: r.id, group: null, line: null, modules: 2, poles: 2 },
      ...r.lineIds.map((id) => ({
        key: id,
        kind: 'mcb' as const,
        ref: id,
        group: r.id,
        line: d.lines.find((l) => l.id === id)!,
        modules: 1,
        poles: 1,
      })),
    ]);
  blocks.push(
    d.lines
      .filter((l) => l.rcdId === null)
      .map((l) => ({
        key: l.id,
        kind: l.protection === 'rcbo' ? ('rcbo' as const) : ('mcb' as const),
        ref: l.id,
        group: null,
        line: l,
        modules: l.protection === 'rcbo' ? 2 : 1,
        poles: l.protection === 'rcbo' ? 2 : 1,
      })),
  );
  const rowsItems: Item[][] = [[]];
  let used = 0;
  for (const b of blocks) {
    const size = b.reduce((s, i) => s + i.modules, 0);
    if (used > 0 && used + size > ROW_MODULES && size <= ROW_MODULES) {
      rowsItems.push([]);
      used = 0;
    }
    for (const it of b) {
      if (used + it.modules > ROW_MODULES) {
        rowsItems.push([]);
        used = 0;
      }
      rowsItems[rowsItems.length - 1]!.push(it);
      used += it.modules;
    }
  }

  const devices: DevGeo[] = [];
  const rails: Array<{ y: number }> = [];
  const bars: BarGeo[] = [];
  const conductors: Conductor[] = [];
  const cables: CableGeo[] = [];
  const risers = { PE: encX + 24, N: encX + 44, L1: encX + 66, L2: encX + 86, L3: encX + 106 };
  const add = (c: Conductor) => conductors.push(c);
  const wire = (id: string, a: P, da: P, b: P, db: P, color: string, kind: Conductor['kind'], tag: Tag) =>
    add({ id, d: route(a, da, b, db).d, color, kind, tag });
  const laid = (id: string, pts: P[], color: string, kind: Conductor['kind'], tag: Tag) =>
    add({ id, d: ortho(pts), color, kind, tag });
  const DOWN = { x: 0, y: 1 };
  const UP = { x: 0, y: -1 };

  let y = encY + 70;
  const rowMeta: Array<{
    y: number;
    nbar: BarGeo | null;
    rcdBars: Map<string, BarGeo>;
    pe: BarGeo;
    nTerm: number;
    peTerm: number;
    rcdTerm: Map<string, number>;
  }> = [];
  rowsItems.forEach((items, row) => {
    let x = devX0;
    for (const it of items) {
      const xs = poleXs(it.modules, it.poles);
      devices.push({
        ...it,
        x,
        y,
        row,
        top: xs.map((p) => ({ x: x + p, y: y + 10 })),
        bottom: xs.map((p) => ({ x: x + p, y: y + DIN_H - 10 })),
      });
      x += it.modules * MOD;
    }
    rails.push({ y: y + DIN_H / 2 });
    const lines = items.filter((i) => i.line);
    // bars of this row: PE, main N (circuits not behind an RCD / RCBO), one N per RCD group
    const barY = y + DIN_H + 46;
    let bx = devX0;
    const mkBar = (kind: 'N' | 'PE', n: number, label: string): BarGeo => {
      const w = Math.max(5, n + 1) * 20 + 16;
      const bar: BarGeo = {
        kind,
        x: bx,
        y: barY,
        w,
        label,
        terminals: Array.from({ length: Math.max(5, n + 1) }, (_, i) => ({
          x: bx + 18 + i * 20,
          y: barY + 11,
        })),
      };
      bx += w + 14;
      bars.push(bar);
      return bar;
    };
    const pe = mkBar('PE', lines.length, 'PE');
    const plain = lines.filter((l) => l.group === null && l.kind === 'mcb');
    const nbar = plain.length ? mkBar('N', plain.length, 'N') : null;
    const rcdBars = new Map<string, BarGeo>();
    for (const r of d.rcds)
      if (items.some((i) => i.group === r.id))
        rcdBars.set(r.id, mkBar('N', r.lineIds.length, `N · ${uz_rcd(d, r.id)}`));
    rowMeta.push({ y, nbar, rcdBars, pe, nTerm: 1, peTerm: 1, rcdTerm: new Map() });
    y += DIN_H + 170 + lines.length * 26 + 50;
  });
  const encH = y - encY;

  const dev = (key: string) => devices.find((x) => x.key === key)!;
  const main = dev('main');
  const relay = dev('relay');
  const spd = dev('spd');
  const phases: Phase[] = three ? ['L1', 'L2', 'L3'] : ['L1'];

  // ---- supply: meter → main switch; PE straight to the PE riser ----
  const meterOut = (i: number): P => ({ x: meter.x + 40 + i * 34, y: meter.y + 250 });
  phases.forEach((ph, i) => {
    const m = meterOut(i);
    const lane = encY - 30 + i * 7;
    laid(
      `in-${ph}`,
      [m, { x: m.x, y: lane }, { x: main.top[i]!.x, y: lane }, main.top[i]!],
      PHASE_COLOR[ph],
      'L',
      { t: 'phase', phase: ph },
    );
  });
  {
    const m = meterOut(phases.length);
    const t = main.top[main.top.length - 1]!;
    const lane = encY - 30 + phases.length * 7;
    laid('in-N', [t, { x: t.x, y: lane }, { x: m.x, y: lane }, m], 'N', 'N', { t: 'feed' });
    const pe = meterOut(phases.length + 1);
    laid(
      'in-PE',
      [pe, { x: pe.x, y: encY + 24 }, { x: risers.PE, y: encY + 24 }, { x: risers.PE, y: encY + 40 }],
      'PE',
      'PE',
      { t: 'none' },
    );
  }
  // main → relay (short jumpers), relay → phase risers, N riser → main
  phases.forEach((ph, i) => {
    wire(`main-relay-${ph}`, main.bottom[i]!, DOWN, relay.top[i]!, UP, PHASE_COLOR[ph], 'L', {
      t: 'phase',
      phase: ph,
    });
    const lane = relay.y + DIN_H + 16 + i * 8;
    laid(
      `relay-riser-${ph}`,
      [relay.bottom[i]!, { x: relay.bottom[i]!.x, y: lane }, { x: risers[ph], y: lane }],
      PHASE_COLOR[ph],
      'L',
      { t: 'phase', phase: ph },
    );
  });
  {
    const nb = main.bottom[main.bottom.length - 1]!;
    const lane = main.y + DIN_H + 44;
    laid('nriser-main', [{ x: risers.N, y: lane }, { x: nb.x, y: lane }, nb], 'N', 'N', { t: 'feed' });
    const rn = relay.top[relay.top.length - 1]!;
    laid('relay-n', [{ x: risers.N, y: relay.y - 58 }, { x: rn.x, y: relay.y - 58 }, rn], 'N', 'N', {
      t: 'none',
    });
  }
  const lastY = rowMeta[rowMeta.length - 1]!.y + DIN_H + 60;
  for (const k of ['PE', 'N', ...phases] as const) {
    const x = risers[k];
    add({
      id: `riser-${k}`,
      d: `M${x} ${encY + 40} V${lastY}`,
      color: k === 'PE' ? 'PE' : k === 'N' ? 'N' : PHASE_COLOR[k as Phase],
      kind: k === 'PE' ? 'PE' : k === 'N' ? 'N' : 'L',
      tag: k === 'PE' ? { t: 'none' } : k === 'N' ? { t: 'feed' } : { t: 'phase', phase: k as Phase },
    });
  }
  // SPD: phases from the risers, N from the N riser, earth down to PE
  spd.top.slice(0, phases.length).forEach((p, i) => {
    const lane = spd.y - 74 - i * 8;
    laid(
      `spd-${i}`,
      [{ x: risers[phases[i]!], y: lane }, { x: p.x, y: lane }, p],
      PHASE_COLOR[phases[i]!],
      'L',
      { t: 'none' },
    );
  });
  {
    const t = spd.top[spd.top.length - 1]!;
    laid('spd-n', [{ x: risers.N, y: spd.y - 66 }, { x: t.x, y: spd.y - 66 }, t], 'N', 'N', { t: 'none' });
    const pb = spd.bottom[0]!;
    laid(
      'spd-pe',
      [pb, { x: pb.x, y: spd.y + DIN_H + 30 }, { x: risers.PE, y: spd.y + DIN_H + 30 }],
      'PE',
      'PE',
      { t: 'none' },
    );
  }

  // ---- rows: phase feed to the devices on the comb, RCD groups, circuits ----
  rowsItems.forEach((_, row) => {
    const meta = rowMeta[row]!;
    const rowDevs = devices.filter(
      (x) => x.row === row && x.kind !== 'main' && x.kind !== 'relay' && x.kind !== 'spd',
    );
    const fed = rowDevs.filter((x) => x.group === null);
    // single phase: a copper comb over the fed devices; three phase: a drop from the device's phase riser
    if (!three && fed.length) {
      const a = { x: risers.L1, y: meta.y - 24 };
      const x1 = Math.max(...fed.map((f) => f.top[0]!.x));
      add({
        id: `comb-feed-${row}`,
        d: `M${a.x} ${a.y} H${fed[0]!.top[0]!.x - 20}`,
        color: 'L',
        kind: 'L',
        tag: { t: 'row', row },
      });
      add({
        id: `comb-${row}`,
        d: `M${fed[0]!.top[0]!.x - 20} ${meta.y - 24} H${x1 + 8}`,
        color: 'L',
        kind: 'L',
        tag: { t: 'row', row },
        bar: true,
      });
      for (const f of fed)
        add({
          id: `tooth-${f.key}`,
          d: `M${f.top[0]!.x} ${meta.y - 24} V${f.top[0]!.y}`,
          color: 'L',
          kind: 'L',
          tag: f.line ? { t: 'line', id: f.key } : f.kind === 'rcd' ? { t: 'rcd', id: f.key } : { t: 'none' },
          bar: true,
        });
    } else
      fed.forEach((f, i) => {
        const ph = f.line?.phase ?? d.rcds.find((r) => r.id === f.ref)?.phase ?? 'L1';
        wire(
          `drop-${f.key}`,
          { x: risers[ph], y: meta.y - 40 - (i % 3) * 8 },
          { x: 1, y: 0 },
          f.top[0]!,
          UP,
          PHASE_COLOR[ph],
          'L',
          f.line ? { t: 'line', id: f.key } : { t: 'rcd', id: f.key },
        );
      });
    // RCD: out to a short comb over its breakers; its own N bar; N in from the riser
    for (const r of d.rcds) {
      const rd = devices.find((x) => x.key === r.id && x.row === row);
      if (!rd) continue;
      const kids = rowDevs.filter((x) => x.group === r.id);
      const color = PHASE_COLOR[r.phase];
      const subY = meta.y - 6;
      wire(
        `rcd-out-${r.id}`,
        rd.bottom[0]!,
        DOWN,
        { x: rd.x + rd.modules * MOD + 6, y: subY },
        UP,
        color,
        'L',
        { t: 'rcd', id: r.id },
      );
      if (kids.length) {
        add({
          id: `sub-${r.id}`,
          d: `M${rd.x + rd.modules * MOD + 6} ${subY} H${kids[kids.length - 1]!.top[0]!.x + 6}`,
          color,
          kind: 'L',
          tag: { t: 'rcd', id: r.id },
          bar: true,
        });
        for (const k of kids)
          add({
            id: `subt-${k.key}`,
            d: `M${k.top[0]!.x} ${subY} V${k.top[0]!.y}`,
            color,
            kind: 'L',
            tag: { t: 'line', id: k.key },
            bar: true,
          });
      }
      const nb = meta.rcdBars.get(r.id)!;
      const bt = nb.terminals[0]!;
      const rn = rd.bottom[1]!;
      const nLane = meta.y + DIN_H + 22;
      laid(`rcd-nbar-${r.id}`, [bt, { x: bt.x, y: nLane }, { x: rn.x, y: nLane }, rn], 'N', 'N', {
        t: 'rcd',
        id: r.id,
      });
      const ti = rd.top[1]!;
      const inLane = meta.y - 50 - (d.rcds.indexOf(r) % 3) * 6;
      laid(`rcd-nin-${r.id}`, [ti, { x: ti.x, y: inLane }, { x: risers.N, y: inLane }], 'N', 'N', {
        t: 'rcd',
        id: r.id,
      });
      meta.rcdTerm.set(r.id, 1);
    }
    // bars to the risers
    laid(
      `pe-${row}`,
      [
        { x: risers.PE, y: meta.pe.y + 11 },
        { x: meta.pe.x, y: meta.pe.y + 11 },
      ],
      'PE',
      'PE',
      { t: 'none' },
    );
    if (meta.nbar)
      laid(
        `nbar-${row}`,
        [
          { x: meta.nbar.x, y: meta.nbar.y + 11 },
          { x: risers.N, y: meta.nbar.y + 11 },
        ],
        'N',
        'N',
        { t: 'nbar', row },
      );

    // circuits: L from the breaker, N from its bar (or the RCBO), PE from the PE bar → cable → out
    const lineDevs = rowDevs.filter((x) => x.line);
    lineDevs.forEach((ld, i) => {
      const l = ld.line!;
      const start = { x: ld.bottom[0]!.x + 6, y: meta.y + DIN_H + 150 + i * 26 };
      const color = three ? PHASE_COLOR[l.phase] : 'L';
      laid(`out-L-${l.id}`, [ld.bottom[0]!, { x: ld.bottom[0]!.x, y: start.y }], color, 'L', {
        t: 'line',
        id: l.id,
      });
      const barY = meta.pe.y;
      if (ld.kind === 'rcbo') {
        const nb = ld.bottom[1]!;
        const lane = meta.y + DIN_H + 24;
        laid(
          `out-N-${l.id}`,
          [{ x: start.x + 1, y: start.y }, { x: start.x + 1, y: lane }, { x: nb.x, y: lane }, nb],
          'N',
          'N',
          { t: 'line', id: l.id },
        );
        const nt = ld.top[1]!;
        const inLane = meta.y - 50 - (i % 3) * 6;
        laid(`rcbo-nin-${l.id}`, [nt, { x: nt.x, y: inLane }, { x: risers.N, y: inLane }], 'N', 'N', {
          t: 'line',
          id: l.id,
        });
      } else {
        const bar = ld.group ? meta.rcdBars.get(ld.group)! : meta.nbar!;
        const key = ld.group ?? '__main';
        const ti = ld.group ? (meta.rcdTerm.get(key) ?? 1) : meta.nTerm;
        if (ld.group) meta.rcdTerm.set(key, ti + 1);
        else meta.nTerm = ti + 1;
        const bt = bar.terminals[ti] ?? bar.terminals[bar.terminals.length - 1]!;
        const lane = barY + 36 + (i % 5) * 6;
        laid(
          `out-N-${l.id}`,
          [{ x: start.x + 1, y: start.y }, { x: start.x + 1, y: lane }, { x: bt.x, y: lane }, bt],
          'N',
          'N',
          { t: 'line', id: l.id },
        );
      }
      const pt = meta.pe.terminals[meta.peTerm++] ?? meta.pe.terminals[meta.pe.terminals.length - 1]!;
      const peLane = barY + 66 + (i % 5) * 6;
      laid(
        `out-PE-${l.id}`,
        [pt, { x: pt.x, y: peLane }, { x: start.x + 8, y: peLane }, { x: start.x + 8, y: start.y }],
        'PE',
        'PE',
        { t: 'none' },
      );
      const exit = { x: encX + encW + 6, y: start.y + 12 };
      cables.push({ line: l, start, exit, d: `M${start.x} ${start.y + 4} V${start.y + 12} H${exit.x + 40}` });
    });
  });

  return {
    view: { w: encX + encW + 330, h: encY + encH + 40 },
    enc: { x: encX, y: encY, w: encW, h: encH },
    meter,
    devices,
    rails,
    bars,
    conductors,
    cables,
  };
}

/** "UZO 1" without importing the dictionary into geometry (label filled by the view). */
function uz_rcd(d: PanelDesign, id: string) {
  return `#${d.rcds.findIndex((r) => r.id === id) + 1}`;
}
