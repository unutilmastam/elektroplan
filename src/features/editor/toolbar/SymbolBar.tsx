'use client';

import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { SYMBOL_BAR, SYMBOLS } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { MoreSymbolsMenu } from './MoreSymbolsMenu';
import { SymbolChip } from './SymbolChip';

/** Top symbol bar: picking a chip sets the active symbol; the rest live behind "Boshqa". */
export function SymbolBar() {
  const active = useEditorStore((s) => s.activeSymbolId);
  const setActive = useEditorStore((s) => s.setActiveSymbol);
  return (
    <div
      role="toolbar"
      aria-label={uz.symbols.barLabel}
      className="-mx-1 flex shrink-0 items-center gap-2 px-1 py-0.5 lg:gap-2.5 xl:gap-3"
    >
      {/* the chips scroll sideways when they do not fit; "Boshqa" stays visible at the end (PHASE 20) */}
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto lg:gap-2.5 xl:gap-3">
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
      </div>
      <MoreSymbolsMenu />
    </div>
  );
}
