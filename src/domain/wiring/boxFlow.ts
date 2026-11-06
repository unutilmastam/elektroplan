import { boxStatus, type Joins, type KeyState } from './boxCheck';
import { SUPPLY, boxCables, switchCable, type BoxInput, type Cable } from './junctionBox';

/**
 * PHASE 22 — which conductors carry current right now, and which way, for the animated view.
 * Phase current runs from the panel through the switch to the lamp; the neutral brings it back.
 * `inward` = the current flows into the box along this conductor.
 */
export interface CoreCurrent {
  kind: 'L' | 'N';
  inward: boolean;
  /** how many lamps this conductor feeds (particle speed) */
  load: number;
}

class Dsu {
  private p = new Map<string, string>();
  find(a: string): string {
    const r = this.p.get(a);
    if (r === undefined || r === a) return a;
    const root = this.find(r);
    this.p.set(a, root);
    return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

export function boxCurrents(
  input: BoxInput,
  joins: Joins,
  keys: KeyState,
  cables: Cable[] = boxCables(input),
): Map<string, CoreCurrent> {
  const out = new Map<string, CoreCurrent>();
  const st = boxStatus(input, joins, keys, cables);
  if (st.short) return out;
  const d = new Dsu(); // clamps only: the box side of every conductor
  for (const j of joins) for (let i = 1; i < j.length; i++) d.union(j[0]!, j[i]!);
  const L = d.find(`${SUPPLY}:L`);
  const N = d.find(`${SUPPLY}:N`);
  const add = (id: string, kind: 'L' | 'N', inward: boolean) => {
    const cur = out.get(id);
    out.set(id, { kind, inward, load: (cur?.load ?? 0) + 1 });
  };
  const lit = cables.filter((c) => c.kind === 'lamp' && st.lit[c.id]);
  for (const lamp of lit) {
    add(`${SUPPLY}:L`, 'L', true);
    add(`${SUPPLY}:N`, 'N', false);
    for (const role of ['L', 'N'] as const) {
      const id = `${lamp.id}:${role}`;
      const net = d.find(id);
      const onPhaseSide = net !== N; // fed through the phase (directly or via a switch)
      add(id, onPhaseSide ? 'L' : 'N', !onPhaseSide);
      // the switch that closes this lamp's circuit
      for (const s of input.switches) {
        const sc = switchCable(s);
        for (let k = 1; k <= s.keys; k++) {
          if (!keys[s.id]?.[k - 1] || d.find(`${sc}:K${k}`) !== net) continue;
          const common = d.find(`${sc}:C`);
          if (common === L) {
            add(`${sc}:C`, 'L', false);
            add(`${sc}:K${k}`, 'L', true);
          } else if (common === N) {
            add(`${sc}:K${k}`, 'N', false);
            add(`${sc}:C`, 'N', true);
          }
        }
      }
    }
  }
  return out;
}
