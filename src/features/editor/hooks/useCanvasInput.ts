'use client';

import { useEffect, type RefObject } from 'react';
import type { Vec2 } from '@/domain/geometry';
import { hasRef, hitTest } from '@/domain/selection';
import { useEditorStore, type ToolId } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';
import { PICK_PX, pointRadiusWorld } from '../canvas/decoration';
import { GestureRouter, type RawPointer } from '../input/GestureRouter';
import { createToolContext } from '../input/toolContext';
import {
  createMarqueeTool,
  createOpeningTool,
  createPanTool,
  createPlaceSymbolTool,
  createPolygonRoomTool,
  createRectRoomTool,
  createSelectTool,
  createSketchTool,
  createWallTool,
  setActiveTool,
  type PointerKind,
  type Tool,
} from '../tools';

/** Pointer Events → GestureRouter → tools. Moves are batched per animation frame (smooth on 120 Hz iPads). */
/** `readOnly` (Montaj rejimi): tap selects, drag pans, pinch zooms — nothing can be moved or drawn. */
export function useCanvasInput(
  hostRef: RefObject<HTMLElement | null>,
  spaceHeld: () => boolean,
  readOnly = false,
) {
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ctx = createToolContext();
    const tools: Record<ToolId | 'finger', Tool> = {
      select: createSelectTool(ctx),
      marquee: createMarqueeTool(ctx),
      pan: createPanTool(ctx),
      place: createPlaceSymbolTool(ctx),
      'room-rect': createRectRoomTool(ctx, false),
      'room-square': createRectRoomTool(ctx, true),
      'room-polygon': createPolygonRoomTool(ctx),
      sketch: createSketchTool(ctx),
      wall: createWallTool(ctx),
      door: createOpeningTool(ctx, 'door'),
      window: createOpeningTool(ctx, 'window'),
      finger: createSelectTool(ctx, { allowMove: false }),
    };
    const toolFor = (kind: PointerKind): Tool => {
      // "Faqat Pencil": a finger only selects and pans
      const t =
        readOnly || (kind === 'touch' && useSettingsStore.getState().penOnly)
          ? tools.finger
          : tools[useEditorStore.getState().tool];
      setActiveTool(t);
      return t;
    };
    setActiveTool(readOnly ? tools.finger : tools[useEditorStore.getState().tool]);
    const openMenuAt = (screen: Vec2, world: Vec2, kind: PointerKind) => {
      if (readOnly) return;
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
      onHover: (p) => tools[useEditorStore.getState().tool].onHover?.(p),
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
    // Moves are handled once per animation frame, but EVERY sample of the frame is replayed (incl. the
    // browser's coalesced ones: Apple Pencil reports up to 240 Hz), so fast freehand strokes keep their shape.
    const MAX_SAMPLES = 64;
    const queued = new Map<number, RawPointer[]>();
    let frame = 0;
    const flushMoves = () => {
      frame = 0;
      for (const evs of queued.values()) for (const ev of evs) router.move(ev);
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
      const list = queued.get(e.pointerId) ?? [];
      const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const c of coalesced.length ? coalesced : [e]) list.push(raw(c));
      if (list.length > MAX_SAMPLES) list.splice(0, list.length - MAX_SAMPLES);
      queued.set(e.pointerId, list);
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
    const unsubTool = useEditorStore.subscribe((s, prev) => {
      if (s.tool === prev.tool) return;
      router.reset();
      setActiveTool(tools[s.tool]);
    });
    const onLeave = () => useEditorStore.getState().setHover(null);
    el.addEventListener('pointerleave', onLeave);
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
      el.removeEventListener('pointerleave', onLeave);
      setActiveTool(null);
    };
  }, [hostRef, spaceHeld, readOnly]);
}
