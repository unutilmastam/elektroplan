import type { WireRole } from './catalog';

/**
 * PHASE 21 — junction box ("tarqatish qutisi"): the supply cable, the switch drops and the lamp cables meet
 * here and are joined with lever clamps (Wago 221). `designBox` gives the correct joins, `checkBox` tests
 * any joins by switching every key combination (like an electrician testing before closing the lid). Pure.
 */

export interface BoxSwitch {
  id: string;
  keys: 1 | 2 | 3;
  /** lamp fittings per key, e.g. [2, 1] = key 1 → 2 lamps, key 2 → 1 lamp */
  lamps: number[];
}

export interface BoxInput {
  switches: BoxSwitch[];
}

export type CoreRole = 'L' | 'N' | 'PE' | 'C' | 'K1' | 'K2' | 'K3';

export interface Core {
  /** `${cableId}:${role}` */
  id: string;
  cableId: string;
  role: CoreRole;
  color: WireRole;
}

export interface Cable {
  id: string;
  kind: 'supply' | 'switch' | 'lamp';
  /** switch id (switch / lamp cables) */
  switchId: string | null;
  /** 1-based key (lamp cables) */
  key: number | null;
  /** 1-based lamp number on that key (lamp cables) */
  lamp: number | null;
  cores: Core[];
}

export interface BoxGroup {
  id: string;
  /** what this join carries */
  kind: 'L' | 'N' | 'PE' | 'key';
  switchId: string | null;
  key: number | null;
  ends: string[];
  /** clamp sizes used (e.g. [3] or [5, 3] linked by a short jumper) */
  clamps: number[];
}

export interface BoxDesign {
  cables: Cable[];
  groups: BoxGroup[];
  clampCount: Record<2 | 3 | 5, number>;
}

const core = (cableId: string, role: CoreRole, color: WireRole): Core => ({
  id: `${cableId}:${role}`,
  cableId,
  role,
  color,
});
const KEY_COLOR: Record<number, WireRole> = { 1: 'S1', 2: 'S2', 3: 'S3' };

export const SUPPLY = 'in';
export const switchCable = (s: BoxSwitch) => `sw-${s.id}`;
export const lampCable = (s: BoxSwitch, key: number, n: number) => `lamp-${s.id}-${key}-${n}`;

export function boxCables(input: BoxInput): Cable[] {
  const cables: Cable[] = [
    {
      id: SUPPLY,
      kind: 'supply',
      switchId: null,
      key: null,
      lamp: null,
      cores: [core(SUPPLY, 'L', 'L'), core(SUPPLY, 'N', 'N'), core(SUPPLY, 'PE', 'PE')],
    },
  ];
  for (const s of input.switches) {
    const id = switchCable(s);
    const keys = Array.from({ length: s.keys }, (_, i) =>
      core(id, `K${i + 1}` as CoreRole, KEY_COLOR[i + 1]!),
    );
    cables.push({
      id,
      kind: 'switch',
      switchId: s.id,
      key: null,
      lamp: null,
      cores: [core(id, 'C', 'L'), ...keys],
    });
    for (let k = 1; k <= s.keys; k++)
      for (let n = 1; n <= Math.max(1, s.lamps[k - 1] ?? 1); n++) {
        const lid = lampCable(s, k, n);
        cables.push({
          id: lid,
          kind: 'lamp',
          switchId: s.id,
          key: k,
          lamp: n,
          cores: [core(lid, 'L', 'L'), core(lid, 'N', 'N'), core(lid, 'PE', 'PE')],
        });
      }
  }
  return cables;
}

/**
 * Lever clamps for `n` conductors: one clamp up to 5; above that a chain of 5-way clamps joined by short
 * jumpers (ends lose one or two ways to the jumper).
 */
export function clampsFor(n: number): number[] {
  if (n <= 2) return [2];
  if (n <= 3) return [3];
  if (n <= 5) return [5];
  let k = 2;
  while (3 * k + 2 < n) k++;
  return Array.from({ length: k }, () => 5);
}

export function designBox(input: BoxInput): BoxDesign {
  const cables = boxCables(input);
  const lamps = cables.filter((c) => c.kind === 'lamp');
  const end = (cableId: string, role: CoreRole) => `${cableId}:${role}`;
  const groups: BoxGroup[] = [];
  const add = (g: Omit<BoxGroup, 'clamps'>) => groups.push({ ...g, clamps: clampsFor(g.ends.length) });
  // phase goes to every switch (the switch must break the phase, never the neutral)
  add({
    id: 'g-L',
    kind: 'L',
    switchId: null,
    key: null,
    ends: [end(SUPPLY, 'L'), ...input.switches.map((s) => end(switchCable(s), 'C'))],
  });
  // neutral and earth go straight to every lamp
  add({
    id: 'g-N',
    kind: 'N',
    switchId: null,
    key: null,
    ends: [end(SUPPLY, 'N'), ...lamps.map((l) => end(l.id, 'N'))],
  });
  add({
    id: 'g-PE',
    kind: 'PE',
    switchId: null,
    key: null,
    ends: [end(SUPPLY, 'PE'), ...lamps.map((l) => end(l.id, 'PE'))],
  });
  for (const s of input.switches)
    for (let k = 1; k <= s.keys; k++)
      add({
        id: `g-${s.id}-${k}`,
        kind: 'key',
        switchId: s.id,
        key: k,
        ends: [
          end(switchCable(s), `K${k}` as CoreRole),
          ...lamps.filter((l) => l.switchId === s.id && l.key === k).map((l) => end(l.id, 'L')),
        ],
      });
  const clampCount: Record<2 | 3 | 5, number> = { 2: 0, 3: 0, 5: 0 };
  for (const g of groups) for (const c of g.clamps) clampCount[c as 2 | 3 | 5]++;
  return { cables, groups, clampCount };
}
