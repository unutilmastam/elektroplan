import { boundsOf, labelAnchor, lerp, type Vec2 } from '@/domain/geometry';
import type { Report } from '@/domain/report';
import type { Wall } from '@/domain/types';
import { pointOnWall, solidIntervals } from '@/domain/walls';
import { uz } from '@/i18n/uz';
import { INK, MARGIN, type Canvas } from '../kit';
import { drawNumber, drawSymbol } from '../symbol';

/** Floor plan on A4 landscape, vector, light print theme, with point numbers. */
export function drawPlanPage(c: Canvas, r: Report) {
  const p = r.project;
  c.text(uz.pdf.plan, MARGIN, MARGIN, { size: 16, font: c.fonts.bold });
  c.text(uz.pdf.numberHint, c.w - MARGIN, MARGIN + 4, { size: 9, color: INK.muted, align: 'right' });
  const walls = p.walls.filter((w) => w.deletedAt === null);
  const rooms = p.rooms.filter((x) => x.deletedAt === null);
  const points = p.points.filter((x) => x.deletedAt === null);
  const doorTips = p.openings.flatMap((o) => {
    const w = walls.find((x) => x.id === o.wallId);
    return w && o.kind === 'door' ? [pointOnWall(w, o.t, o.swing, o.width)] : [];
  });
  const b = boundsOf([...walls.flatMap((w) => [w.a, w.b]), ...points, ...doorTips]);
  if (!b) {
    c.text(uz.pdf.noPoints, c.w / 2, c.h / 2, { size: 12, color: INK.muted, align: 'center' });
    return;
  }
  const box = { x: MARGIN, y: MARGIN + 30, w: c.w - MARGIN * 2, h: c.h - MARGIN * 2 - 50 };
  const pad = 18;
  const s = Math.min((box.w - pad * 2) / (b.maxX - b.minX || 1), (box.h - pad * 2) / (b.maxY - b.minY || 1));
  const ox = box.x + (box.w - (b.maxX - b.minX) * s) / 2 - b.minX * s;
  const oy = box.y + (box.h - (b.maxY - b.minY) * s) / 2 - b.minY * s;
  const T = (v: Vec2) => ({ x: ox + v.x * s, y: oy + v.y * s });
  const poly = (vs: Vec2[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${T(v).x} ${T(v).y}`).join('') + 'Z';

  for (const room of rooms) c.path(poly(room.vertices), { fill: INK.room });
  const wallWidth = (w: Wall) => Math.max(2, w.thickness * s);
  for (const w of walls) {
    for (const [t0, t1] of solidIntervals(w, p.openings)) {
      const a = T(lerp(w.a, w.b, t0));
      const z = T(lerp(w.a, w.b, t1));
      c.line(a.x, a.y, z.x, z.y, {
        width: wallWidth(w),
        color: INK.wall,
        cap: t0 === 0 || t1 === 1 ? 'square' : 'butt',
      });
    }
  }
  for (const o of p.openings) {
    const w = walls.find((x) => x.id === o.wallId);
    if (!w) continue;
    const len = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y) || 1;
    const h = o.width / 2 / len;
    const a = T(lerp(w.a, w.b, Math.max(0, o.t - h)));
    const z = T(lerp(w.a, w.b, Math.min(1, o.t + h)));
    if (o.kind === 'window') {
      c.line(a.x, a.y, z.x, z.y, { width: wallWidth(w) * 0.9, color: INK.white });
      c.line(a.x, a.y, z.x, z.y, { width: 0.8, color: INK.window });
      continue;
    }
    const tip = T(pointOnWall(w, Math.max(0, o.t - h), o.swing, o.width));
    const rad = Math.hypot(z.x - a.x, z.y - a.y);
    const cross = (z.x - a.x) * (tip.y - a.y) - (z.y - a.y) * (tip.x - a.x);
    c.path(`M${a.x} ${a.y}L${tip.x} ${tip.y}A${rad} ${rad} 0 0 ${cross > 0 ? 0 : 1} ${z.x} ${z.y}`, {
      stroke: INK.window,
      width: 0.8,
    });
  }
  for (const room of rooms) {
    const lc = labelAnchor(room.vertices);
    const at = T({ x: lc.x + room.labelOffset.x, y: lc.y + room.labelOffset.y });
    c.text(room.name, at.x, at.y - 6, { size: 11, font: c.fonts.semibold, align: 'center' });
  }
  const size = Math.max(9, Math.min(15, 22 * s));
  for (const pt of points) {
    const at = T(pt);
    drawSymbol(c, pt.symbolId, at.x, at.y, size, pt.color);
    const no = r.numbers.get(pt.id);
    if (no) drawNumber(c, no, at.x + size * 0.55, at.y - size * 0.55, pt.status, Math.max(4.5, size * 0.36));
  }
}
