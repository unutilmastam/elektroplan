'use client';

import type Konva from 'konva';
import { useEffect, useRef, type RefObject } from 'react';
import type { Viewport } from '@/domain/geometry';

/**
 * Konva layer caching (PHASE 13 performance): the plan (rooms, walls, labels, up to hundreds of points with
 * glow) is rendered once into a bitmap covering the visible area plus up to half a screen around it. Panning then
 * only moves that bitmap instead of redrawing every vector. Leaving the cached area (or zooming out of it)
 * rebuilds it around the new view at once; an edit drops it (exact vector drawing while dragging) and it is
 * rebuilt when the plan is still for IDLE_MS; zooming in shows the bitmap scaled until it is rebuilt sharp.
 */
const IDLE_MS = 140;
/** largest bitmap we build (device pixels): stays inside iPad / iPhone canvas memory limits */
const MAX_PIXELS = 16_000_000;

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export function usePlanCache(
  group: RefObject<Konva.Group | null>,
  viewport: Viewport,
  size: { width: number; height: number },
  /** anything that changes what the plan looks like (project, decoration size, fonts, status mode) */
  contentKey: unknown,
  enabled = true,
) {
  const cached = useRef<Region | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContent = useRef<unknown>(undefined);

  useEffect(() => {
    const g = group.current;
    if (!g || size.width === 0 || size.height === 0) return;
    const drop = () => {
      if (cached.current) {
        g.clearCache();
        cached.current = null;
      }
    };
    const s = viewport.scale;
    const view = { x: -viewport.x / s, y: -viewport.y / s, w: size.width / s, h: size.height / s };
    const c = cached.current;
    const contentChanged = lastContent.current !== contentKey;
    lastContent.current = contentKey;
    const inside =
      c !== null &&
      view.x >= c.x &&
      view.y >= c.y &&
      view.x + view.w <= c.x + c.w &&
      view.y + view.h <= c.y + c.h &&
      s >= c.scale * 0.999; // zooming out would show the bitmap's edges
    if (!enabled) {
      drop();
      return;
    }
    const build = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      // margin around the view: half a screen, less on very large / dense screens to stay within MAX_PIXELS
      const screenPx = size.width * size.height * ratio * ratio;
      const m = Math.min(0.5, (Math.sqrt(MAX_PIXELS / screenPx) - 1) / 2);
      if (m < 0.1) return drop(); // a screen this large stays vector
      const region = {
        x: view.x - view.w * m,
        y: view.y - view.h * m,
        w: view.w * (1 + 2 * m),
        h: view.h * (1 + 2 * m),
        scale: s,
      };
      const pixelRatio = s * ratio;
      try {
        g.clearCache();
        g.cache({ x: region.x, y: region.y, width: region.w, height: region.h, pixelRatio });
        cached.current = region;
        g.getLayer()?.batchDraw();
      } catch {
        cached.current = null; // e.g. canvas allocation refused: vector drawing still works
      }
    };
    if (timer.current) clearTimeout(timer.current);
    if (contentChanged) {
      // editing (dragging a point…): exact drawing now, bitmap once the plan is still
      drop();
      timer.current = setTimeout(build, IDLE_MS);
    } else if (!inside) {
      // panned / zoomed out past the bitmap: rebuild right away around the new view
      build();
    } else if (c && c.scale !== s) {
      // zoomed in: the scaled bitmap is shown meanwhile; rebuild sharp when the zoom stops
      timer.current = setTimeout(build, IDLE_MS);
    }
  }, [group, viewport, size.width, size.height, contentKey, enabled]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
}
