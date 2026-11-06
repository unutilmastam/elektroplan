'use client';

import type { PanelDesign, PanelInput } from '@/domain/wiring/panel';
import type { PanelFlow, PanelState } from '@/domain/wiring/panelSim';
import { num } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { boardRealGeo, type Conductor, type DevGeo } from './boardRealGeo';
import { RealDefs } from './RealDefs';
import { MOD, RealDin, RealMeter } from './RealDin';
import { Flow, Insulation, Sheath } from './RealWire';

interface Props {
  design: PanelDesign;
  input: PanelInput;
  state: PanelState;
  flow: PanelFlow;
  flashes: Record<string, number>;
  onToggle: (key: string) => void;
  onTest: (deviceId: string) => void;
  onLoad: (lineId: string) => void;
}

/** The board as an electrician sees it with the door open: real devices, comb, bars, wiring, cables. */
export function PanelRealView({ design, input, state, flow, flashes, onToggle, onTest, onLoad }: Props) {
  const g = boardRealGeo(design);
  const name = (id: string) => input.lines.find((l) => l.id === id)?.name ?? '';
  const cur = (id: string) => flow.current[id] ?? 0;
  const total = Object.values(flow.current).reduce((s, a) => s + a, 0);
  const rowOf = new Map(g.devices.map((d) => [d.key, d.row]));
  const amps = (c: Conductor): number => {
    switch (c.tag.t) {
      case 'feed':
        return total;
      case 'phase':
        return flow.phaseA[c.tag.phase] ?? 0;
      case 'row': {
        const row = c.tag.row;
        return design.lines
          .filter((l) => rowOf.get(l.id) === row || (l.rcdId && rowOf.get(l.rcdId) === row))
          .reduce((s, l) => s + cur(l.id), 0);
      }
      case 'rcd': {
        const id = c.tag.id;
        return design.lines.filter((l) => l.rcdId === id).reduce((s, l) => s + cur(l.id), 0);
      }
      case 'line':
        return cur(c.tag.id);
      case 'nbar': {
        const row = c.tag.row;
        return design.lines
          .filter((l) => rowOf.get(l.id) === row && l.rcdId === null && l.protection !== 'rcbo')
          .reduce((s, l) => s + cur(l.id), 0);
      }
      default:
        return 0;
    }
  };
  const isOn = (d: DevGeo) =>
    d.kind === 'main'
      ? state.main
      : d.kind === 'rcd'
        ? state.rcd[d.ref!] !== false
        : d.kind === 'mcb' || d.kind === 'rcbo'
          ? state.breaker[d.ref!] !== false
          : state.main;
  const rating = (d: DevGeo) => {
    if (d.kind === 'main') return `${design.main.ratingA} A`;
    if (d.kind === 'relay') return `${design.main.relayA}A`;
    if (d.kind === 'spd') return 'T2';
    if (d.kind === 'rcd') return `${design.rcds.find((r) => r.id === d.ref)!.ratingA} A`;
    return `${d.line!.curve}${d.line!.breakerA}`;
  };
  const sub = (d: DevGeo) =>
    d.kind === 'rcd' || d.kind === 'rcbo'
      ? '30 mA · AC'
      : d.kind === 'relay'
        ? uz.wiring.devices.relay
        : d.kind === 'spd'
          ? uz.wiring.devices.spd
          : '4,5 kA · 230 V';

  return (
    <svg
      viewBox={`0 0 ${g.view.w} ${g.view.h}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={uz.wiring.view.scheme}
      data-testid="panel-board"
    >
      <RealDefs />
      <rect width={g.view.w} height={g.view.h} fill="#1a1d22" />
      <RealMeter x={g.meter.x} y={g.meter.y} kw={(total * 230) / 1000} phases={design.phases} />
      <text x={g.meter.x + 250} y={g.meter.y + 40} fontSize={16} fontWeight={600} fill="#e2e8f0">
        {uz.wiring.devices.meter}
      </text>
      {/* enclosure with its back plate */}
      <rect
        x={g.enc.x - 16}
        y={g.enc.y - 16}
        width={g.enc.w + 32}
        height={g.enc.h + 32}
        rx={18}
        fill="#c9ced5"
        stroke="#8a929d"
        strokeWidth={2}
        filter="url(#r-shadow)"
      />
      <rect
        x={g.enc.x}
        y={g.enc.y}
        width={g.enc.w}
        height={g.enc.h}
        rx={10}
        fill="#e9ecef"
        stroke="#a9b0ba"
      />
      {/* DIN rails */}
      {g.rails.map((r, i) => (
        <g key={i}>
          <rect
            x={g.enc.x + 100}
            y={r.y - 17}
            width={g.enc.w - 120}
            height={34}
            rx={2}
            fill="#b8bec6"
            stroke="#868e99"
          />
          {Array.from({ length: Math.floor((g.enc.w - 140) / 34) }, (_, k) => (
            <rect
              key={k}
              x={g.enc.x + 112 + k * 34}
              y={r.y - 4}
              width={22}
              height={8}
              rx={3}
              fill="#8d959f"
            />
          ))}
        </g>
      ))}
      {/* N / PE bars */}
      {g.bars.map((b, i) => (
        <g key={`b${i}`} filter="url(#r-soft)">
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={22}
            rx={4}
            fill={b.kind === 'N' ? '#2f6fe0' : '#e5c21a'}
            stroke="#334155"
          />
          {b.kind === 'PE' ? (
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={22}
              rx={4}
              fill="none"
              stroke="#1c8f3a"
              strokeWidth={6}
              strokeDasharray="10 10"
              opacity={0.6}
            />
          ) : null}
          {b.terminals.map((t, k) => (
            <circle key={k} cx={t.x} cy={t.y} r={6} fill="url(#r-screw)" stroke="#475569" strokeWidth={0.6} />
          ))}
          <text x={b.x + 4} y={b.y - 6} fontSize={12} fontWeight={700} fill="#334155">
            {b.kind === 'N' ? b.label.replace('#', `${uz.wiring.devices.rcd} `) : b.label}
          </text>
        </g>
      ))}
      {/* conductors (copper bars drawn as busbars) */}
      {g.conductors.map((c) =>
        c.bar ? (
          <g key={c.id} pointerEvents="none">
            <path d={c.d} stroke="#6b3510" strokeWidth={10} fill="none" strokeLinecap="round" />
            <path d={c.d} stroke="url(#r-copper)" strokeWidth={7} fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <Insulation key={c.id} d={c.d} color={c.color} width={8} />
        ),
      )}
      {/* cables leaving the board */}
      {g.cables.map((c) => (
        <Sheath key={`cab-${c.line.id}`} d={c.d} width={16} />
      ))}
      {g.devices.map((d) => (
        <RealDin
          key={d.key}
          kind={d.kind}
          x={d.x}
          y={d.y}
          modules={d.modules}
          poles={d.poles}
          on={isOn(d)}
          rating={rating(d)}
          sub={sub(d)}
          flash={flashes[d.key] ?? 0}
          label={d.line ? `${rating(d)} ${name(d.line.id)}` : uz.wiring.devices[d.kind]}
          onToggle={d.kind === 'relay' || d.kind === 'spd' ? null : () => onToggle(d.key)}
          onTest={d.kind === 'rcd' || d.kind === 'rcbo' ? () => onTest(d.ref!) : null}
        />
      ))}
      {/* current: particles on every conductor that carries it */}
      {g.conductors
        .filter((c) => c.kind !== 'PE' && amps(c) > 0.05)
        .map((c) => (
          <Flow
            key={`f-${c.id}`}
            d={c.d}
            forward
            kind={c.kind === 'N' ? 'N' : 'L'}
            busy={Math.min(4, 0.6 + amps(c) / 10)}
          />
        ))}
      {g.cables
        .filter((c) => cur(c.line.id) > 0)
        .map((c) => (
          <Flow
            key={`fc-${c.line.id}`}
            d={c.d}
            forward
            kind="L"
            busy={Math.min(4, 0.6 + cur(c.line.id) / 10)}
          />
        ))}
      {/* the consumers at the cable ends */}
      {g.cables.map((c) => {
        const a = cur(c.line.id);
        const live = flow.live[c.line.id] === true;
        const x = c.exit.x + 48;
        return (
          <g
            key={`load-${c.line.id}`}
            role="switch"
            aria-checked={state.load[c.line.id] === true}
            aria-label={`${uz.wiring.sim.load}: ${name(c.line.id)}`}
            tabIndex={0}
            onClick={() => onLoad(c.line.id)}
            onKeyDown={(e) => e.key === 'Enter' && onLoad(c.line.id)}
            style={{ cursor: 'pointer' }}
            data-testid="board-load"
          >
            <rect
              x={x}
              y={c.exit.y - 17}
              width={250}
              height={34}
              rx={9}
              fill={a > 0 ? '#3a2f05' : '#20252d'}
              stroke={a > 0 ? '#facc15' : live ? '#3f6f4f' : '#3b4452'}
            />
            <circle
              cx={x + 18}
              cy={c.exit.y}
              r={9}
              fill={a > 0 ? '#ffd25a' : '#475569'}
              className={a > 0 ? 'lamp-glow' : undefined}
            />
            <text x={x + 34} y={c.exit.y + 5} fontSize={14} fill="#e5e7eb">
              {name(c.line.id).slice(0, 18)}
            </text>
            <text
              x={x + 240}
              y={c.exit.y + 5}
              textAnchor="end"
              fontSize={14}
              fontWeight={700}
              fill={a > 0 ? '#fde68a' : '#94a3b8'}
            >
              {a > 0 ? `${num(a)}A` : state.load[c.line.id] ? '—' : 'OFF'}
            </text>
          </g>
        );
      })}
      <text x={g.enc.x + g.enc.w - 8} y={g.enc.y - 24} textAnchor="end" fontSize={13} fill="#94a3b8">
        {`${g.devices.reduce((s, d) => s + d.modules, 0)} × ${MOD / 3} mm`}
      </text>
    </svg>
  );
}
