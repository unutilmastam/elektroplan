'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';

/** Header "Eksport PDF": saves pending edits, builds the PDF on the device, downloads / shares it. */
export function ExportPdfButton({ disabled, className }: { disabled: boolean; className?: string }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    const store = useProjectStore.getState();
    const project = selectCurrentProject(store);
    if (!project || busy) return;
    setBusy(true);
    try {
      await store.flush();
      const { exportProjectPdf } = await import('./exportPdf');
      const r = await exportProjectPdf(selectCurrentProject(useProjectStore.getState()) ?? project);
      if (r !== 'cancelled') useUiStore.getState().notify(uz.pdf.ready);
    } catch {
      useUiStore.getState().notify(uz.pdf.failed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      disabled={disabled || busy}
      onClick={() => void run()}
      aria-label={uz.pdf.export}
      aria-busy={busy}
      className={className}
    >
      {busy ? <Loader2 size={22} className="animate-spin" aria-hidden /> : <FileDown size={22} aria-hidden />}
      <span className="hidden md:inline">{busy ? uz.pdf.preparing : uz.pdf.export}</span>
    </Button>
  );
}
