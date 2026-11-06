'use client';

import type { P } from './RealWire';

/**
 * Lever clamp like a WAGO 221-412/413/415 (to scale: one way ≈ 5.6 mm, length 18 mm, here 4.5 px/mm).
 * Drawn with the wire openings facing down (`up` = openings facing up). Levers stand up while open.
 */
export const WAGO_PITCH = 25;
export const WAGO_LEN = 84;
export const wagoWidth = (ways: number) => ways * WAGO_PITCH + 10;

/** Centre of opening `i` and the direction pointing out of it (the way a conductor comes in from). */
export function wagoEntry(c: P, ways: number, i: number, up: boolean): { at: P; out: P } {
  const x = c.x - wagoWidth(ways) / 2 + 5 + WAGO_PITCH * (i + 0.5);
  return up
    ? { at: { x, y: c.y - WAGO_LEN / 2 }, out: { x: 0, y: -1 } }
    : { at: { x, y: c.y + WAGO_LEN / 2 }, out: { x: 0, y: 1 } };
}

export function RealWago({
  c,
  ways,
  up,
  filled,
  highlight = false,
  label,
  onEntry,
}: {
  c: P;
  ways: number;
  up: boolean;
  filled: boolean[];
  highlight?: boolean;
  label?: string;
  onEntry?: (i: number) => void;
}) {
  const w = wagoWidth(ways);
  const h = WAGO_LEN;
  return (
    <g
      transform={`translate(${c.x} ${c.y}) ${up ? 'rotate(180)' : ''}`}
      filter="url(#r-soft)"
      data-testid="real-wago"
    >
      {/* transparent body */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={7}
        fill="url(#r-wago-body)"
        stroke={highlight ? '#facc15' : '#8d97a3'}
        strokeWidth={highlight ? 3 : 1.4}
      />
      {/* copper bar seen through the housing */}
      <rect
        x={-w / 2 + 6}
        y={h / 2 - 34}
        width={w - 12}
        height={7}
        rx={2}
        fill="url(#r-copper)"
        opacity={0.85}
      />
      {/* grey rear part with the test slot */}
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={22} rx={5} fill="#9aa4af" opacity={0.85} />
      {Array.from({ length: ways }, (_, i) => {
        const x = -w / 2 + 5 + WAGO_PITCH * (i + 0.5);
        const closed = filled[i] === true;
        return (
          <g key={i}>
            {/* lever */}
            {closed ? (
              <rect
                x={x - 9}
                y={-h / 2 + 8}
                width={18}
                height={34}
                rx={4}
                fill="url(#r-wago-lever)"
                stroke="#8a4100"
                strokeWidth={0.8}
              />
            ) : (
              <g>
                <rect
                  x={x - 9}
                  y={-h / 2 - 22}
                  width={18}
                  height={40}
                  rx={4}
                  fill="url(#r-wago-lever)"
                  stroke="#8a4100"
                  strokeWidth={0.8}
                />
                <rect x={x - 6} y={-h / 2 - 18} width={12} height={4} rx={2} fill="#ffd3a1" opacity={0.8} />
              </g>
            )}
            {/* opening */}
            <circle
              cx={x}
              cy={h / 2 - 9}
              r={6.4}
              fill={closed ? '#5b3b22' : '#2a2f36'}
              stroke="#6b7480"
              strokeWidth={1}
              onClick={onEntry && !closed ? () => onEntry(i) : undefined}
              style={onEntry && !closed ? { cursor: 'pointer' } : undefined}
              data-testid={onEntry && !closed ? 'wago-entry' : undefined}
            />
          </g>
        );
      })}
      {label ? (
        <text
          x={0}
          y={-2}
          textAnchor="middle"
          fontSize={15}
          fontWeight={800}
          fill="#1f2937"
          transform={up ? 'rotate(180)' : undefined}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
