'use client';

import Konva from 'konva';
import { useEffect } from 'react';
import { Group, Layer, Rect, Stage } from 'react-konva';
import type { SymbolId } from '@/domain/types';
import { POINT_BADGE } from '@/features/editor/canvas/decoration';
import { PointGlyph } from '@/features/points/PointGlyph';
import { SYMBOLS } from '../catalog';

export const ZOOMS = [0.5, 1, 2, 4] as const;
const CELL_W = 140;
const ROW_H = 120;

/**
 * The real plan renderer (Konva PointGlyph) at 50%–400% zoom, so sharpness can be checked
 * on every device (pixelRatio = devicePixelRatio).
 */
export default function ZoomStrip({ ids }: { ids: SymbolId[] }) {
  useEffect(() => {
    Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  }, []);
  return (
    <Stage width={CELL_W * ZOOMS.length} height={ROW_H * ids.length} listening={false}>
      <Layer listening={false}>
        {ids.map((id, r) =>
          ZOOMS.map((z, c) => {
            const cx = c * CELL_W + CELL_W / 2;
            const cy = r * ROW_H + ROW_H / 2;
            return (
              <Group key={`${id}-${z}`}>
                <Rect
                  x={c * CELL_W + 4}
                  y={r * ROW_H + 4}
                  width={CELL_W - 8}
                  height={ROW_H - 8}
                  cornerRadius={10}
                  fill="#0b1322"
                  stroke="rgba(120,150,210,0.14)"
                />
                <PointGlyph
                  point={{ x: cx, y: cy, symbolId: id, color: SYMBOLS[id].defaultColor }}
                  size={POINT_BADGE * z}
                  rotation={0}
                />
              </Group>
            );
          }),
        )}
      </Layer>
    </Stage>
  );
}
