'use client';

import { WIRE } from '@/domain/wiring/catalog';
import type { PanelDesign, PanelInput } from '@/domain/wiring/panel';
import type { PanelFlow, PanelState } from '@/domain/wiring/panelSim';
import { num } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { BoardDevice } from './BoardDevice';
import { boardLayout, DH, type PlacedDevice } from './boardLayout';

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

const wireCls = (live: boolean, busy = false) => (live ? `wire-live${busy ? ' wire-busy' : ''}` : undefined);

/** The board as it looks inside: rails, devices, the phase comb, outgoing cables and consumers. Animated. */
export function PanelBoard({ design, input, state, flow, flashes, onToggle, onTest, onLoad }: Props) {
  const lay = boardLayout(design);
  const supplied = state.main;
  const name = (id: string) => input.lines.find((l) => l.id === id)?.name ?? '';
  const isOn = (dev: PlacedDevice) =>
    dev.kind === 'main'
      ? state.main
      : dev.kind === 'rcd'
        ? state.rcd[dev.ref!] !== false
        : dev.kind === 'mcb' || dev.kind === 'rcbo'
          ? state.breaker[dev.ref!] !== false
          : state.main;
  const label = (dev: PlacedDevice) => {
    if (dev.kind === 'main') return `${design.main.ratingA}A`;
    if (dev.kind === 'relay') return `RN ${design.main.relayA}`;
    if (dev.kind === 'spd') return uz.wiring.devices.spd;
    if (dev.kind === 'rcd') return `${design.rcds.find((r) => r.id === dev.ref)!.ratingA}A 30mA`;
    return `${dev.line!.curve}${dev.line!.breakerA}`;
  };
  // the comb above a row carries phase to what is fed straight from the main switch
  const rows = Array.from({ length: lay.rows }, (_, r) => lay.devices.filter((d) => d.row === r));

  return (
    <svg
      viewBox={`0 0 ${lay.width} ${lay.height}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={uz.wiring.view.scheme}
      data-testid="panel-board"
    >
      <rect
        x={4}
        y={4}
        width={lay.width - 8}
        height={lay.height - 8}
        rx={14}
        fill="#0b1324"
        stroke="#2a3954"
      />
      {/* meter + supply */}
      <rect x={24} y={18} width={120} height={46} rx={6} fill="#111c33" stroke="#3b4a66" />
      <text x={84} y={46} textAnchor="middle" fontSize={13} fill="#cbd5e1">
        {uz.wiring.devices.meter}
      </text>
      <path
        d={`M150 30 H190 V${lay.devices[0]!.y + 4}`}
        stroke={WIRE.L}
        strokeWidth={4}
        fill="none"
        className={wireCls(true)}
      />
      <path
        d={`M150 50 H176 V${lay.devices[0]!.y + 4}`}
        stroke={WIRE.N}
        strokeWidth={4}
        fill="none"
        className={wireCls(true)}
      />
      {rows.map((row, r) => {
        const top = row[0]!.y - 16;
        const feeds = row.filter(
          (d) => d.group === null && d.kind !== 'main' && d.kind !== 'relay' && d.kind !== 'spd',
        );
        const x0 = r === 0 ? row.find((d) => d.kind === 'spd')!.x : row[0]!.x;
        const x1 = Math.max(...row.map((d) => d.x + d.w));
        return (
          <g key={r}>
            <rect x={12} y={row[0]!.y + 34} width={lay.width - 24} height={26} rx={3} fill="#5b6475" />
            {feeds.length ? (
              <path
                d={`M${x0 + 8} ${top} H${x1 - 8}`}
                stroke={WIRE.L}
                strokeWidth={5}
                className={wireCls(supplied)}
                fill="none"
              />
            ) : null}
            {feeds.map((d) => (
              <path
                key={d.key}
                d={`M${d.x + d.w / 2} ${top} V${d.y + 4}`}
                stroke={WIRE.L}
                strokeWidth={3}
                className={wireCls(supplied)}
                fill="none"
              />
            ))}
            {r > 0 && feeds.length ? (
              <path
                d={`M${x0 + 8} ${top} H16 V${rows[0]![0]!.y - 16}`}
                stroke={WIRE.L}
                strokeWidth={4}
                className={wireCls(supplied)}
                fill="none"
              />
            ) : null}
          </g>
        );
      })}
      {/* RCD → its own sub-comb over the breakers behind it */}
      {design.rcds.map((r) => {
        const dev = lay.devices.find((d) => d.key === r.id)!;
        const kids = lay.devices.filter((d) => d.group === r.id);
        if (!kids.length) return null;
        const live = flow.rcdLive[r.id] === true;
        const y = kids[0]!.y - 6;
        return (
          <path
            key={r.id}
            d={`M${dev.x + dev.w / 2} ${dev.y + DH} v14 H${dev.x + dev.w + 6} V${y} H${kids[kids.length - 1]!.x + kids[kids.length - 1]!.w / 2} M${kids.map((k) => `${k.x + k.w / 2} ${y} V${k.y + 4}`).join(' M')}`}
            stroke={WIRE.L}
            strokeWidth={3}
            fill="none"
            className={wireCls(live)}
          />
        );
      })}
      {lay.devices.map((dev) => (
        <BoardDevice
          key={dev.key}
          dev={dev}
          on={isOn(dev)}
          label={label(dev)}
          sub={dev.line ? name(dev.line.id) : uz.wiring.devices[dev.kind]}
          flash={flashes[dev.key] ?? 0}
          onToggle={dev.kind === 'relay' || dev.kind === 'spd' ? null : () => onToggle(dev.key)}
          onTest={dev.kind === 'rcd' || dev.kind === 'rcbo' ? () => onTest(dev.ref!) : null}
        />
      ))}
      {/* outgoing cables (L, N, PE) and the consumer at the end */}
      {lay.devices
        .filter((d) => d.line)
        .map((dev) => {
          const l = dev.line!;
          const live = flow.live[l.id] === true;
          const amps = flow.current[l.id] ?? 0;
          const cx = dev.x + dev.w / 2;
          const y0 = dev.y + DH;
          const y1 = y0 + 56;
          return (
            <g key={`out-${l.id}`}>
              <path
                d={`M${cx} ${y0} V${y1}`}
                stroke={WIRE.L}
                strokeWidth={3}
                className={wireCls(live, amps > 0)}
                fill="none"
              />
              <path
                d={`M${cx - 6} ${y0 + 10} V${y1}`}
                stroke={WIRE.N}
                strokeWidth={2.5}
                fill="none"
                className={wireCls(live && amps > 0, true)}
              />
              <path
                d={`M${cx + 6} ${y0 + 10} V${y1}`}
                stroke={WIRE.PE}
                strokeWidth={2.5}
                strokeDasharray="5 3"
                fill="none"
              />
              <g
                role="switch"
                aria-checked={state.load[l.id] === true}
                aria-label={`${uz.wiring.sim.load}: ${name(l.id)}`}
                tabIndex={0}
                onClick={() => onLoad(l.id)}
                onKeyDown={(e) => e.key === 'Enter' && onLoad(l.id)}
                style={{ cursor: 'pointer' }}
                data-testid="board-load"
              >
                <rect
                  x={dev.x + 1}
                  y={y1}
                  width={dev.w - 2}
                  height={52}
                  rx={6}
                  fill={amps > 0 ? '#3a2f05' : '#121b30'}
                  stroke={amps > 0 ? '#facc15' : '#33415c'}
                />
                <circle
                  cx={cx}
                  cy={y1 + 16}
                  r={8}
                  fill={amps > 0 ? '#facc15' : '#334155'}
                  className={amps > 0 ? 'lamp-glow' : undefined}
                />
                <text x={cx} y={y1 + 38} textAnchor="middle" fontSize={9} fill="#e2e8f0">
                  {amps > 0 ? `${num(amps)}A` : state.load[l.id] ? '—' : 'OFF'}
                </text>
              </g>
              <text x={cx} y={y1 + 66} textAnchor="middle" fontSize={8.5} fill="#94a3b8">
                {name(l.id).slice(0, dev.w > 40 ? 14 : 7)}
              </text>
            </g>
          );
        })}
      {/* N and PE buses */}
      <rect x={24} y={lay.busY} width={lay.width / 2 - 36} height={12} rx={3} fill={WIRE.N} />
      <text x={30} y={lay.busY + 30} fontSize={12} fill="#93c5fd">
        {uz.wiring.devices.busN}
      </text>
      <rect
        x={lay.width / 2 + 12}
        y={lay.busY}
        width={lay.width / 2 - 36}
        height={12}
        rx={3}
        fill={WIRE.PE}
      />
      <text x={lay.width / 2 + 18} y={lay.busY + 30} fontSize={12} fill="#fde68a">
        {uz.wiring.devices.busPE}
      </text>
    </svg>
  );
}
