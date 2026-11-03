'use client';

import { Check, Undo, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { getActiveTool } from '../tools/registry';

/** On-screen Enter / Backspace / Escape while drawing a freeform room (touch devices have no keyboard). */
export function PolygonActions() {
  const draft = useEditorStore((s) => s.draft);
  if (draft?.kind !== 'polygon') return null;
  const send = (k: 'Enter' | 'Backspace' | 'Escape') => getActiveTool()?.onKey?.(k);
  return (
    <div
      className="glass absolute top-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 p-1.5 whitespace-nowrap"
      style={{ background: 'rgba(14,22,40,0.94)' }}
    >
      <span className="hidden px-2 text-[13px] text-text-muted xl:inline">{uz.tools.polygonHint}</span>
      <Button size="sm" variant="primary" disabled={!draft.closable} onClick={() => send('Enter')}>
        <Check size={16} aria-hidden />
        {uz.tools.finish}
      </Button>
      <Button size="sm" onClick={() => send('Backspace')} aria-label={uz.tools.removeLast}>
        <Undo size={16} aria-hidden />
        <span className="hidden lg:inline">{uz.tools.removeLast}</span>
      </Button>
      <Button size="sm" onClick={() => send('Escape')} aria-label={uz.tools.cancel}>
        <X size={16} aria-hidden />
        <span className="hidden sm:inline">{uz.tools.cancel}</span>
      </Button>
    </div>
  );
}
