'use client';

import { DH, type PlacedDevice } from './boardLayout';

/** One DIN-rail device: body, label, lever (up = on), RCD test button. SVG. */
export function BoardDevice({
  dev,
  on,
  label,
  sub,
  flash,
  onToggle,
  onTest,
}: {
  dev: PlacedDevice;
  on: boolean;
  label: string;
  sub: string;
  /** bumps when this device just tripped */
  flash: number;
  onToggle: (() => void) | null;
  onTest: (() => void) | null;
}) {
  const { x, y, w } = dev;
  const pad = 3;
  const body =
    dev.kind === 'rcd' || dev.kind === 'rcbo'
      ? '#dfe6f1'
      : dev.kind === 'relay' || dev.kind === 'spd'
        ? '#d4dbe7'
        : '#eef2f7';
  const leverX = x + w / 2 - 9;
  const leverY = on ? y + 26 : y + 46;
  return (
    <g data-testid={`board-${dev.kind}`} data-on={on}>
      <rect
        x={x + pad}
        y={y}
        width={w - pad * 2}
        height={DH}
        rx={5}
        fill={body}
        stroke="#7d8798"
        strokeWidth={1}
      />
      {/* terminals */}
      <rect x={x + pad + 4} y={y + 3} width={w - pad * 2 - 8} height={8} rx={2} fill="#9aa4b4" />
      <rect x={x + pad + 4} y={y + DH - 11} width={w - pad * 2 - 8} height={8} rx={2} fill="#9aa4b4" />
      {/* lever slot + lever */}
      {onToggle ? (
        <g
          role="switch"
          aria-checked={on}
          aria-label={`${label} ${sub}`}
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
          style={{ cursor: 'pointer' }}
        >
          <rect x={x + w / 2 - 12} y={y + 20} width={24} height={50} rx={4} fill="#3b4352" />
          <rect
            x={leverX}
            y={leverY}
            width={18}
            height={22}
            rx={3}
            fill={on ? '#22c55e' : '#f8fafc'}
            stroke="#1f2937"
            strokeWidth={1}
            style={{ transition: 'y 160ms ease-out' }}
          />
          <rect x={x} y={y} width={w} height={DH} fill="transparent" />
        </g>
      ) : (
        <rect x={x + w / 2 - 10} y={y + 26} width={20} height={36} rx={3} fill="#3b4352" />
      )}
      {onTest ? (
        <g
          role="button"
          aria-label={`${label} T`}
          tabIndex={0}
          onClick={onTest}
          onKeyDown={(e) => e.key === 'Enter' && onTest()}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={x + w - 11} cy={y + 22} r={7} fill="#facc15" stroke="#7a5d00" />
          <text x={x + w - 11} y={y + 25.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#3a2c00">
            T
          </text>
        </g>
      ) : null}
      <text
        x={x + w / 2}
        y={y + DH - 16}
        textAnchor="middle"
        fontSize={dev.modules > 1 ? 11 : 9.5}
        fontWeight={700}
        fill="#1f2937"
      >
        {label}
      </text>
      <rect
        key={flash}
        x={x + pad}
        y={y}
        width={w - pad * 2}
        height={DH}
        rx={5}
        fill="#ef4444"
        opacity={0}
        className={flash ? 'trip-flash' : undefined}
        pointerEvents="none"
      />
    </g>
  );
}
