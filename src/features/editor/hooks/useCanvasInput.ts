'use client';

import { useEffect, type RefObject } from 'react';
import { captureMoveOrigin, isEmptyMove, moveRecipe, type MoveOrigin } from '@/domain/editing';
import { panBy, type Vec2 } from '@/domain/geometry';
import { entitiesInRect, hasRef, hitTest, liveSelection } from '@/domain/selection';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';
import { PICK_PX, pointRadiusWorld } from '../canvas/decoration';
import { GestureRouter, type RawPointer } from '../input/GestureRouter';
import {
  createMarqueeTool,
  createPanTool,
  createSelectTool,
  type PointerKind,
  type Tool,
  type ToolContext,
} from '../tools';

let dragCounter = 0;

/** Tool context backed by the stores (always reads the latest state — no stale closures). */
function createContext(): ToolContext {
  const proj = () => selectCurrentProject(useProjectStore.getState());
  const ed = () => useEditorStore.getState();
  let origin: MoveOrigin | null = null;
  let dragKey = '';
  return {
    hit: (p) => {
      const project = proj();
      const vp = ed().viewport;
      if (!project || !vp) return null;
      return hitTest(project, p.world, {
        tolerance: PICK_PX[p.pointerType] / vp.scale,
        pointRadius: pointRadiusWorld(vp.scale),
      });
    },
    selection: () => {
      const project = proj();
      return project ? liveSelection(project, ed().selection) : [];
    },
    select: (sel) => {
      const project = proj();
      if (project) ed().select(project, sel);
    },
    entitiesIn: (r) => {
      const project = proj();
      return project ? entitiesInRect(project, r) : [];
    },
    setMarquee: (r) => ed().setMarquee(r),
    beginMove: () => {
      const project = proj();
      if (!project) return false;
      origin = captureMoveOrigin(project, liveSelection(project, ed().selection));
      if (isEmptyMove(origin)) {
        origin = null;
        return false;
      }
      dragKey = `move-${++dragCounter}`;
      return true;
    },
    moveTo: (delta) => {
      const project = proj();
      if (!origin || !project) return;
      const grid = project.settings.snapToGrid ? project.settings.gridSize : 0;
      useProjectStore
        .getState()
        .apply('Siljitish', moveRecipe(origin, delta, grid, new Date().toISOString()), dragKey);
    },
    endMove: () => {
      origin = null;
      useProjectStore.getState().seal();
    },
    panBy: (dx, dy) => {
      const vp = ed().viewport;
      if (vp) ed().setViewport(panBy(vp, dx, dy));
    },
  };
}

/** Pointer Events → GestureRouter → tools. Moves are batched per animation frame (smooth on 120 Hz iPads). */
export function useCanvasInput(hostRef: RefObject<HTMLElement | null>, spaceHeld: () => boolean) {
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ctx = createContext();
    const tools: Record<string, Tool> = {
      select: createSelectTool(ctx),
      marquee: createMarqueeTool(ctx),
      pan: createPanTool(ctx),
      finger: createSelectTool(ctx, { allowMove: false }),
    };
    const toolFor = (kind: PointerKind): Tool => {
      if (kind === 'touch' && useSettingsStore.getState().penOnly) return tools.finger!;
      return tools[useEditorStore.getState().tool]!;
    };
    const openMenuAt = (screen: Vec2, world: Vec2, kind: PointerKind) => {
      const project = selectCurrentProject(useProjectStore.getState());
      const ed = useEditorStore.getState();
      if (!project || !ed.viewport) return;
      const hit = hitTest(project, world, {
        tolerance: PICK_PX[kind] / ed.viewport.scale,
        pointRadius: pointRadiusWorld(ed.viewport.scale),
      });
      if (hit && !hasRef(ed.selection, hit)) ed.select(project, [hit]);
      if (!hit && ed.selection.length === 0) return;
      ed.openContextMenu(screen);
    };
    const router = new GestureRouter({
      getViewport: () => useEditorStore.getState().viewport ?? { x: 0, y: 0, scale: 1 },
      setViewport: (v) => useEditorStore.getState().setViewport(v),
      toolFor,
      spaceHeld,
      onLongPress: openMenuAt,
      setTimer: (fn, ms) => window.setTimeout(fn, ms),
      clearTimer: (h) => window.clearTimeout(h as number),
    });

    const raw = (e: PointerEvent): RawPointer => {
      const r = el.getBoundingClientRect();
      return {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        button: e.button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      };
    };
    const queued = new Map<number, RawPointer>();
    let frame = 0;
    const flushMoves = () => {
      frame = 0;
      for (const ev of queued.values()) router.move(ev);
      queued.clear();
    };
    const flushNow = () => {
      if (frame) cancelAnimationFrame(frame);
      flushMoves();
    };

    const onDown = (e: PointerEvent) => {
      if (useEditorStore.getState().contextMenu) useEditorStore.getState().openContextMenu(null);
      if (router.down(raw(e))) {
        el.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      }
    };
    const onMove = (e: PointerEvent) => {
      queued.set(e.pointerId, raw(e));
      if (!frame) frame = requestAnimationFrame(flushMoves);
    };
    const onUp = (e: PointerEvent) => {
      flushNow();
      router.up(raw(e), e.type === 'pointercancel');
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      router.wheel({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        ctrlKey: e.ctrlKey,
      });
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const screen = { x: e.clientX - r.left, y: e.clientY - r.top };
      const vp = useEditorStore.getState().viewport;
      if (vp)
        openMenuAt(screen, { x: (screen.x - vp.x) / vp.scale, y: (screen.y - vp.y) / vp.scale }, 'mouse');
    };
    const stopGesture = (e: Event) => e.preventDefault(); // Safari page pinch
    const onBlur = () => router.reset();

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContext);
    el.addEventListener('gesturestart', stopGesture);
    window.addEventListener('blur', onBlur);
    const unsubTool = useEditorStore.subscribe((s, prev) => s.tool !== prev.tool && router.reset());
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContext);
      el.removeEventListener('gesturestart', stopGesture);
      window.removeEventListener('blur', onBlur);
      unsubTool();
    };
  }, [hostRef, spaceHeld]);
}
