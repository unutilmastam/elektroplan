import type { Report } from '@/domain/report';
import { uz } from '@/i18n/uz';
import { hex, INK, MARGIN, type Canvas } from '../kit';

function ring(c: Canvas, cx: number, cy: number, r: number, percent: number) {
  c.circle(cx, cy, r, { stroke: hex('#e5e7eb'), width: 10 });
  if (percent <= 0) return;
  if (percent >= 100) {
    c.circle(cx, cy, r, { stroke: hex('#16a34a'), width: 10 });
    return;
  }
  const a = (percent / 100) * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  c.path(`M${cx} ${cy - r}A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x} ${y}`, {
    stroke: hex('#16a34a'),
    width: 10,
    round: true,
  });
}

/** Cover: brand, project, customer, address, date, installation progress, progress per room. */
export function drawCoverPage(c: Canvas, r: Report) {
  const p = r.project;
  c.rect(0, 0, c.w, 140, { fill: hex('#0b1322') });
  c.text('Elektro', MARGIN, 44, { size: 30, font: c.fonts.bold, color: INK.white });
  const w = c.fonts.bold.widthOfTextAtSize('Elektro', 30);
  c.text('Plan', MARGIN + w, 44, { size: 30, font: c.fonts.bold, color: hex('#3b8bff') });
  c.text(uz.app.subtitle, MARGIN, 84, { size: 12, color: hex('#9aa8c4') });

  c.text(uz.pdf.title, MARGIN, 180, { size: 13, color: INK.muted });
  c.text(p.name || uz.header.newProject, MARGIN, 200, {
    size: 26,
    font: c.fonts.bold,
    maxWidth: c.w - MARGIN * 2,
  });
  const rows: Array<[string, string]> = [
    [uz.pdf.customer, p.customerName || '—'],
    [uz.pdf.address, p.address || '—'],
    [uz.pdf.date, r.date],
    [uz.pdf.rooms, String(r.rooms.length)],
    [uz.pdf.points, String(r.progress.total)],
  ];
  rows.forEach(([k, v], i) => {
    const y = 260 + i * 28;
    c.text(k, MARGIN, y, { size: 12, color: INK.muted });
    c.text(v, MARGIN + 130, y, { size: 12, font: c.fonts.semibold, maxWidth: c.w - MARGIN * 2 - 130 });
    c.line(MARGIN, y + 20, c.w - MARGIN, y + 20, { width: 0.5 });
  });

  const top = 440;
  c.text(uz.pdf.progress, MARGIN, top, { size: 15, font: c.fonts.bold });
  ring(c, MARGIN + 70, top + 105, 60, r.progress.percent);
  c.text(`${r.progress.percent}%`, MARGIN + 70, top + 92, { size: 26, font: c.fonts.bold, align: 'center' });
  const stats: Array<[string, number, string]> = [
    [uz.status.completed, r.progress.completed, '#16a34a'],
    [uz.status.inProgress, r.progress.inProgress, '#f59e0b'],
    [uz.status.pending, r.progress.pending, '#94a3b8'],
    [uz.status.total, r.progress.total, '#334155'],
  ];
  stats.forEach(([k, v, col], i) => {
    const y = top + 50 + i * 26;
    c.circle(MARGIN + 175, y + 6, 4.5, { fill: hex(col) });
    c.text(k, MARGIN + 188, y, { size: 12 });
    c.text(String(v), MARGIN + 330, y, { size: 12, font: c.fonts.semibold, align: 'right' });
  });

  let y = top + 200;
  for (const room of r.rooms) {
    if (y > c.h - 80) break;
    c.text(room.room.name, MARGIN, y, { size: 11, maxWidth: 140 });
    const bx = MARGIN + 150;
    const bw = c.w - MARGIN - bx - 60;
    c.rect(bx, y + 2, bw, 8, { fill: hex('#e5e7eb') });
    if (room.progress.percent > 0)
      c.rect(bx, y + 2, (bw * room.progress.percent) / 100, 8, { fill: hex('#16a34a') });
    c.text(`${room.progress.completed}/${room.progress.total}`, c.w - MARGIN, y, {
      size: 11,
      align: 'right',
      color: INK.muted,
    });
    y += 20;
  }
}
