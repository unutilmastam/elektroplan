// @vitest-environment node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { duplicateRoom } from '@/domain/rooms';
import type { Project } from '@/domain/types';
import { buildDemoProject } from '@/features/dashboard/demoProject';
import { buildPdf } from '@/features/export-pdf/buildPdf';

const font = (n: string) => readFileSync(join(process.cwd(), 'public/fonts', n));
const fonts = {
  regular: font('Inter-Regular.ttf'),
  semibold: font('Inter-SemiBold.ttf'),
  bold: font('Inter-Bold.ttf'),
};

/** Demo house doubled → 50+ points. */
function bigProject(): Project {
  let p = buildDemoProject();
  let n = 0;
  const opts = { makeId: () => `x${++n}`, now: '2026-11-03T00:00:00.000Z' };
  for (const r of [...p.rooms])
    p = duplicateRoom(p, r.id, { id: `copy-${r.id}`, name: `${r.name} 2` }, 20, opts);
  return { ...p, name: 'Chilonzor, 3 xonali — O‘rikzor ko‘chasi', customerName: 'G‘ofurov Shohruh' };
}

describe('PDF export', () => {
  it('50+ points: A4 pages, fast, Uzbek text, readable back', async () => {
    const project = bigProject();
    expect(project.points.filter((p) => p.deletedAt === null).length).toBeGreaterThanOrEqual(50);
    const t0 = performance.now();
    const bytes = await buildPdf(project, fonts, '03.11.2026');
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(process.env.COVERAGE ? 30_000 : 5000); // instrumented runs are slower
    writeFileSync(join(process.cwd(), 'test-results-demo.pdf'), bytes);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    expect(pages.length).toBeGreaterThanOrEqual(5);
    for (const p of pages) {
      const { width, height } = p.getSize();
      expect([Math.round(Math.min(width, height)), Math.round(Math.max(width, height))]).toEqual([595, 842]);
    }
    expect(doc.getTitle()).toContain('O‘rikzor');
    expect(bytes.length).toBeLessThan(2_000_000);
  }, 20000);

  it('an empty project still exports', async () => {
    const p = buildDemoProject();
    const empty = { ...p, rooms: [], walls: [], points: [], openings: [] };
    const bytes = await buildPdf(empty, fonts, '03.11.2026');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(4);
  });
});
