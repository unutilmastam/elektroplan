import {
  BREAKERS,
  CONSUMERS,
  ENCLOSURES,
  RCD_RATINGS,
  VOLT,
  VOLT_3P,
  cableFor,
  nearestStandard,
  nextStandard,
  type ConsumerType,
} from './catalog';

/** PHASE 21 — distribution board ("shit") design: what goes in and how it is wired. Pure. */

export type Phase = 'L1' | 'L2' | 'L3';

export interface PanelLine {
  id: string;
  type: ConsumerType;
  /** user label ("Oshxona", "Yotoqxona chiroqlari") */
  name: string;
  powerW: number;
}

export interface PanelInput {
  phases: 1 | 3;
  /** power the utility allows (ajratilgan quvvat), kW */
  allocatedKw: number;
  lines: PanelLine[];
}

export interface LineDesign {
  id: string;
  currentA: number;
  breakerA: number;
  curve: 'B' | 'C';
  cableMm2: number;
  /** 3 cores: L, N, PE */
  cores: 3;
  protection: 'rcd' | 'rcbo' | 'none';
  /** RCD this line sits behind (protection 'rcd') */
  rcdId: string | null;
  phase: Phase;
  /** line needs more than one circuit: split it */
  tooBig: boolean;
}

export interface RcdDesign {
  id: string;
  ratingA: number;
  sensitivityMa: 30;
  phase: Phase;
  lineIds: string[];
}

export interface PanelDesign {
  phases: 1 | 3;
  main: { ratingA: number; poles: 2 | 4; cableMm2: number; relayA: number; spd: true };
  lines: LineDesign[];
  rcds: RcdDesign[];
  totals: {
    connectedKw: number;
    demandKw: number;
    demandA: number;
    allocatedA: number;
    overAllocation: boolean;
  };
  phaseLoadA: Record<Phase, number>;
  modules: number;
  enclosure: number;
  bom: BomItem[];
}

export type BomItem =
  | { kind: 'main'; poles: number; ratingA: number; qty: 1 }
  | { kind: 'relay'; ratingA: number; phases: 1 | 3; qty: 1 }
  | { kind: 'spd'; poles: number; qty: 1 }
  | { kind: 'rcd'; poles: number; ratingA: number; qty: number }
  | { kind: 'rcbo'; ratingA: number; curve: 'B' | 'C'; qty: number }
  | { kind: 'mcb'; ratingA: number; curve: 'B' | 'C'; qty: number }
  | { kind: 'bus'; bus: 'N' | 'PE'; terminals: number; qty: number }
  | { kind: 'comb'; poles: number; qty: number }
  | { kind: 'enclosure'; modules: number; qty: 1 }
  | { kind: 'cable'; mm2: number; cores: number; qty: number };

/** At most this many circuits behind one RCD (selectivity, nuisance trips). */
export const LINES_PER_RCD = 4;
const PHASES: Phase[] = ['L1', 'L2', 'L3'];

export const lineCurrent = (l: Pick<PanelLine, 'type' | 'powerW'>) =>
  l.powerW / (VOLT * CONSUMERS[l.type].cosPhi);

export function designLine(l: PanelLine): Omit<LineDesign, 'rcdId' | 'phase'> {
  const spec = CONSUMERS[l.type];
  const currentA = lineCurrent(l);
  const need = nextStandard(BREAKERS, Math.max(currentA, spec.minBreaker));
  const breakerA = Math.min(need, nextStandard(BREAKERS, spec.maxBreaker));
  return {
    id: l.id,
    currentA: Math.round(currentA * 10) / 10,
    breakerA,
    curve: spec.curve,
    cableMm2: cableFor(breakerA),
    cores: 3,
    protection: spec.protection,
    tooBig: currentA > breakerA + 1e-9,
  };
}

export function mainCurrent(phases: 1 | 3, kw: number): number {
  return phases === 1 ? (kw * 1000) / (VOLT * 0.95) : (kw * 1000) / (Math.sqrt(3) * VOLT_3P * 0.95);
}

/** Lines go to the least loaded phase, biggest first (3-phase boards). */
function assignPhases(lines: Array<Omit<LineDesign, 'rcdId' | 'phase'>>, phases: 1 | 3) {
  const load: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
  const out = new Map<string, Phase>();
  const order = [...lines].sort((a, b) => b.currentA - a.currentA || a.id.localeCompare(b.id));
  for (const l of order) {
    const ph = phases === 1 ? 'L1' : PHASES.reduce((best, p) => (load[p] < load[best] ? p : best), 'L1');
    load[ph] += l.currentA;
    out.set(l.id, ph);
  }
  return { phaseOf: out, load };
}

export function recommendPanel(input: PanelInput): PanelDesign {
  const base = input.lines.map(designLine);
  const { phaseOf, load } = assignPhases(base, input.phases);

  const allocatedA = Math.round(mainCurrent(input.phases, input.allocatedKw) * 10) / 10;
  const mainA = nearestStandard(
    BREAKERS.filter((b) => b >= 16),
    allocatedA,
  );

  // RCD groups: per phase, up to LINES_PER_RCD circuits each, in the order the user listed them
  const rcds: RcdDesign[] = [];
  const rcdOf = new Map<string, string>();
  for (const ph of PHASES) {
    const group = base.filter((l) => l.protection === 'rcd' && phaseOf.get(l.id) === ph);
    for (let i = 0; i < group.length; i += LINES_PER_RCD) {
      const chunk = group.slice(i, i + LINES_PER_RCD);
      const id = `rcd-${rcds.length + 1}`;
      const sum = chunk.reduce((s, l) => s + l.breakerA, 0);
      // an RCD has no overcurrent trip: it must carry what the breakers upstream / downstream allow
      const ratingA = nextStandard(RCD_RATINGS, Math.min(mainA, sum));
      rcds.push({ id, ratingA, sensitivityMa: 30, phase: ph, lineIds: chunk.map((l) => l.id) });
      chunk.forEach((l) => rcdOf.set(l.id, id));
    }
  }
  const lines: LineDesign[] = base.map((l) => ({
    ...l,
    rcdId: rcdOf.get(l.id) ?? null,
    phase: phaseOf.get(l.id)!,
  }));

  const connectedW = input.lines.reduce((s, l) => s + l.powerW, 0);
  const demandW = input.lines.reduce((s, l) => s + l.powerW * CONSUMERS[l.type].demand, 0);
  const demandA = mainCurrent(input.phases, demandW / 1000);

  const three = input.phases === 3;
  const mcbs = lines.filter((l) => l.protection !== 'rcbo');
  const rcbos = lines.filter((l) => l.protection === 'rcbo');
  const modules =
    (three ? 4 : 2) + // main switch
    (three ? 4 : 2) + // voltage relay
    (three ? 4 : 2) + // surge protection
    rcds.length * 2 +
    rcbos.length * 2 +
    mcbs.length;
  const enclosure = nextStandard(ENCLOSURES, Math.ceil(modules * 1.2)); // 20 % spare

  return {
    phases: input.phases,
    main: {
      ratingA: mainA,
      poles: three ? 4 : 2,
      cableMm2: cableFor(mainA),
      relayA: nextStandard([32, 40, 50, 63, 80], mainA),
      spd: true,
    },
    lines,
    rcds,
    totals: {
      connectedKw: Math.round(connectedW / 100) / 10,
      demandKw: Math.round(demandW / 100) / 10,
      demandA: Math.round(demandA * 10) / 10,
      allocatedA,
      overAllocation: demandA > allocatedA,
    },
    phaseLoadA: { L1: round1(load.L1), L2: round1(load.L2), L3: round1(load.L3) },
    modules,
    enclosure,
    bom: bomFor(input, lines, rcds, mainA, enclosure),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function bomFor(
  input: PanelInput,
  lines: LineDesign[],
  rcds: RcdDesign[],
  mainA: number,
  enclosure: number,
): BomItem[] {
  const three = input.phases === 3;
  const out: BomItem[] = [
    { kind: 'main', poles: three ? 4 : 2, ratingA: mainA, qty: 1 },
    { kind: 'relay', ratingA: nextStandard([32, 40, 50, 63, 80], mainA), phases: input.phases, qty: 1 },
    { kind: 'spd', poles: three ? 4 : 2, qty: 1 },
  ];
  const group = <K extends string>(items: LineDesign[], key: (l: LineDesign) => K) => {
    const m = new Map<K, LineDesign[]>();
    for (const l of items) m.set(key(l), [...(m.get(key(l)) ?? []), l]);
    return m;
  };
  const rcdCounts = new Map<number, number>();
  for (const r of rcds) rcdCounts.set(r.ratingA, (rcdCounts.get(r.ratingA) ?? 0) + 1);
  for (const [ratingA, qty] of rcdCounts) out.push({ kind: 'rcd', poles: 2, ratingA, qty });
  for (const [, ls] of group(
    lines.filter((l) => l.protection === 'rcbo'),
    (l) => `${l.breakerA}${l.curve}`,
  ))
    out.push({ kind: 'rcbo', ratingA: ls[0]!.breakerA, curve: ls[0]!.curve, qty: ls.length });
  for (const [, ls] of group(
    lines.filter((l) => l.protection !== 'rcbo'),
    (l) => `${l.breakerA}${l.curve}`,
  ))
    out.push({ kind: 'mcb', ratingA: ls[0]!.breakerA, curve: ls[0]!.curve, qty: ls.length });
  const terminals = Math.max(6, lines.length + 2 + rcds.length);
  out.push({ kind: 'bus', bus: 'N', terminals, qty: 1 }, { kind: 'bus', bus: 'PE', terminals, qty: 1 });
  if (lines.length > 1) out.push({ kind: 'comb', poles: three ? 3 : 1, qty: Math.ceil(enclosure / 12) });
  out.push({ kind: 'enclosure', modules: enclosure, qty: 1 });
  for (const [, ls] of group(lines, (l) => `${l.cableMm2}`))
    out.push({ kind: 'cable', mm2: ls[0]!.cableMm2, cores: 3, qty: ls.length });
  return out;
}
