'use client';

import { Group, Rect, Text } from 'react-konva';
import { formatLength, lengthCm } from '@/domain/dimensions';
import type { Vec2 } from '@/domain/geometry';
import { uz } from '@/i18n/uz';

/** Text angle along a→b, kept readable (never upside down). */
function readableAngle(a: Vec2, b: Vec2): number {
  let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return deg;
}

/**
 * PHASE 18: a wall length pill ("3,2 m") at the middle of a→b, along it (world units).
 * `size` is the font size in world units; `lift` moves it off the line (in font sizes, negative = above).
 * `hideIfShort` drops it when the wall is shorter than the pill (dense plans stay readable).
 */
export function DimensionLabel({
  a,
  b,
  size,
  fontFamily,
  lift = 0,
  hideIfShort = false,
  accent = false,
}: {
  a: Vec2;
  b: Vec2;
  size: number;
  fontFamily?: string;
  lift?: number;
  hideIfShort?: boolean;
  accent?: boolean;
}) {
  const text = formatLength(lengthCm(a, b), uz.units);
  const w = text.length * size * 0.62 + size;
  const h = size * 1.55;
  if (hideIfShort && Math.hypot(b.x - a.x, b.y - a.y) < w * 1.15) return null;
  const y = -h / 2 + lift * size;
  return (
    <Group
      x={(a.x + b.x) / 2}
      y={(a.y + b.y) / 2}
      rotation={readableAngle(a, b)}
      listening={false}
    >
      <Rect
        x={-w / 2}
        y={y}
        width={w}
        height={h}
        cornerRadius={h / 2}
        fill={accent ? '#1f6fff' : 'rgba(8,13,24,0.88)'}
        stroke={accent ? '#ffffff' : 'rgba(59,139,255,0.7)'}
        strokeWidth={size * 0.08}
        perfectDrawEnabled={false}
      />
      <Text
        x={-w / 2}
        y={y}
        width={w}
        height={h}
        align="center"
        verticalAlign="middle"
        text={text}
        fontSize={size}
        fontStyle="600"
        fontFamily={fontFamily}
        fill="#f2f5fb"
        perfectDrawEnabled={false}
      />
    </Group>
  );
}
