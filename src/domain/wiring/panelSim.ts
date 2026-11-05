import { lineCurrent, type PanelDesign, type PanelInput, type Phase } from './panel';

/**
 * PHASE 21 — what happens in the board when you switch things and when something goes wrong.
 * Each `step` is one moment: devices that would trip do, and the reasons come back as events.
 */

export type Fault = 'none' | 'overload' | 'short' | 'leak';

export interface PanelState {
  main: boolean;
  /** RCD id → closed */
  rcd: Record<string, boolean>;
  /** line id → its breaker / RCBO closed */
  breaker: Record<string, boolean>;
  /** line id → consumers switched on */
  load: Record<string, boolean>;
  fault: Record<string, Fault>;
}

export type PanelEvent =
  | { kind: 'main-overload'; phase: Phase; currentA: number; ratingA: number }
  | { kind: 'mcb-overload'; lineId: string; currentA: number; ratingA: number }
  | { kind: 'mcb-short'; lineId: string }
  | { kind: 'rcd-leak'; deviceId: string; lineId: string }
  | { kind: 'rcd-test'; deviceId: string }
  | { kind: 'leak-unprotected'; lineId: string };

export interface PanelFlow {
  /** line id → current flowing now, A (0 = off / no supply) */
  current: Record<string, number>;
  /** line id → the line has voltage (its breaker and everything upstream is closed) */
  live: Record<string, boolean>;
  rcdLive: Record<string, boolean>;
  phaseA: Record<Phase, number>;
}

/** Thermal trip threshold (IEC 60898: 1.13 × In does not trip, 1.45 × In does — we trip above 1.13). */
const TRIP = 1.13;
/** An "overload" fault plugs in extra appliances: 1.6 × the circuit's breaker rating. */
const OVERLOAD = 1.6;

export function initialState(d: PanelDesign): PanelState {
  return {
    main: true,
    rcd: Object.fromEntries(d.rcds.map((r) => [r.id, true])),
    breaker: Object.fromEntries(d.lines.map((l) => [l.id, true])),
    load: Object.fromEntries(d.lines.map((l) => [l.id, false])),
    fault: Object.fromEntries(d.lines.map((l) => [l.id, 'none' as Fault])),
  };
}

export function flow(d: PanelDesign, input: PanelInput, s: PanelState): PanelFlow {
  const byId = new Map(input.lines.map((l) => [l.id, l]));
  const current: Record<string, number> = {};
  const live: Record<string, boolean> = {};
  const rcdLive: Record<string, boolean> = {};
  const phaseA: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
  for (const r of d.rcds) rcdLive[r.id] = s.main && s.rcd[r.id] !== false;
  for (const l of d.lines) {
    const upstream = s.main && (l.rcdId === null || rcdLive[l.rcdId] === true);
    live[l.id] = upstream && s.breaker[l.id] !== false;
    const src = byId.get(l.id);
    let a = 0;
    if (live[l.id] && src && s.load[l.id]) {
      a = lineCurrent(src);
      if (s.fault[l.id] === 'overload') a = Math.max(a, l.breakerA * OVERLOAD);
    }
    current[l.id] = Math.round(a * 10) / 10;
    phaseA[l.phase] += a;
  }
  for (const p of Object.keys(phaseA) as Phase[]) phaseA[p] = Math.round(phaseA[p] * 10) / 10;
  return { current, live, rcdLive, phaseA };
}

/** Applies the protections once: returns the state after trips and why they tripped. */
export function step(
  d: PanelDesign,
  input: PanelInput,
  s: PanelState,
): { state: PanelState; events: PanelEvent[] } {
  const next: PanelState = {
    main: s.main,
    rcd: { ...s.rcd },
    breaker: { ...s.breaker },
    load: { ...s.load },
    fault: { ...s.fault },
  };
  const events: PanelEvent[] = [];
  const f = flow(d, input, s);
  for (const l of d.lines) {
    if (!f.live[l.id]) continue;
    const fault = s.fault[l.id];
    if (fault === 'short') {
      // magnetic release: instant
      next.breaker[l.id] = false;
      events.push({ kind: 'mcb-short', lineId: l.id });
      continue;
    }
    if (fault === 'leak') {
      if (l.protection === 'rcbo') {
        next.breaker[l.id] = false;
        events.push({ kind: 'rcd-leak', deviceId: l.id, lineId: l.id });
      } else if (l.rcdId) {
        next.rcd[l.rcdId] = false;
        events.push({ kind: 'rcd-leak', deviceId: l.rcdId, lineId: l.id });
      } else events.push({ kind: 'leak-unprotected', lineId: l.id });
      continue;
    }
    if (f.current[l.id]! > l.breakerA * TRIP) {
      next.breaker[l.id] = false;
      events.push({ kind: 'mcb-overload', lineId: l.id, currentA: f.current[l.id]!, ratingA: l.breakerA });
    }
  }
  if (!events.some((e) => e.kind === 'mcb-short' || e.kind === 'mcb-overload' || e.kind === 'rcd-leak')) {
    // only if nothing downstream reacted first (selectivity)
    for (const p of ['L1', 'L2', 'L3'] as Phase[]) {
      if (s.main && f.phaseA[p] > d.main.ratingA * TRIP) {
        next.main = false;
        events.push({ kind: 'main-overload', phase: p, currentA: f.phaseA[p], ratingA: d.main.ratingA });
        break;
      }
    }
  }
  return { state: next, events };
}

/** The RCD "T" button: a built-in test leak trips it. */
export function testRcd(
  s: PanelState,
  deviceId: string,
  d: PanelDesign,
): { state: PanelState; events: PanelEvent[] } {
  const isRcbo = d.lines.some((l) => l.id === deviceId && l.protection === 'rcbo');
  const on = isRcbo ? s.breaker[deviceId] : s.rcd[deviceId];
  if (!s.main || on === false) return { state: s, events: [] };
  const state = isRcbo
    ? { ...s, breaker: { ...s.breaker, [deviceId]: false } }
    : { ...s, rcd: { ...s.rcd, [deviceId]: false } };
  return { state, events: [{ kind: 'rcd-test', deviceId }] };
}

/** Everything on, no faults: the realistic peak the main breaker sees (simultaneity ignored). */
export const allOn = (d: PanelDesign, s: PanelState): PanelState => ({
  ...s,
  load: Object.fromEntries(d.lines.map((l) => [l.id, true])),
});
