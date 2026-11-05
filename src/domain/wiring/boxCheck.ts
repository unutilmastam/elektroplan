import { SUPPLY, boxCables, switchCable, type BoxInput, type Cable } from './junctionBox';

/**
 * PHASE 21 — electrical test of a junction box: any set of joins (each join = core ends clamped together)
 * is tried with every combination of switch keys. Lamps must light exactly when their key is on, nothing may
 * short, the switch must break the phase and every lamp must be earthed.
 */

export type Joins = string[][];
export type KeyState = Record<string, boolean[]>; // switch id → key on/off

export type BoxIssue =
  | { code: 'short'; state: KeyState; toEarth: boolean }
  | { code: 'lamp-never'; cableId: string }
  | { code: 'lamp-always'; cableId: string }
  | { code: 'lamp-wrong-key'; cableId: string; switchId: string; key: number }
  | { code: 'lamp-wrong'; cableId: string }
  | { code: 'neutral-switched'; switchId: string }
  | { code: 'no-earth'; cableId: string }
  | { code: 'loose'; coreId: string };

export interface BoxStatus {
  short: boolean;
  /** cores at phase potential (drawn "live") */
  live: Set<string>;
  /** lamp cable id → lit */
  lit: Record<string, boolean>;
}

class Dsu {
  private p = new Map<string, string>();
  find(a: string): string {
    let r = this.p.get(a) ?? a;
    if (r === a) return a;
    r = this.find(r);
    this.p.set(a, r);
    return r;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

/** The circuit at one moment: which cores carry phase, which lamps glow, is there a short. */
export function boxStatus(
  input: BoxInput,
  joins: Joins,
  keys: KeyState,
  cables: Cable[] = boxCables(input),
): BoxStatus {
  const d = new Dsu();
  for (const j of joins) for (let i = 1; i < j.length; i++) d.union(j[0]!, j[i]!);
  for (const s of input.switches)
    for (let k = 1; k <= s.keys; k++)
      if (keys[s.id]?.[k - 1]) d.union(`${switchCable(s)}:C`, `${switchCable(s)}:K${k}`);
  const L = d.find(`${SUPPLY}:L`);
  const N = d.find(`${SUPPLY}:N`);
  const PE = d.find(`${SUPPLY}:PE`);
  const short = L === N || L === PE;
  const live = new Set<string>();
  const lit: Record<string, boolean> = {};
  for (const c of cables) {
    for (const k of c.cores) if (!short && d.find(k.id) === L) live.add(k.id);
    if (c.kind !== 'lamp') continue;
    const a = d.find(`${c.id}:L`);
    const b = d.find(`${c.id}:N`);
    lit[c.id] = !short && ((a === L && b === N) || (a === N && b === L));
  }
  return { short, live, lit };
}

function allStates(input: BoxInput): KeyState[] {
  const slots = input.switches.flatMap((s) => Array.from({ length: s.keys }, (_, k) => [s.id, k] as const));
  const out: KeyState[] = [];
  for (let m = 0; m < 1 << slots.length; m++) {
    const st: KeyState = Object.fromEntries(
      input.switches.map((s) => [s.id, Array<boolean>(s.keys).fill(false)]),
    );
    slots.forEach(([id, k], i) => (st[id]![k] = (m & (1 << i)) !== 0));
    out.push(st);
  }
  return out;
}

export function checkBox(input: BoxInput, joins: Joins): { ok: boolean; issues: BoxIssue[] } {
  const cables = boxCables(input);
  const issues: BoxIssue[] = [];
  const joined = new Set(joins.flat());
  for (const c of cables)
    for (const k of c.cores) if (!joined.has(k.id)) issues.push({ code: 'loose', coreId: k.id });

  const states = allStates(input);
  const lamps = cables.filter((c) => c.kind === 'lamp');
  const litBy = new Map<string, boolean[]>(lamps.map((l) => [l.id, []]));
  let shortSeen = false;
  for (const st of states) {
    const s = boxStatus(input, joins, st, cables);
    if (s.short && !shortSeen) {
      shortSeen = true;
      const d = new Dsu();
      for (const j of joins) for (let i = 1; i < j.length; i++) d.union(j[0]!, j[i]!);
      issues.push({ code: 'short', state: st, toEarth: d.find(`${SUPPLY}:L`) === d.find(`${SUPPLY}:PE`) });
    }
    for (const l of lamps) litBy.get(l.id)!.push(s.lit[l.id] === true);
  }
  if (!shortSeen)
    for (const l of lamps) {
      const lit = litBy.get(l.id)!;
      const expect = states.map((st) => st[l.switchId!]![l.key! - 1] === true);
      if (lit.every((v, i) => v === expect[i])) continue;
      if (lit.every((v) => !v)) issues.push({ code: 'lamp-never', cableId: l.id });
      else if (lit.every((v) => v)) issues.push({ code: 'lamp-always', cableId: l.id });
      else {
        const by = input.switches
          .flatMap((s) => Array.from({ length: s.keys }, (_, k) => ({ switchId: s.id, key: k + 1 })))
          .find((o) => states.every((st, i) => (st[o.switchId]![o.key - 1] === true) === lit[i]));
        issues.push(
          by ? { code: 'lamp-wrong-key', cableId: l.id, ...by } : { code: 'lamp-wrong', cableId: l.id },
        );
      }
    }

  // with every key off: what each switch common and lamp earth are tied to
  const d = new Dsu();
  for (const j of joins) for (let i = 1; i < j.length; i++) d.union(j[0]!, j[i]!);
  for (const s of input.switches)
    if (d.find(`${switchCable(s)}:C`) === d.find(`${SUPPLY}:N`))
      issues.push({ code: 'neutral-switched', switchId: s.id });
  for (const l of lamps)
    if (d.find(`${l.id}:PE`) !== d.find(`${SUPPLY}:PE`)) issues.push({ code: 'no-earth', cableId: l.id });

  return { ok: issues.length === 0, issues };
}
