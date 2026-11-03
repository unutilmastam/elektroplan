'use client';

import { Group, Path, Rect } from 'react-konva';
import type { ElectricalPoint } from '@/domain/types';
import { SYMBOLS } from '@/features/symbols/catalog';

interface PointGlyphProps {
  point: ElectricalPoint;
  /** badge edge in world units */
  size: number;
  rotation: number;
}

/** Konva rendering of an electrical point, from the same glyph data as SymbolIcon. */
export function PointGlyph({ point, size, rotation }: PointGlyphProps) {
  const def = SYMBOLS[point.symbolId];
  const color = point.color || def.defaultColor;
  if (def.badge === 'outline') {
    const s = size * 1.3;
    return (
      <Group x={point.x} y={point.y} listening={false}>
        <Group x={-s / 2} y={-s / 2} scaleX={s / 24} scaleY={s / 24}>
          {def.glyph.map((g, i) => (
            <Path
              key={i}
              data={g.d}
              stroke={color}
              strokeWidth={1.9}
              lineCap="round"
              shadowColor={color}
              shadowBlur={6}
              shadowOpacity={0.35}
            />
          ))}
        </Group>
      </Group>
    );
  }
  const pad = size * 0.16;
  const inner = size - pad * 2;
  return (
    <Group x={point.x} y={point.y} rotation={rotation} listening={false}>
      <Rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        cornerRadius={size * 0.22}
        fill={color}
        opacity={0.92}
        stroke={color}
        strokeWidth={1.2}
        shadowColor={color}
        shadowBlur={8}
        shadowOpacity={0.45}
      />
      <Group x={-size / 2 + pad} y={-size / 2 + pad} scaleX={inner / 24} scaleY={inner / 24}>
        {def.glyph.map((g, i) =>
          g.mode === 'fill' ? (
            <Path key={i} data={g.d} fill="#ffffff" />
          ) : (
            <Path key={i} data={g.d} stroke="#ffffff" strokeWidth={2} lineCap="round" lineJoin="round" />
          ),
        )}
      </Group>
    </Group>
  );
}
