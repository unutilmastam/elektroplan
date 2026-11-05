'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PanelDesign, PanelInput } from '@/domain/wiring/panel';
import {
  allOn,
  flow,
  initialState,
  step,
  testRcd,
  type Fault,
  type PanelEvent,
  type PanelState,
} from '@/domain/wiring/panelSim';

export interface LoggedEvent {
  id: number;
  event: PanelEvent;
}

/** Board simulation: state, protections reacting after every change, and the event log. */
export function usePanelSim(design: PanelDesign, input: PanelInput) {
  const shape = design.lines.map((l) => `${l.id}:${l.rcdId}:${l.protection}`).join('|') + design.rcds.length;
  const [state, setState] = useState<PanelState>(() => initialState(design));
  const [log, setLog] = useState<LoggedEvent[]>([]);
  const [flashes, setFlashes] = useState<Record<string, number>>({});
  // a different board: start over (new devices)
  useEffect(() => {
    setState(initialState(design));
    setLog([]);
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps

  const record = (events: PanelEvent[]) => {
    if (!events.length) return;
    setLog((l) =>
      [...events.map((event, i) => ({ id: Date.now() + i, event })).reverse(), ...l].slice(0, 30),
    );
    setFlashes((f) => {
      const next = { ...f };
      for (const e of events) {
        const key =
          e.kind === 'main-overload'
            ? 'main'
            : e.kind === 'rcd-leak' || e.kind === 'rcd-test'
              ? e.deviceId
              : 'lineId' in e
                ? e.lineId
                : null;
        if (key && e.kind !== 'leak-unprotected') next[key] = (next[key] ?? 0) + 1;
      }
      return next;
    });
  };

  /** Applies a change, then lets the protections react until nothing more trips. */
  const apply = (next: PanelState) => {
    let s = next;
    const all: PanelEvent[] = [];
    for (let i = 0; i < 4; i++) {
      const r = step(design, input, s);
      s = r.state;
      all.push(...r.events);
      if (!r.events.some((e) => e.kind !== 'leak-unprotected')) break;
    }
    setState(s);
    record(all);
  };

  const f = useMemo(() => flow(design, input, state), [design, input, state]);

  return {
    state,
    flow: f,
    log,
    flashes,
    toggle: (key: string) => {
      if (key === 'main') return apply({ ...state, main: !state.main });
      if (state.rcd[key] !== undefined)
        return apply({ ...state, rcd: { ...state.rcd, [key]: !state.rcd[key] } });
      apply({ ...state, breaker: { ...state.breaker, [key]: !state.breaker[key] } });
    },
    toggleLoad: (id: string) => apply({ ...state, load: { ...state.load, [id]: !state.load[id] } }),
    setFault: (id: string, fault: Fault) =>
      apply({
        ...state,
        fault: { ...state.fault, [id]: fault },
        load: { ...state.load, [id]: fault === 'none' ? state.load[id]! : true },
      }),
    test: (deviceId: string) => {
      const r = testRcd(state, deviceId, design);
      setState(r.state);
      record(r.events);
    },
    allOn: () => apply(allOn(design, state)),
    allOff: () => apply({ ...state, load: Object.fromEntries(design.lines.map((l) => [l.id, false])) }),
    reset: () => {
      setState(initialState(design));
      setLog([]);
    },
  };
}
