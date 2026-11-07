'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';

/** Shown while a symbol from the symbol bar is being placed. */
export function PlaceModeBar() {
  const tool = useEditorStore((s) => s.tool);
  const symbol = useEditorStore((s) => s.activeSymbolId);
  const setTool = useEditorStore((s) => s.setTool);
  if (tool !== 'place') return null;
  return (
    <div
      // taps go through to the plan (a wall can be right under it on a small screen); only the button catches them
      className="glass pointer-events-none absolute top-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 py-1.5 pr-1.5 pl-2.5 whitespace-nowrap"
      style={{ background: 'rgba(14,22,40,0.94)' }}
      role="status"
    >
      <SymbolIcon id={symbol} size={26} />
      <span className="text-[14px]">
        {uz.symbols[symbol]} — {uz.symbols.placing}
        <span className="hidden text-text-muted md:inline"> · {uz.symbols.placeHint}</span>
      </span>
      <Button
        size="sm"
        className="pointer-events-auto"
        onClick={() => setTool('select')}
        aria-label={uz.symbols.stopPlacing}
      >
        <X size={16} aria-hidden />
        <span className="hidden sm:inline">{uz.symbols.stopPlacing}</span>
      </Button>
    </div>
  );
}
