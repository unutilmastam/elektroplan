import { describe, expect, it } from 'vitest';
import { buildReport, pdfFileName, reportDate } from '@/domain/report';
import { buildDemoProject } from '@/features/dashboard/demoProject';

describe('report model', () => {
  const r = buildReport(buildDemoProject(), '03.11.2026');
  it('numbers every point once, 1…N, in work order', () => {
    expect([...r.numbers.values()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
    const rows = r.rooms.flatMap((x) => x.rows.map((y) => y.no));
    expect(rows).toEqual([...rows].sort((a, b) => a - b));
  });
  it('groups the table by room with room progress', () => {
    expect(r.rooms.map((x) => x.room.name)).toEqual([
      'Zal',
      'Yotoqxona',
      'Oshxona',
      'Vanna',
      'Balkon',
      'Koridor',
    ]);
    expect(r.rooms[0]!.progress).toMatchObject({ total: 7, completed: 7 });
    expect(r.progress.percent).toBe(70);
    expect(r.rooms[0]!.rows.find((x) => x.point.wallId)!.direction).not.toBeNull();
  });
  it('one elevation per wall that has points, per room side', () => {
    expect(r.walls.length).toBeGreaterThan(5);
    expect(r.walls.every((w) => w.elevation.points.length > 0)).toBe(true);
    const total = r.walls.reduce((n, w) => n + w.elevation.points.length, 0);
    expect(total).toBe(r.project.points.filter((p) => p.wallId !== null).length);
  });
  it('legend lists only used symbols', () => {
    expect(r.legend).toContain('tv');
    expect(r.legend).not.toContain('switch-double');
  });
  it('dates and file names', () => {
    expect(reportDate(new Date(2026, 10, 3))).toBe('03.11.2026');
    expect(pdfFileName('Chilonzor, 3 xonali / O‘rikzor')).toBe('Chilonzor,_3_xonali_Orikzor_elektroplan.pdf');
    expect(pdfFileName('   ')).toBe('loyiha_elektroplan.pdf');
  });
});
