'use client';

import { useRef, useState, type MutableRefObject, type PointerEvent } from 'react';
import { uz } from '@/i18n/uz';

const R = 52; // pad radius (px)

/** PHASE 25 — the on-screen stick for walking with a thumb: push up to go forward, sideways to step aside. */
export function WalkStick({ stick }: { stick: MutableRefObject<{ x: number; y: number }> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const centre = useRef<{ x: number; y: number } | null>(null);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const c = centre.current;
    if (!c) return;
    let dx = e.clientX - c.x;
    let dy = e.clientY - c.y;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    // a small dead zone so a resting thumb does not creep
    const k = d < 8 ? 0 : 1;
    stick.current = { x: (dx / R) * k, y: (-dy / R) * k };
  };
  const end = () => {
    centre.current = null;
    setKnob({ x: 0, y: 0 });
    stick.current = { x: 0, y: 0 };
  };
  return (
    <div
      role="group"
      aria-label={uz.room3d.stick}
      data-testid="room3d-stick"
      className="absolute bottom-12 left-4 z-10 flex touch-none items-center justify-center rounded-full border border-white/20 bg-black/35 backdrop-blur-sm select-none"
      style={{ width: R * 2 + 24, height: R * 2 + 24 }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        centre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span className="pointer-events-none absolute top-1.5 text-[11px] text-white/50">▲</span>
      <span
        className="pointer-events-none h-14 w-14 rounded-full border border-white/40 bg-white/25 shadow-lg"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
