import { pdfFileName, reportDate } from '@/domain/report';
import type { Project } from '@/domain/types';
import { saveFile, type SaveFileResult } from '@/lib/saveFile';
import type { FontBytes } from './buildPdf';

let fontCache: Promise<FontBytes> | null = null;

/** Bundled Inter files (public/fonts) — cached by the browser / service worker, so export works offline. */
function loadFonts(): Promise<FontBytes> {
  const get = (n: string) =>
    fetch(`/fonts/${n}`).then((r) => {
      if (!r.ok) throw new Error(`font ${n}: ${r.status}`);
      return r.arrayBuffer();
    });
  fontCache ??= Promise.all([get('Inter-Regular.ttf'), get('Inter-SemiBold.ttf'), get('Inter-Bold.ttf')])
    .then(([regular, semibold, bold]) => ({ regular, semibold, bold }))
    .catch((e) => {
      fontCache = null;
      throw e;
    });
  return fontCache;
}

export type ExportResult = SaveFileResult;

/** Builds the PDF in the browser and shares (touch devices) or downloads it. */
export async function exportProjectPdf(project: Project): Promise<ExportResult> {
  const [{ buildPdf }, fonts] = await Promise.all([import('./buildPdf'), loadFonts()]);
  const bytes = await buildPdf(project, fonts, reportDate(new Date()));
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  return saveFile(blob, pdfFileName(project.name), project.name);
}
