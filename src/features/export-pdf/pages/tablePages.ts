import type { Report, ReportRoom } from '@/domain/report';
import { uz } from '@/i18n/uz';
import { hex, INK, MARGIN, wrap, type Canvas } from '../kit';
import { drawNumber, drawSymbol, STATUS_HEX } from '../symbol';

const STATUS = {
  get pending() {
    return uz.status.pending;
  },
  get in_progress() {
    return uz.status.inProgress;
  },
  get completed() {
    return uz.status.done;
  },
} as const;
const COLS = [26, 120, 52, 56, 84, 68] as const; // №, belgi, devor, balandlik, chap burchakdan, holat; izoh = rest

/** Points table grouped by room; paginates. `newPage` returns a fresh portrait canvas. */
export function drawTablePages(first: Canvas, r: Report, newPage: () => Canvas) {
  let c = first;
  let y = MARGIN;
  const width = c.w - MARGIN * 2;
  const noteW = width - COLS.reduce((n, w) => n + w, 0);
  const widths = [...COLS, noteW];
  const header = () => {
    c.rect(MARGIN, y, width, 18, { fill: hex('#eef2f7') });
    const labels = [
      uz.pdf.no,
      uz.pdf.symbol,
      uz.pdf.wall,
      uz.pdf.height,
      uz.pdf.fromCorner,
      uz.pdf.status,
      uz.pdf.note,
    ];
    let x = MARGIN + 4;
    labels.forEach((label, i) => {
      c.text(label, x, y + 4.5, {
        size: 8,
        font: c.fonts.semibold,
        color: INK.muted,
        maxWidth: widths[i]! - 6,
      });
      x += widths[i]!;
    });
    y += 22;
  };
  const ensure = (h: number) => {
    if (y + h <= c.h - MARGIN - 20) return;
    c = newPage();
    y = MARGIN;
    header();
  };
  c.text(uz.pdf.table, MARGIN, y, { size: 16, font: c.fonts.bold });
  y += 30;

  const roomBlock = (room: ReportRoom) => {
    ensure(64);
    c.text(room.room.name, MARGIN, y, { size: 12, font: c.fonts.bold });
    c.text(
      `${room.progress.completed}/${room.progress.total} · ${room.progress.percent}%`,
      c.w - MARGIN,
      y + 1,
      {
        size: 9.5,
        color: INK.muted,
        align: 'right',
      },
    );
    y += 18;
    header();
    if (!room.rows.length) {
      c.text(uz.pdf.noPoints, MARGIN + 4, y, { size: 9, color: INK.muted });
      y += 18;
    }
    for (const row of room.rows) {
      const p = row.point;
      const note = wrap(p.description, c.fonts.regular, 8.5, noteW - 6).slice(0, 3);
      const h = Math.max(20, 6 + note.length * 11);
      ensure(h);
      let x = MARGIN;
      drawNumber(c, row.no, x + 12, y + 9, p.status, 6.5);
      x += COLS[0];
      drawSymbol(c, p.symbolId, x + 8, y + 9, 13, p.color);
      c.text(uz.symbols[p.symbolId], x + 19, y + 4, { size: 9, maxWidth: COLS[1] - 22 });
      x += COLS[1];
      c.text(row.direction ? uz.pdf.directionShort[row.direction] : uz.pdf.ceiling, x + 4, y + 4, {
        size: 9,
      });
      x += COLS[2];
      c.text(p.mountHeightCm !== null ? `${p.mountHeightCm} ${uz.point.cm}` : '—', x + 4, y + 4, { size: 9 });
      x += COLS[3];
      c.text(
        p.wallId && p.distanceFromCornerCm !== null ? `${p.distanceFromCornerCm} ${uz.point.cm}` : '—',
        x + 4,
        y + 4,
        {
          size: 9,
        },
      );
      x += COLS[4];
      c.circle(x + 7, y + 9, 3.5, { fill: hex(STATUS_HEX[p.status]) });
      c.text(STATUS[p.status], x + 14, y + 4, { size: 8.5, maxWidth: COLS[5] - 16 });
      x += COLS[5];
      note.forEach((ln, i) => c.text(ln, x + 4, y + 4 + i * 11, { size: 8.5, color: INK.muted }));
      y += h;
      c.line(MARGIN, y - 1, MARGIN + width, y - 1, { width: 0.4 });
    }
    y += 12;
  };
  r.rooms.forEach(roomBlock);
}
