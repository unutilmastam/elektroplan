'use client';

import type { Context } from 'konva/lib/Context';
import { Layer, Shape } from 'react-konva';
import type { Viewport } from '@/domain/geometry';

interface GridLayerProps {
  width: number;
  height: number;
  viewport: Viewport;
  gridSize: number;
}

/** Screen-space grid that follows the viewport. One Shape, not listening (cheap to redraw). */
export function GridLayer({ width, height, viewport, gridSize }: GridLayerProps) {
  const draw = (ctx: Context) => {
    let step = gridSize * viewport.scale;
    while (step < 12) step *= 2;
    const ox = ((viewport.x % step) + step) % step;
    const oy = ((viewport.y % step) + step) % step;
    ctx.beginPath();
    for (let x = ox; x <= width; x += step) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = oy; y <= height; y += step) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.setAttr('strokeStyle', 'rgba(90, 120, 180, 0.11)');
    ctx.setAttr('lineWidth', 1);
    ctx.stroke();
  };
  return (
    <Layer listening={false}>
      <Shape sceneFunc={draw} perfectDrawEnabled={false} />
    </Layer>
  );
}
