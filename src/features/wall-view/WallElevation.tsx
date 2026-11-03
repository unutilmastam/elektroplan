'use client';

import { useRef } from 'react';
import { elevationLayout, snapCm, toX, toY } from '@/domain/elevation';
import type { WallElevation as Elevation } from '@/domain/selectors';
import { sealEdit, updatePoint } from '@/features/editor/actions';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useElementSize } from '@/lib/useElementSize';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { ElevationDefs, ElevationDimensions } from './ElevationDimensions';
import { useElevationDrag } from './useElevationDrag';

/** Wall view: wall face, points at (distance from left corner, height), sm dimensions; select + drag to edit. */
export function WallElevationDrawing({
  elevation,
  large = false,
}: {
  elevation: Elevation;
  large?: boolean;
}) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const host = useRef<HTMLDivElement>(null);
  const selectedId = useEditorStore((s) => s.selectedPointId);
  const live = elevationLayout(elevation, width, height);
  const { layout: l, onPointerDown, onPointerMove, onPointerUp, dragging } = useElevationDrag(live, host);
  const badge = large ? Math.min(40, l.badge * 1.5) : l.badge;
  const tvW = Math.min(large ? 200 : 130, (l.x1 - l.x0) * 0.24);
  const tvH = Math.min(tvW * 0.6, (l.y1 - l.y0) * 0.5);
  const selected = elevation.points.find((p) => p.point.id === selectedId) ?? null;

  const selectWall = () => {
    const p = selectCurrentProject(useProjectStore.getState());
    if (p) useEditorStore.getState().select(p, [{ kind: 'wall', id: elevation.wall.id }]);
  };

  const onKey = (id: string, dist: number, h: number) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    updatePoint(
      id,
      {
        distanceFromCornerCm: Math.max(0, Math.min(elevation.length, snapCm(dist + m[0]))),
        mountHeightCm: Math.max(0, snapCm(h + m[1])),
      },
      `kbd-${id}`,
    );
  };

  return (
    <div ref={ref} className="relative h-full w-full">
      <div
        ref={host}
        className="canvas-host absolute inset-0"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget || (e.target as Element).tagName !== 'BUTTON') selectWall();
        }}
        data-testid="wall-elevation"
        data-x0={l.x0}
        data-x1={l.x1}
        data-length={l.length}
      >
        {width > 0 ? (
          <svg width={width} height={height} className="absolute inset-0" aria-hidden>
            <ElevationDefs />
            <rect x={l.x0} y={l.y0} width={l.x1 - l.x0} height={l.y1 - l.y0} fill="url(#wall-face)" />
            <rect x={l.x0} y={l.y0} width={l.x1 - l.x0} height={l.y1 - l.y0} fill="url(#wall-light)" />
            <rect x={l.x0} y={l.y1 - 6} width={l.x1 - l.x0} height={6} fill="#9aa2ae" />
            <line x1={l.x0} y1={l.y1} x2={l.x1} y2={l.y1} stroke="#3b8bff" strokeWidth={1.5} />
            <ElevationDimensions elevation={elevation} layout={l} selected={selected} />
            {elevation.points.map(({ point, distance, height: h }) =>
              point.symbolId === 'tv' ? (
                <g key={point.id}>
                  <rect
                    x={toX(l, distance) - tvW / 2 - 3}
                    y={toY(l, h) - tvH / 2 - 3}
                    width={tvW + 6}
                    height={tvH + 6}
                    rx={3}
                    fill="#2b2f38"
                    stroke={point.id === selectedId ? '#3b8bff' : 'none'}
                    strokeWidth={2}
                  />
                  <rect
                    x={toX(l, distance) - tvW / 2}
                    y={toY(l, h) - tvH / 2}
                    width={tvW}
                    height={tvH}
                    rx={1.5}
                    fill="url(#tv-screen)"
                  />
                </g>
              ) : (
                <line
                  key={point.id}
                  x1={toX(l, distance)}
                  y1={toY(l, h) + badge / 2}
                  x2={toX(l, distance)}
                  y2={l.y1}
                  stroke="#3b8bff"
                  strokeOpacity={0.7}
                  strokeWidth={1.2}
                />
              ),
            )}
          </svg>
        ) : null}
        {width > 0
          ? elevation.points.map(({ point, distance, height: h }) => {
              const isTv = point.symbolId === 'tv';
              const w = isTv ? tvW : badge;
              const hh = isTv ? tvH : badge;
              const active = point.id === selectedId;
              return (
                <button
                  key={point.id}
                  type="button"
                  data-point-id={point.id}
                  aria-label={`${uz.symbols[point.symbolId]}: ${uz.wallView.pointLabel.replace('{h}', String(Math.round(h))).replace('{d}', String(Math.round(distance)))}`}
                  aria-pressed={active}
                  title={uz.wallView.dragHint}
                  onPointerDown={onPointerDown(point.id)}
                  onKeyDown={onKey(point.id, distance, h)}
                  onKeyUp={sealEdit}
                  className={cn(
                    'absolute flex items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white',
                    dragging ? 'cursor-grabbing' : 'cursor-grab',
                  )}
                  style={{
                    left: toX(l, distance) - w / 2,
                    top: toY(l, h) - hh / 2,
                    width: w,
                    height: hh,
                    touchAction: 'none',
                  }}
                >
                  {isTv ? null : (
                    <span
                      className={cn(
                        'rounded-md',
                        active && 'ring-2 ring-white ring-offset-2 ring-offset-[#c9ced6]',
                      )}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
                    >
                      <SymbolIcon id={point.symbolId} size={badge} color={point.color} />
                    </span>
                  )}
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}
