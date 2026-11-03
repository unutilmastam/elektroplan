'use client';

import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { SYMBOL_BAR, SYMBOLS } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { MoreSymbolsMenu } from './MoreSymbolsMenu';
import { SymbolChip } from './SymbolChip';

/** Top symbol bar. Picking a chip sets the active symbol (placement on the plan arrives in Phase 6). */
export function SymbolBar() {
  const active = useEditorStore((s) => s.activeSymbolId);
  const setActive = useEditorStore((s) => s.setActiveSymbol);
  return (
    <div
      role="toolbar"
      aria-label={uz.symbols.barLabel}
      className="no-scrollbar -mx-1 flex shrink-0 items-center gap-2 overflow-x-auto px-1 py-0.5 lg:gap-2.5 xl:gap-3"
    >
      {SYMBOL_BAR.map((id) => (
        <SymbolChip
          key={id}
          active={active === id}
          onClick={() => setActive(id)}
          label={uz.symbols[id]}
          icon={
            <SymbolIcon
              id={id}
              variant="glyph"
              size={24}
              glyphColor={
                SYMBOLS[id].category === 'lighting' && active !== id ? SYMBOLS[id].defaultColor : undefined
              }
            />
          }
        />
      ))}
      <MoreSymbolsMenu />
    </div>
  );
}
