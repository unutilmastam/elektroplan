'use client';

import { WIRE } from '@/domain/wiring/catalog';
import type { BoxStatus, Joins, KeyState } from '@/domain/wiring/boxCheck';
import type { BoxInput, Cable } from '@/domain/wiring/junctionBox';
import { uz } from '@/i18n/uz';
import {
  BOX,
  VIEW,
  clampWidth,
  looseEnd,
  placeCables,
  placeClamps,
  slot,
  wirePath,
  type CablePlace,
  type Pt,
} from './boxLayout';

interface Props {
  input: BoxInput;
  cables: Cable[];
  joins: Joins;
  /** label per join (L, N, PE, 1.2 …) */
  joinLabels: string[];
  keys: KeyState;
  status: BoxStatus;
  onKey: (switchId: string, key: number) => void;
  /** manual mode: tap a core end / a clamp */
  picked?: string | null;
  onCore?: (coreId: string) => void;
  onClamp?: (index: number) => void;
}

export const lampLabel = (c: Cable, input: BoxInput) =>
  `${input.switches.findIndex((s) => s.id === c.switchId) + 1}.${c.key}.${c.lamp}`;

/** Junction box with every core drawn to its clamp; live cores animate, lamps glow, keys switch. */
export function BoxDiagram({
  input,
  cables,
  joins,
  joinLabels,
  keys,
  status,
  onKey,
  picked = null,
  onCore,
  onClamp,
}: Props) {
  const places = placeCables(cables);
  const clampPts = placeClamps(joins.length);
  const where = new Map<string, Pt>(); // core id → its end inside the box
  joins.forEach((j, ci) =>
    j.forEach((id, si) => where.set(id, slot(clampPts[ci]!, Math.max(2, j.length), si))),
  );
  const switchIndex = (id: string | null) => input.switches.findIndex((s) => s.id === id);

  const coreWires = (p: CablePlace) =>
    p.cable.cores.map((core, i) => {
      const off = (i - (p.cable.cores.length - 1) / 2) * 7;
      const start = {
        x: p.entry.x + (p.inward.y !== 0 ? off : 0) + p.inward.x * 8,
        y: p.entry.y + (p.inward.x !== 0 ? off : 0) + p.inward.y * 8,
      };
      const end = where.get(core.id) ?? looseEnd(p, i, p.cable.cores.length);
      const live = status.live.has(core.id);
      const loose = !where.has(core.id);
      const d = loose ? `M${start.x} ${start.y} L${end.x} ${end.y}` : wirePath(start, end, p.inward);
      return (
        <g key={core.id}>
          {core.color === 'S1' ? <path d={d} stroke="#94a3b8" strokeWidth={6.5} fill="none" strokeLinecap="round" /> : null}
          <path
            d={d}
            stroke={WIRE[core.color]}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          {core.color === 'PE' ? (
            <path
              d={d}
              stroke="#16a34a"
              strokeWidth={4}
              strokeDasharray="4 6"
              fill="none"
            />
          ) : null}
          {live ? (
            <path
              d={d}
              stroke="#fff6b0"
              strokeWidth={2}
              fill="none"
              className="wire-live wire-busy"
              opacity={0.9}
            />
          ) : null}
          {onCore ? (
            <circle
              cx={end.x}
              cy={end.y}
              r={loose ? 12 : 9}
              fill={picked === core.id ? '#facc15' : loose ? '#0b1324' : 'transparent'}
              stroke={picked === core.id ? '#fff' : loose ? (core.color === 'S1' ? '#cbd5e1' : WIRE[core.color]) : 'transparent'}
              strokeWidth={2.5}
              role="button"
              aria-label={`${core.id}`}
              data-core={core.id}
              onClick={() => onCore(core.id)}
              style={{ cursor: 'pointer' }}
            />
          ) : null}
        </g>
      );
    });

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={uz.wiring.tabs.box}
      data-testid="box-diagram"
    >
      <rect x={4} y={4} width={VIEW.w - 8} height={VIEW.h - 8} rx={16} fill="#0b1324" />
      {/* cable sheaths from the devices to the box */}
      {places.map((p) => (
        <path
          key={`sh-${p.cable.id}`}
          d={`M${p.device.x} ${p.device.y + (p.cable.kind === 'lamp' ? 26 : p.cable.kind === 'switch' ? -40 : 0)} L${p.entry.x} ${p.entry.y}`}
          stroke="#4b5563"
          strokeWidth={11}
          strokeLinecap="round"
        />
      ))}
      <rect
        x={BOX.x}
        y={BOX.y}
        width={BOX.w}
        height={BOX.h}
        rx={26}
        fill="#151f36"
        stroke={status.short ? '#ef4444' : '#5b6b88'}
        strokeWidth={3}
        strokeDasharray="10 6"
      />
      <text x={BOX.x + BOX.w - 18} y={BOX.y + BOX.h - 14} textAnchor="end" fontSize={15} fill="#8b9ab5">
        {uz.wiring.tabs.box}
      </text>
      {places.map((p) => coreWires(p))}
      {/* clamps */}
      {joins.map((j, i) => {
        const c = clampPts[i]!;
        const ways = Math.max(2, j.length);
        const w = clampWidth(ways);
        return (
          <g
            key={`cl-${i}`}
            data-testid="box-clamp"
            onClick={onClamp ? () => onClamp(i) : undefined}
            style={onClamp ? { cursor: 'pointer' } : undefined}
            role={onClamp ? 'button' : undefined}
            aria-label={onClamp ? `${uz.wiring.box.clamps} ${joinLabels[i] ?? i + 1}` : undefined}
          >
            <rect
              x={c.x - w / 2}
              y={c.y - 17}
              width={w}
              height={34}
              rx={6}
              fill="#e5e7eb"
              stroke={picked && onClamp ? '#facc15' : '#94a3b8'}
              strokeWidth={picked && onClamp ? 3 : 1.5}
            />
            {Array.from({ length: ways }, (_, s) => (
              <rect
                key={s}
                x={slot(c, ways, s).x - 4}
                y={c.y - 14}
                width={8}
                height={11}
                rx={2}
                fill="#f97316"
              />
            ))}
            <text x={c.x} y={c.y - 24} textAnchor="middle" fontSize={13} fontWeight={700} fill="#e2e8f0">
              {joinLabels[i] ?? ''}
            </text>
          </g>
        );
      })}
      {/* supply */}
      <text x={20} y={BOX.y + BOX.h / 2 - 18} fontSize={14} fill="#cbd5e1">
        {uz.wiring.box.supply}
      </text>
      {/* lamps */}
      {places
        .filter((p) => p.cable.kind === 'lamp')
        .map((p) => {
          const lit = status.lit[p.cable.id] === true;
          return (
            <g key={`lamp-${p.cable.id}`} data-testid="box-lamp" data-lit={lit}>
              {lit ? (
                <circle cx={p.device.x} cy={p.device.y} r={40} fill="url(#glow)" className="lamp-glow" />
              ) : null}
              <circle
                cx={p.device.x}
                cy={p.device.y}
                r={22}
                fill={lit ? '#fde047' : '#1e293b'}
                stroke={lit ? '#fff7c2' : '#64748b'}
                strokeWidth={3}
              />
              <path
                d={`M${p.device.x - 10} ${p.device.y - 10} L${p.device.x + 10} ${p.device.y + 10} M${p.device.x + 10} ${p.device.y - 10} L${p.device.x - 10} ${p.device.y + 10}`}
                stroke={lit ? '#a16207' : '#64748b'}
                strokeWidth={2.5}
              />
              <text x={p.device.x} y={p.device.y - 30} textAnchor="middle" fontSize={12} fill="#cbd5e1">
                {lampLabel(p.cable, input)}
              </text>
            </g>
          );
        })}
      {/* switches with clickable keys */}
      {places
        .filter((p) => p.cable.kind === 'switch')
        .map((p) => {
          const s = input.switches[switchIndex(p.cable.switchId)]!;
          const kw = 46;
          const w = kw * s.keys + 12;
          const x0 = p.device.x - w / 2;
          return (
            <g key={`sw-${s.id}`}>
              <rect
                x={x0}
                y={p.device.y - 40}
                width={w}
                height={80}
                rx={10}
                fill="#f1f5f9"
                stroke="#94a3b8"
                strokeWidth={2}
              />
              {Array.from({ length: s.keys }, (_, k) => {
                const on = keys[s.id]?.[k] === true;
                return (
                  <g
                    key={k}
                    role="switch"
                    aria-checked={on}
                    aria-label={`${uz.wiring.box.switchN.replace('{n}', String(switchIndex(s.id) + 1))}, ${uz.wiring.box.keyN.replace('{k}', String(k + 1))}`}
                    tabIndex={0}
                    onClick={() => onKey(s.id, k)}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onKey(s.id, k))
                    }
                    style={{ cursor: 'pointer' }}
                    data-testid="box-key"
                  >
                    <rect
                      x={x0 + 6 + k * kw}
                      y={p.device.y - 34}
                      width={kw - 4}
                      height={68}
                      rx={6}
                      fill={on ? '#dbeafe' : '#e2e8f0'}
                      stroke="#64748b"
                    />
                    <rect
                      x={x0 + 6 + k * kw + 8}
                      y={on ? p.device.y - 28 : p.device.y + 2}
                      width={kw - 20}
                      height={26}
                      rx={4}
                      fill={on ? '#2563eb' : '#94a3b8'}
                      style={{ transition: 'y 150ms ease-out' }}
                    />
                    <text
                      x={x0 + 6 + k * kw + (kw - 4) / 2}
                      y={p.device.y + 52}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#cbd5e1"
                    >
                      {k + 1}
                    </text>
                  </g>
                );
              })}
              <text x={p.device.x} y={p.device.y + 68} textAnchor="middle" fontSize={13} fill="#94a3b8">
                {uz.wiring.box.switchN.replace('{n}', String(switchIndex(s.id) + 1))}
              </text>
            </g>
          );
        })}
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" stopColor="#fde047" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#fde047" stopOpacity={0} />
        </radialGradient>
      </defs>
      {status.short ? (
        <text
          x={VIEW.w / 2}
          y={BOX.y + BOX.h + 30}
          textAnchor="middle"
          fontSize={18}
          fontWeight={700}
          fill="#f87171"
        >
          {uz.wiring.box.shortNow}
        </text>
      ) : null}
    </svg>
  );
}
