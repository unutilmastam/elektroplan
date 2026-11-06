'use client';

import type { ReactNode } from 'react';
import { RealDin, RealMeter, type DinKind } from '../real/RealDin';
import type { PartId } from './PartArt';

const noop = () => undefined;

function din(
  kind: DinKind,
  modules: number,
  poles: number,
  rating: string,
  sub: string,
  face?: 'contactor' | 'impulse' | 'timer' | 'socket',
) {
  const scale = 0.72;
  const w = modules * 54 * scale;
  return (
    <g transform={`translate(${130 - w / 2} 14) scale(${scale})`}>
      <RealDin
        kind={kind}
        x={0}
        y={0}
        modules={modules}
        poles={poles}
        on
        rating={rating}
        sub={sub}
        flash={0}
        onToggle={null}
        onTest={kind === 'rcd' || kind === 'rcbo' ? noop : null}
        label={rating}
        face={face}
      />
    </g>
  );
}

/** Pictures of the board parts (viewBox 260 × 200). */
export function boardArt(id: PartId): ReactNode {
  switch (id) {
    case 'mcb1':
      return din('mcb', 1, 1, 'C16', '4,5 kA');
    case 'mcb2':
      return din('mcb', 2, 2, 'C40', '4,5 kA');
    case 'mcb3':
      return din('main', 3, 3, 'C25', '3P · 400 V');
    case 'rcd':
      return din('rcd', 2, 2, '40 A', '30 mA · AC');
    case 'rcbo':
      return din('rcbo', 2, 2, 'C16', '30 mA · A');
    case 'relay':
      return din('relay', 2, 2, '50A', 'RN');
    case 'spd':
      return din('spd', 2, 2, 'T2', '20 kA');
    case 'isolator':
      return din('main', 2, 2, '63 A', '0 – I');
    case 'contactor':
      return din('mcb', 2, 2, '25 A', '2NO · 230 V', 'contactor');
    case 'impulse':
      return din('mcb', 1, 1, '16 A', 'IR', 'impulse');
    case 'timer':
      return din('mcb', 2, 2, '16 A', '24 h', 'timer');
    case 'modsocket':
      return din('mcb', 3, 1, '16 A', '230 V', 'socket');
    case 'meter':
      return (
        <g transform="translate(55 8) scale(0.72)">
          <RealMeter x={0} y={0} kw={1.25} phases={1} />
        </g>
      );
    case 'rail':
      return (
        <g>
          <rect x={14} y={82} width={232} height={36} rx={2} fill="#b8bec6" stroke="#868e99" />
          {Array.from({ length: 7 }, (_, k) => (
            <rect key={k} x={24 + k * 32} y={96} width={22} height={8} rx={3} fill="#8d959f" />
          ))}
        </g>
      );
    case 'comb':
      return (
        <g>
          <path d="M20 86 H240" stroke="#6b3510" strokeWidth={12} strokeLinecap="round" />
          <path d="M20 86 H240" stroke="url(#r-copper)" strokeWidth={9} strokeLinecap="round" />
          {Array.from({ length: 8 }, (_, k) => (
            <rect
              key={k}
              x={30 + k * 27}
              y={90}
              width={8}
              height={40}
              rx={2}
              fill="url(#r-copper)"
              stroke="#6b3510"
              strokeWidth={0.8}
            />
          ))}
          <rect x={14} y={66} width={232} height={18} rx={6} fill="#1f5fd1" opacity={0.25} />
        </g>
      );
    case 'nbar':
    case 'pebar': {
      const pe = id === 'pebar';
      return (
        <g filter="url(#r-soft)">
          <rect x={26} y={88} width={24} height={40} rx={4} fill={pe ? '#e5c21a' : '#2f6fe0'} />
          <rect x={210} y={88} width={24} height={40} rx={4} fill={pe ? '#e5c21a' : '#2f6fe0'} />
          <rect x={20} y={80} width={220} height={22} rx={3} fill="url(#r-copper)" stroke="#6b3510" />
          {Array.from({ length: 8 }, (_, k) => (
            <circle
              key={k}
              cx={40 + k * 26}
              cy={91}
              r={7}
              fill="url(#r-screw)"
              stroke="#475569"
              strokeWidth={0.6}
            />
          ))}
          <text
            x={130}
            y={150}
            textAnchor="middle"
            fontSize={18}
            fontWeight={800}
            fill={pe ? '#fde68a' : '#93c5fd'}
          >
            {pe ? 'PE' : 'N'}
          </text>
        </g>
      );
    }
    case 'enclosure':
      return (
        <g filter="url(#r-shadow)">
          <rect
            x={40}
            y={20}
            width={180}
            height={160}
            rx={12}
            fill="#c9ced5"
            stroke="#8a929d"
            strokeWidth={2}
          />
          <rect x={52} y={32} width={156} height={136} rx={6} fill="#e9ecef" />
          {[0, 1].map((r) => (
            <g key={r}>
              <rect x={58} y={60 + r * 60} width={144} height={14} fill="#b8bec6" />
              {Array.from({ length: 8 }, (_, k) => (
                <rect
                  key={k}
                  x={60 + k * 18}
                  y={44 + r * 60}
                  width={16}
                  height={46}
                  rx={2}
                  fill="#fff"
                  stroke="#aab2bd"
                />
              ))}
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}
