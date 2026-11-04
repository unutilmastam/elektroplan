import { pdfFileName, reportDate } from '@/domain/report';
import type { Project } from '@/domain/types';
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

export type ExportResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Builds the PDF in the browser and hands it to the user:
 * iPhone/iPad (and Android) → share sheet (Fayllar, Telegram…); otherwise a normal download.
 */
export async function exportProjectPdf(project: Project): Promise<ExportResult> {
  const [{ buildPdf }, fonts] = await Promise.all([import('./buildPdf'), loadFonts()]);
  const bytes = await buildPdf(project, fonts, reportDate(new Date()));
  const name = pdfFileName(project.name);
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const file = typeof File !== 'undefined' ? new File([blob], name, { type: 'application/pdf' }) : null;
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  if (touch && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: project.name });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // e.g. user activation expired while building — fall back to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}
