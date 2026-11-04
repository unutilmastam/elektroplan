import fontkit from '@pdf-lib/fontkit';
import { PDFDocument } from 'pdf-lib';
import { buildReport } from '@/domain/report';
import type { Project } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { A4, A4L, Canvas, MARGIN, type Fonts } from './kit';
import { drawCoverPage } from './pages/coverPage';
import { drawFooter, drawLegend } from './pages/legendPage';
import { drawPlanPage } from './pages/planPage';
import { drawTablePages } from './pages/tablePages';
import { drawWallPages } from './pages/wallPages';

export interface FontBytes {
  regular: ArrayBuffer | Uint8Array;
  semibold: ArrayBuffer | Uint8Array;
  bold: ArrayBuffer | Uint8Array;
}

/**
 * Project → PDF bytes (A4). Cover → plan → points by room → wall elevations → legend.
 * Fully client-side and offline (fonts are bundled files). Inter covers Uzbek Latin (oʻ gʻ ‘ ’).
 */
export async function buildPdf(project: Project, fonts: FontBytes, date: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const f: Fonts = {
    regular: await doc.embedFont(fonts.regular, { subset: false }),
    semibold: await doc.embedFont(fonts.semibold, { subset: false }),
    bold: await doc.embedFont(fonts.bold, { subset: false }),
  };
  doc.setTitle(`${project.name} — ${uz.pdf.title}`);
  doc.setAuthor(uz.app.name);
  doc.setCreator(uz.app.name);
  doc.setLanguage('uz');

  const report = buildReport(project, date);
  const portrait = () => new Canvas(doc.addPage([A4.w, A4.h]), f);
  const landscape = () => new Canvas(doc.addPage([A4L.w, A4L.h]), f);

  drawCoverPage(portrait(), report);
  drawPlanPage(landscape(), report);
  drawTablePages(portrait(), report, portrait);
  drawWallPages(report, landscape);
  drawLegend(portrait(), report, MARGIN);

  const pages = doc.getPages();
  pages.forEach((p, i) => drawFooter(new Canvas(p, f), project.name, i + 1, pages.length));
  return doc.save();
}
