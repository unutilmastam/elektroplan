'use client';

import type { ReactNode } from 'react';
import { INSULATION } from '../real/RealDefs';
import { CopperTip, Insulation, Sheath } from '../real/RealWire';
import type { PartId } from './PartArt';


function cable(cores: string[], sheath = 22, label = '') {
  const n = cores.length;
  return (
    <g>
      <Sheath d="M8 100 H120" width={sheath} />
      {cores.map((c, i) => {
        const off = (i - (n - 1) / 2) * 14;
        const d = `M120 ${100 + off * 0.3} C150 ${100 + off * 0.5} 160 ${100 + off} 190 ${100 + off}`;
        return (
          <g key={i}>
            <Insulation d={d} color={c} width={8} />
            <CopperTip at={{ x: 190, y: 100 + off }} dir={{ x: 1, y: 0 }} len={20} width={5.5} />
          </g>
        );
      })}
      {/* cross-section */}
      <circle cx={232} cy={60} r={22} fill="#25282d" stroke="#08090b" strokeWidth={2} />
      {cores.map((c, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r = n === 1 ? 0 : 10;
        return (
          <g key={`x${i}`}>
            <circle
              cx={232 + Math.cos(a) * r}
              cy={60 + Math.sin(a) * r}
              r={n > 3 ? 6 : 7.5}
              fill={INSULATION[c]?.base ?? '#999'}
              stroke="#111"
              strokeWidth={0.8}
            />
            <circle
              cx={232 + Math.cos(a) * r}
              cy={60 + Math.sin(a) * r}
              r={n > 3 ? 3 : 4}
              fill="url(#r-copper)"
            />
          </g>
        );
      })}
      {label ? (
        <text x={14} y={150} fontSize={14} fontWeight={700} fill="#cbd5e1">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** Pictures of the cable parts (viewBox 260 × 200). */
export function cableArt(id: PartId): ReactNode {
  switch (id) {
    case 'vvg2':
      return cable(['L', 'N'], 18, '2×1,5');
    case 'vvg3':
      return cable(['L', 'N', 'PE'], 20, '3×1,5');
    case 'vvg325':
      return cable(['L', 'N', 'PE'], 22, '3×2,5');
    case 'vvg34':
      return cable(['L', 'N', 'PE'], 25, '3×4');
    case 'vvg36':
      return cable(['L', 'N', 'PE'], 28, '3×6');
    case 'vvg5':
      return cable(['L', 'L2', 'L3', 'N', 'PE'], 28, '5×2,5');
    case 'input':
      return cable(['L', 'N', 'PE'], 32, '3×10');
    case 'pvs':
      return (
        <g>
          <path
            d="M8 100 C60 70 90 130 140 100"
            stroke="#cbd5e1"
            strokeWidth={22}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M8 100 C60 70 90 130 140 100"
            stroke="#f8fafc"
            strokeWidth={18}
            fill="none"
            strokeLinecap="round"
          />
          <Insulation d="M140 100 C160 92 175 86 196 86" color="L" width={7} />
          <Insulation d="M140 100 C160 100 175 100 196 100" color="N" width={7} />
          <Insulation d="M140 100 C160 108 175 114 196 114" color="PE" width={7} />
          {[86, 100, 114].map((y) => (
            <CopperTip key={y} at={{ x: 196, y }} dir={{ x: 1, y: 0 }} len={20} width={5} />
          ))}
        </g>
      );
    case 'corrugated':
      return (
        <g>
          <path d="M14 100 H246" stroke="#6b7280" strokeWidth={34} strokeLinecap="round" />
          {Array.from({ length: 30 }, (_, k) => (
            <path key={k} d={`M${20 + k * 7.6} 84 V116`} stroke="#9ca3af" strokeWidth={3} />
          ))}
          <Sheath d="M200 100 H252" width={14} />
        </g>
      );
    case 'channel':
      return (
        <g filter="url(#r-soft)">
          <rect x={14} y={78} width={232} height={44} rx={4} fill="url(#r-white)" stroke="#aab2bd" />
          <path d="M14 86 H246" stroke="#cbd5e1" />
          <Sheath d="M20 104 H120" width={12} />
        </g>
      );
    case 'clips':
      return (
        <g>
          <Sheath d="M14 100 H246" width={20} />
          {[70, 190].map((x) => (
            <g key={x} filter="url(#r-soft)">
              <path
                d={`M${x - 16} 120 C${x - 16} 76 ${x + 16} 76 ${x + 16} 120`}
                stroke="#1f2937"
                strokeWidth={8}
                fill="none"
              />
              <rect x={x - 5} y={120} width={10} height={40} rx={3} fill="#374151" />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}
