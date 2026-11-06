'use client';

import type { ReactNode } from 'react';
import { RealLamp, RealSwitch } from '../real/RealDevices';
import type { PartId } from './PartArt';

const noop = () => undefined;

function frame(children: ReactNode) {
  return (
    <g>
      <rect
        x={82}
        y={52}
        width={96}
        height={96}
        rx={16}
        fill="url(#r-white)"
        stroke="#aab2bd"
        strokeWidth={1.5}
        filter="url(#r-shadow)"
      />
      {children}
    </g>
  );
}

function socketFace(cx: number, cy: number, r = 32) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#eef1f4" stroke="#b9c0c9" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r - 9} fill="#e2e6eb" />
      <circle cx={cx - r * 0.36} cy={cy} r={r * 0.13} fill="#1f2937" />
      <circle cx={cx + r * 0.36} cy={cy} r={r * 0.13} fill="#1f2937" />
      <rect x={cx - 5} y={cy - r + 4} width={10} height={8} rx={2} fill="url(#r-screw)" />
      <rect x={cx - 5} y={cy + r - 12} width={10} height={8} rx={2} fill="url(#r-screw)" />
    </g>
  );
}

/** Pictures of the wall parts (viewBox 260 × 200). */
export function wallArt(id: PartId): ReactNode {
  switch (id) {
    case 'switch1':
    case 'switch2':
    case 'switch3':
      return (
        <RealSwitch
          c={{ x: 130, y: 92 }}
          keys={id === 'switch1' ? 1 : id === 'switch2' ? 2 : 3}
          on={[]}
          label=""
          onKey={noop}
        />
      );
    case 'pass':
      return (
        <g>
          <RealSwitch c={{ x: 130, y: 92 }} keys={1} on={[]} label="" onKey={noop} />
          <path
            d="M120 82 l10 -10 l10 10 M120 102 l10 10 l10 -10"
            stroke="#64748b"
            strokeWidth={3}
            fill="none"
            pointerEvents="none"
          />
        </g>
      );
    case 'dimmer':
      return frame(
        <g>
          <circle cx={130} cy={100} r={28} fill="url(#r-white-key)" stroke="#9aa3ae" strokeWidth={2} />
          <path d="M130 76 v12" stroke="#f97316" strokeWidth={4} strokeLinecap="round" />
        </g>,
      );
    case 'motion':
      return frame(
        <g>
          <circle cx={130} cy={100} r={30} fill="#f8fafc" stroke="#9aa3ae" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={130} cy={100} r={8 + i * 6} fill="none" stroke="#cbd5e1" strokeWidth={1.4} />
          ))}
        </g>,
      );
    case 'socket':
      return frame(socketFace(130, 100));
    case 'socket2':
      return (
        <g>
          <rect
            x={40}
            y={52}
            width={180}
            height={96}
            rx={16}
            fill="url(#r-white)"
            stroke="#aab2bd"
            strokeWidth={1.5}
            filter="url(#r-shadow)"
          />
          {socketFace(88, 100, 30)}
          {socketFace(172, 100, 30)}
        </g>
      );
    case 'socketIp44':
      return frame(
        <g>
          {socketFace(130, 100)}
          <path d="M84 56 H176 L170 96 H90 Z" fill="#94a3b8" opacity={0.75} stroke="#64748b" />
          <text x={130} y={84} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1f2937">
            IP44
          </text>
        </g>,
      );
    case 'socketStove':
      return frame(
        <g>
          <circle cx={130} cy={100} r={34} fill="#eef1f4" stroke="#b9c0c9" strokeWidth={2} />
          {[0, 1, 2].map((i) => {
            const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
            return (
              <rect
                key={i}
                x={130 + Math.cos(a) * 16 - 3}
                y={100 + Math.sin(a) * 16 - 8}
                width={6}
                height={16}
                rx={2}
                fill="#1f2937"
                transform={`rotate(${(a * 180) / Math.PI + 90} ${130 + Math.cos(a) * 16} ${100 + Math.sin(a) * 16})`}
              />
            );
          })}
          <text x={130} y={156} textAnchor="middle" fontSize={11} fill="#64748b">
            32 A
          </text>
        </g>,
      );
    case 'backbox':
      return (
        <g filter="url(#r-soft)">
          <ellipse cx={130} cy={104} rx={62} ry={62} fill="#2f6fe0" />
          <ellipse cx={130} cy={104} rx={50} ry={50} fill="#1d4ed8" />
          <circle cx={92} cy={104} r={7} fill="#0b2a6b" />
          <circle cx={168} cy={104} r={7} fill="#0b2a6b" />
          <rect x={120} y={46} width={20} height={14} rx={3} fill="#0b2a6b" />
        </g>
      );
    case 'lamp':
      return <RealLamp c={{ x: 130, y: 80 }} lit label="" />;
    default:
      return null;
  }
}
