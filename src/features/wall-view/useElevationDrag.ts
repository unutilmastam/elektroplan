'use client';

import { useRef, useState } from 'react';
import { fromX, fromY, snapCm, type ElevationLayout } from '@/domain/elevation';
import type { Selection } from '@/domain/selection';
import { sealEdit, updatePoint } from '@/features/editor/actions';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';

let dragCounter = 0;

/**
 * Dragging a symbol in the wall view: horizontal = distance from the left corner, vertical = height (5 cm steps).
 * The layout is frozen while dragging so the scale does not jump. A press without movement selects the point.
 */
export function useElevationDrag(layout: ElevationLayout, host: React.RefObject<HTMLDivElement | null>) {
  const [frozen, setFrozen] = useState<ElevationLayout | null>(null);
  const drag = useRef<{
    id: string;
    key: string;
    startX: number;
    startY: number;
    moved: boolean;
    l: ElevationLayout;
  } | null>(null);

  const select = (sel: Selection) => {
    const p = selectCurrentProject(useProjectStore.getState());
    if (p) useEditorStore.getState().select(p, sel);
  };

  const onPointerDown = (pointId: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = {
      id: pointId,
      key: `elev-${pointId}-${++dragCounter}`,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      l: layout,
    };
    setFrozen(layout);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !host.current) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
    d.moved = true;
    const r = host.current.getBoundingClientRect();
    const dist = snapCm(fromX(d.l, e.clientX - r.left));
    const h = snapCm(fromY(d.l, e.clientY - r.top));
    updatePoint(d.id, { distanceFromCornerCm: dist, mountHeightCm: h }, d.key);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setFrozen(null);
    if (!d) return;
    if (d.moved) sealEdit();
    select([{ kind: 'point', id: d.id }]);
  };

  return { layout: frozen ?? layout, onPointerDown, onPointerMove, onPointerUp, dragging: frozen !== null };
}
