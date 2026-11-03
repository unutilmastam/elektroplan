'use client';

import type { WallElevation as Elevation } from '@/domain/selectors';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { useElementSize } from '@/lib/useElementSize';

const M = { left: 26, right: 84, top: 8, bottom: 34 };

/** SVG elevation of one wall: wall face, points at (distance, height), sm dimensions and height ruler. */
export function WallElevationDrawing({ elevation }: { elevation: Elevation }) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const x0 = M.left;
  const x1 = Math.max(x0 + 40, width - M.right);
  const y0 = M.top;
  const y1 = Math.max(y0 + 40, height - M.bottom);
  const sx = (d: number) =>
    x0 + (Math.min(Math.max(d, 0), elevation.length) / (elevation.length || 1)) * (x1 - x0);
  const badge = Math.max(18, Math.min(26, (y1 - y0) * 0.16));
  const maxH = elevation.points.reduce((m, p) => Math.max(m, p.height), 0);
  // Schematic, not CAD: show the band that holds the points (≥120 cm) so low sockets don't sit on the floor line.
  const range = Math.min(elevation.displayHeight, Math.max(120, maxH * 1.5));
  const floorPad = badge * 0.9;
  const sy = (h: number) => y1 - floorPad - (Math.min(h, range) / range) * (y1 - y0 - floorPad);
  const tvW = Math.min(130, (x1 - x0) * 0.24);
  const tvH = Math.min(tvW * 0.6, (y1 - y0) * 0.5);
  // Dimension labels left → right; pushed apart so close points stay readable.
  const labels: Array<{ d: number; x: number }> = [];
  for (const d of Array.from(new Set(elevation.points.map((p) => Math.round(p.distance))))) {
    const prev = labels[labels.length - 1];
    labels.push({ d, x: prev && sx(d) - prev.x < 60 ? prev.x + 60 : sx(d) });
  }

  return (
    <div ref={ref} className="relative h-full w-full">
      {width > 0 ? (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          <defs>
            <linearGradient id="wall-face" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9dde3" />
              <stop offset="100%" stopColor="#b9bec7" />
            </linearGradient>
            <radialGradient id="wall-light" cx="0.5" cy="0.2" r="0.8">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tv-screen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1d2230" />
              <stop offset="100%" stopColor="#05070b" />
            </linearGradient>
          </defs>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#wall-face)" />
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#wall-light)" />
          <rect x={x0} y={y1 - 6} width={x1 - x0} height={6} fill="#9aa2ae" />
          <line x1={x0} y1={y1} x2={x1} y2={y1} stroke="#3b8bff" strokeWidth={1.5} />
          {labels.map(({ d, x }) => (
            <g key={d}>
              <circle cx={sx(d)} cy={y1} r={2.2} fill="#3b8bff" />
              <text x={x} y={y1 + 23} textAnchor="middle" fontSize={14.5} fill="#eef3ff" className="tabular">
                {d} {uz.point.cm}
              </text>
            </g>
          ))}
          {maxH > 0 ? (
            <g stroke="#c6cfdd" strokeWidth={1.2}>
              <line x1={x1 + 18} y1={y1} x2={x1 + 18} y2={sy(maxH)} />
              <line x1={x1 + 12} y1={y1} x2={x1 + 24} y2={y1} />
              <line x1={x1 + 12} y1={sy(maxH)} x2={x1 + 24} y2={sy(maxH)} />
              <text
                x={x1 + 30}
                y={(y1 + sy(maxH)) / 2 + 5}
                fontSize={14.5}
                fill="#eef3ff"
                stroke="none"
                className="tabular"
              >
                {maxH} {uz.point.cm}
              </text>
            </g>
          ) : null}
          {elevation.points.map(({ point, distance, height: h }) =>
            point.symbolId === 'tv' ? (
              <g key={point.id}>
                <rect
                  x={sx(distance) - tvW / 2 - 3}
                  y={sy(h) - tvH / 2 - 3}
                  width={tvW + 6}
                  height={tvH + 6}
                  rx={3}
                  fill="#2b2f38"
                />
                <rect
                  x={sx(distance) - tvW / 2}
                  y={sy(h) - tvH / 2}
                  width={tvW}
                  height={tvH}
                  rx={1.5}
                  fill="url(#tv-screen)"
                />
              </g>
            ) : (
              <line
                key={point.id}
                x1={sx(distance)}
                y1={sy(h) + badge / 2}
                x2={sx(distance)}
                y2={y1}
                stroke="#3b8bff"
                strokeOpacity={0.7}
                strokeWidth={1.2}
              />
            ),
          )}
        </svg>
      ) : null}
      {width > 0
        ? elevation.points
            .filter((p) => p.point.symbolId !== 'tv')
            .map(({ point, distance, height: h }) => (
              <div
                key={point.id}
                className="absolute"
                style={{
                  left: sx(distance) - badge / 2,
                  top: sy(h) - badge / 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
                }}
              >
                <SymbolIcon id={point.symbolId} size={badge} color={point.color} />
              </div>
            ))
        : null}
    </div>
  );
}
