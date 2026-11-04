import type { Report } from '@/domain/report';
import type { PointStatus } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { INK, MARGIN, type Canvas } from '../kit';
import { drawNumber, drawSymbol } from '../symbol';

const STATUS: Record<PointStatus, string> = {
  get pending() {
    return uz.status.pending;
  },
  get in_progress() {
    return uz.status.inProgress;
  },
  get completed() {
    return uz.status.done;
  },
};

/** Legend: every symbol used in the project + what the number colours mean. */
export function drawLegend(c: Canvas, r: Report, top: number) {
  let y = top;
  c.text(uz.pdf.legend, MARGIN, y, { size: 16, font: c.fonts.bold });
  y += 30;
  const colW = (c.w - MARGIN * 2) / 2;
  r.legend.forEach((id, i) => {
    const x = MARGIN + (i % 2) * colW;
    const yy = y + Math.floor(i / 2) * 30;
    drawSymbol(c, id, x + 11, yy + 10, 20);
    c.text(uz.symbols[id], x + 30, yy + 4, { size: 11 });
  });
  y += Math.ceil(r.legend.length / 2) * 30 + 20;
  c.text(uz.pdf.statusLegend, MARGIN, y, { size: 12, font: c.fonts.semibold });
  y += 22;
  (['pending', 'in_progress', 'completed'] as PointStatus[]).forEach((s, i) => {
    const x = MARGIN + i * 150;
    drawNumber(c, i + 1, x + 7, y + 7, s, 7);
    c.text(STATUS[s], x + 20, y + 1, { size: 11 });
  });
  return y + 30;
}

export function drawFooter(c: Canvas, project: string, n: number, total: number) {
  c.line(MARGIN, c.h - MARGIN + 8, c.w - MARGIN, c.h - MARGIN + 8, { width: 0.5 });
  c.text(`${uz.pdf.footer} · ${project}`, MARGIN, c.h - MARGIN + 13, {
    size: 8,
    color: INK.muted,
    maxWidth: c.w / 2,
  });
  c.text(`${n} ${uz.pdf.of} ${total}`, c.w - MARGIN, c.h - MARGIN + 13, {
    size: 8,
    color: INK.muted,
    align: 'right',
  });
}
