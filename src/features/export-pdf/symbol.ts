import type { PointStatus, SymbolId } from '@/domain/types';
import { SYMBOLS } from '@/features/symbols/catalog';
import { hex, INK, roundRect, type Canvas } from './kit';

export const STATUS_HEX: Record<PointStatus, string> = {
  pending: '#94a3b8',
  in_progress: '#f59e0b',
  completed: '#16a34a',
};

/** Electrical symbol (same glyph data as the app), centred at (cx, cy), `size` pt wide. */
export function drawSymbol(c: Canvas, id: SymbolId, cx: number, cy: number, size: number, color?: string) {
  const def = SYMBOLS[id];
  const col = hex(color || def.defaultColor);
  const x = cx - size / 2;
  const y = cy - size / 2;
  if (def.badge === 'outline') {
    for (const g of def.glyph) c.path(g.d, { x, y, scale: size / 24, stroke: col, width: 1.8, round: true });
    return;
  }
  c.path(roundRect(x, y, size, size, size * 0.22), { fill: col });
  const pad = size * 0.16;
  const k = (size - pad * 2) / 24;
  for (const g of def.glyph) {
    if (g.mode === 'fill') c.path(g.d, { x: x + pad, y: y + pad, scale: k, fill: INK.white });
    else c.path(g.d, { x: x + pad, y: y + pad, scale: k, stroke: INK.white, width: 1.9, round: true });
  }
}

/** Point number in a small status-coloured circle. */
export function drawNumber(c: Canvas, no: number, cx: number, cy: number, status: PointStatus, r = 5.5) {
  c.circle(cx, cy, r, { fill: hex(STATUS_HEX[status]), stroke: INK.white, width: 0.8 });
  c.text(String(no), cx, cy - r * 0.62, {
    size: no > 99 ? r * 1.05 : r * 1.25,
    font: c.fonts.semibold,
    color: INK.white,
    align: 'center',
  });
}
