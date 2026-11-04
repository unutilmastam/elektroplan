import { elevationLayout, toX, toY } from '@/domain/elevation';
import type { Report, ReportWall } from '@/domain/report';
import { countOf } from '@/i18n/plural';
import { uz } from '@/i18n/uz';
import { hex, INK, MARGIN, type Canvas } from '../kit';
import { drawNumber, drawSymbol } from '../symbol';

const PER_PAGE = 3;

function drawWall(c: Canvas, w: ReportWall, x: number, y: number, width: number, height: number) {
  const e = w.elevation;
  const place = `${e.room?.name ?? ''}${e.direction ? ` – ${uz.wallView.directions[e.direction]}` : ''}`;
  const title = e.wall.name ? `${e.wall.name}${place ? ` · ${place}` : ''}` : place;
  c.text(title, x, y, { size: 11.5, font: c.fonts.semibold });
  c.text(countOf(e.points.length, uz.wallView.points), x + width, y + 1, {
    size: 9.5,
    color: INK.muted,
    align: 'right',
  });
  const top = y + 20;
  const l = elevationLayout(e, width, height - 20);
  const X = (v: number) => x + v;
  const Y = (v: number) => top + v;
  c.rect(X(l.x0), Y(l.y0), l.x1 - l.x0, l.y1 - l.y0, { fill: INK.face });
  c.line(X(l.x0), Y(l.y1), X(l.x1), Y(l.y1), { width: 1.5, color: INK.primary });
  const labels: Array<{ d: number; px: number }> = [];
  for (const d of Array.from(new Set(e.points.map((p) => Math.round(p.distance)))).sort((a, b) => a - b)) {
    const prev = labels[labels.length - 1];
    labels.push({ d, px: prev && toX(l, d) - prev.px < 44 ? prev.px + 44 : toX(l, d) });
  }
  for (const { d, px } of labels)
    c.text(`${d} ${uz.point.cm}`, X(px), Y(l.y1) + 6, { size: 8.5, align: 'center' });
  const badge = Math.min(16, l.badge);
  for (const { point, distance, height: h } of e.points) {
    const px = X(toX(l, distance));
    const py = Y(toY(l, h));
    c.line(px, py + badge / 2, px, Y(l.y1), { width: 0.6, color: INK.primary, dash: [2, 2] });
    drawSymbol(c, point.symbolId, px, py, badge, point.color);
    c.text(`${Math.round(h)}`, px + badge / 2 + 3, py - 4, { size: 7.5, color: INK.muted });
    const no = w.numbers.get(point.id);
    if (no) drawNumber(c, no, px - badge * 0.6, py - badge * 0.6, point.status, 5);
  }
  if (l.maxHeight > 0) {
    const rx = X(l.x1) + 16;
    c.line(rx, Y(l.y1), rx, Y(toY(l, l.maxHeight)), { width: 0.8, color: hex('#64748b') });
    c.text(`${l.maxHeight} ${uz.point.cm}`, rx + 5, (Y(l.y1) + Y(toY(l, l.maxHeight))) / 2 - 4, {
      size: 8.5,
    });
  }
}

/** Wall elevations, three per A4 landscape page. */
export function drawWallPages(r: Report, newPage: () => Canvas) {
  for (let i = 0; i < r.walls.length; i += PER_PAGE) {
    const c = newPage();
    c.text(uz.pdf.walls, MARGIN, MARGIN, { size: 16, font: c.fonts.bold });
    const slot = (c.h - MARGIN * 2 - 40) / PER_PAGE;
    r.walls
      .slice(i, i + PER_PAGE)
      .forEach((w, k) => drawWall(c, w, MARGIN, MARGIN + 34 + k * slot, c.w - MARGIN * 2, slot - 14));
  }
}
