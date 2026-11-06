'use client';

import type { ReactNode } from 'react';
import { RealBoxShell } from '../real/RealDevices';
import { RealWago } from '../real/RealWago';
import { Insulation } from '../real/RealWire';
import type { PartId } from './PartArt';


/** Pictures of the junction box parts (viewBox 260 × 200). */
export function boxArt(id: PartId): ReactNode {
  switch (id) {
    case 'wago412':
    case 'wago413':
    case 'wago415': {
      const ways = id === 'wago412' ? 2 : id === 'wago413' ? 3 : 5;
      return (
        <g transform="translate(0 10)">
          <RealWago
            c={{ x: 130, y: 96 }}
            ways={ways}
            up={false}
            filled={Array.from({ length: ways }, (_, i) => i < ways - 1)}
          />
          {Array.from({ length: ways - 1 }, (_, i) => {
            const x = 130 - (ways * 25 + 10) / 2 + 5 + 25 * (i + 0.5);
            const color = ['L', 'S1', 'N', 'PE'][i]!;
            return (
              <Insulation
                key={i}
                d={`M${x} 138 C${x} 160 ${x - 10} 175 ${x - 20} 190`}
                color={color}
                width={8}
              />
            );
          })}
        </g>
      );
    }
    case 'wago2273':
      return (
        <g filter="url(#r-soft)">
          <rect x={92} y={60} width={76} height={70} rx={8} fill="url(#r-wago-body)" stroke="#8d97a3" />
          <rect x={92} y={60} width={76} height={20} rx={6} fill="#f97316" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={108 + i * 22} cy={118} r={6} fill="#2a2f36" />
          ))}
          <rect x={98} y={92} width={64} height={6} rx={2} fill="url(#r-copper)" />
        </g>
      );
    case 'siz':
      return (
        <g filter="url(#r-soft)">
          <Insulation d="M40 170 C60 150 90 140 112 122" color="L" width={9} />
          <Insulation d="M60 186 C80 160 100 140 118 126" color="S1" width={9} />
          <path d="M100 120 L170 60 L190 80 L120 140 Z" fill="#facc15" stroke="#a16207" strokeWidth={2} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${120 + i * 15} ${118 - i * 13} l18 18`} stroke="#a16207" strokeWidth={2} />
          ))}
        </g>
      );
    case 'terminal':
      return (
        <g filter="url(#r-soft)">
          <rect x={20} y={80} width={220} height={44} rx={6} fill="#f1f5f9" stroke="#94a3b8" />
          {Array.from({ length: 6 }, (_, k) => (
            <g key={k}>
              <rect x={30 + k * 35} y={86} width={28} height={32} rx={3} fill="#e2e8f0" stroke="#cbd5e1" />
              <circle
                cx={44 + k * 35}
                cy={102}
                r={8}
                fill="url(#r-screw)"
                stroke="#64748b"
                strokeWidth={0.6}
              />
            </g>
          ))}
        </g>
      );
    case 'jbox':
      return (
        <g transform="translate(30 20) scale(0.36)">
          <RealBoxShell
            x={0}
            y={0}
            w={560}
            h={430}
            entries={[
              { x: 0, y: 215, side: 'l' },
              { x: 280, y: 0, side: 't' },
              { x: 280, y: 430, side: 'b' },
            ]}
          />
        </g>
      );
    default:
      return null;
  }
}
