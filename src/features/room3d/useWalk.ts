'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { walk, type Obstacle } from '@/domain/house3d';
import type { Vec2 } from '@/domain/types';
import { stepFor } from './camera';
import type { Look } from './useLook';

/** Walking speed (cm/s) — an easy indoor pace; Shift walks faster. */
export const WALK_SPEED = 140;
const TURN_SPEED = 95; // deg/s for the ←/→ keys

const KEYS = {
  fwd: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA'],
  right: ['KeyD'],
  turnL: ['ArrowLeft', 'KeyQ'],
  turnR: ['ArrowRight', 'KeyE'],
};
const ALL = new Set(Object.values(KEYS).flat());

/**
 * PHASE 25 — walking through the home: W/S/↑/↓ forward and back, A/D sideways, ←/→ (Q/E) turn, Shift
 * faster; on touch the on-screen stick (`stick`, x right / y forward, −1…1). Walls stop you, doors let
 * you through. Calls `onMove` after every step so the view redraws.
 */
export function useWalk(o: {
  enabled: boolean;
  obstacles: Obstacle[];
  pos: MutableRefObject<Vec2>;
  look: () => Look;
  setLook: (l: Look) => void;
  onMove: () => void;
}) {
  const stick = useRef({ x: 0, y: 0 });
  const latest = useRef(o);
  latest.current = o;
  useEffect(() => {
    if (!o.enabled) return;
    const keys = new Set<string>();
    const typing = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (ALL.has(e.code) || e.code.startsWith('Shift')) keys.add(e.code);
      if (ALL.has(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => keys.clear();
    const has = (k: string[]) => k.some((c) => keys.has(c));
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      // real time even when frames are slow (a weak GPU), but no jump after the tab was hidden
      const dt = Math.min(0.2, (t - last) / 1000);
      last = t;
      const cur = latest.current;
      const turn = Number(has(KEYS.turnR)) - Number(has(KEYS.turnL));
      if (turn) {
        const l = cur.look();
        cur.setLook({ ...l, yaw: l.yaw - turn * TURN_SPEED * dt });
      }
      let fwd = stick.current.y + Number(has(KEYS.fwd)) - Number(has(KEYS.back));
      let side = stick.current.x + Number(has(KEYS.right)) - Number(has(KEYS.left));
      const m = Math.hypot(fwd, side);
      if (m > 1) {
        fwd /= m;
        side /= m;
      }
      if (m > 0.02) {
        const v = WALK_SPEED * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.9 : 1) * dt;
        cur.pos.current = walk(cur.pos.current, stepFor(cur.look(), fwd * v, side * v), cur.obstacles);
        cur.onMove();
      } else if (turn) cur.onMove();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [o.enabled]);
  return stick;
}
