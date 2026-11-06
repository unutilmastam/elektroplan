'use client';

import { useRef, type PointerEvent, type WheelEvent } from 'react';

export interface Look {
  yaw: number;
  pitch: number;
  /** inside: field of view (deg); top: distance multiplier */
  zoom: number;
}

/**
 * Finger / mouse control of the 3D camera: one finger drags the view, two fingers (or the wheel) zoom,
 * a short tap reports where it landed (for picking).
 */
export function useLook(
  get: () => Look,
  set: (l: Look) => void,
  onTap: (x: number, y: number) => void,
  zoomRange: [number, number],
) {
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ x: number; y: number; moved: boolean; pinch: number | null; zoom: number } | null>(
    null,
  );
  const clampZoom = (z: number) => Math.min(zoomRange[1], Math.max(zoomRange[0], z));
  const spread = () => {
    const [a, b] = [...pts.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : null;
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      start.current = {
        x: e.clientX,
        y: e.clientY,
        moved: pts.current.size > 1,
        pinch: spread(),
        zoom: get().zoom,
      };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const prev = pts.current.get(e.pointerId);
      if (!prev || !start.current) return;
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.current.size >= 2) {
        const s = spread();
        if (s && start.current.pinch)
          set({ ...get(), zoom: clampZoom(start.current.zoom * (start.current.pinch / s)) });
        start.current.moved = true;
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6)
        start.current.moved = true;
      const l = get();
      set({ ...l, yaw: l.yaw + dx * 0.28, pitch: Math.max(-80, Math.min(80, l.pitch + dy * 0.22)) });
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      pts.current.delete(e.pointerId);
      if (pts.current.size === 0) {
        if (s && !s.moved) {
          const r = e.currentTarget.getBoundingClientRect();
          onTap(e.clientX - r.left, e.clientY - r.top);
        }
        start.current = null;
      }
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      pts.current.delete(e.pointerId);
      start.current = null;
    },
    onWheel: (e: WheelEvent<HTMLElement>) => {
      const l = get();
      set({ ...l, zoom: clampZoom(l.zoom * Math.exp(e.deltaY * 0.001)) });
    },
  };
}
