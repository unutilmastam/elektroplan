'use client';

import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useRef } from 'react';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { BOTTOM_MIN, useUiStore } from '@/store/uiStore';

/** PHASE 19: "Rejani kattalashtirish" — the plan takes the whole workspace (panels hidden), and back. */
export function ExpandPlanButton() {
  const expanded = useUiStore((s) => s.planExpanded);
  const set = useUiStore((s) => s.setPlanExpanded);
  const label = expanded ? uz.layout.restore : uz.layout.expand;
  return (
    <button
      type="button"
      onClick={() => set(!expanded)}
      aria-label={label}
      title={label}
      aria-pressed={expanded}
      data-testid="plan-expand"
      className={cn(
        'glass absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-[10px] text-text hover:text-white sm:top-2.5 lg:h-10 lg:w-10',
        // tablet: leave room for the point-panel button in the corner
        !expanded && 'sm:right-16 md:right-2.5',
        expanded && 'bg-primary/30 text-white',
      )}
    >
      {expanded ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
    </button>
  );
}

/**
 * PHASE 19 (≥1024 px): grip on the plan's bottom edge. Drag it down to fold the bottom panels
 * (rooms / wall view / status) away or up to make them taller; a tap folds / unfolds.
 */
export function BottomPanelsGrip({ defaultHeight }: { defaultHeight: number }) {
  const layout = useUiStore((s) => s.layout);
  const setHeight = useUiStore((s) => s.setBottomHeight);
  const toggle = useUiStore((s) => s.toggleBottom);
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);
  const folded = layout.bottomHeight === 0;
  const current = layout.bottomHeight === -1 ? defaultHeight : layout.bottomHeight;
  const label = folded ? uz.layout.showPanels : uz.layout.hidePanels;
  return (
    <button
      type="button"
      aria-label={label}
      title={`${label} — ${uz.layout.dragHint}`}
      aria-expanded={!folded}
      data-testid="panels-grip"
      className="glass absolute bottom-1.5 left-1/2 z-10 hidden h-9 w-24 -translate-x-1/2 cursor-row-resize touch-none items-center justify-center rounded-full text-text-muted hover:text-text md:flex"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { y: e.clientY, h: current, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dy = e.clientY - d.y;
        if (Math.abs(dy) > 4) d.moved = true;
        if (!d.moved) return;
        const max = Math.round(window.innerHeight * 0.6);
        const h = Math.min(max, Math.max(0, d.h - dy));
        // live while dragging; below the minimum it folds on release
        useUiStore.setState((s) => ({ layout: { ...s.layout, bottomHeight: Math.max(h, 1) } }));
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (!d.moved) return toggle();
        const max = Math.round(window.innerHeight * 0.6);
        const h = Math.min(max, Math.max(0, d.h - (e.clientY - d.y)));
        setHeight(h < BOTTOM_MIN ? 0 : h);
      }}
      onPointerCancel={() => {
        if (drag.current) setHeight(drag.current.h);
        drag.current = null;
      }}
    >
      {folded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
    </button>
  );
}
