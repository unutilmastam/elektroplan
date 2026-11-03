'use client';

import { Ellipsis } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { AnchoredMenu } from '@/components/common/AnchoredMenu';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { SYMBOL_MORE } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { SymbolChip } from './SymbolChip';

/** "Boshqa" chip: opens a menu with the remaining symbols. */
export function MoreSymbolsMenu() {
  const active = useEditorStore((s) => s.activeSymbolId);
  const setActive = useEditorStore((s) => s.setActiveSymbol);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <SymbolChip
        ref={btnRef}
        active={SYMBOL_MORE.includes(active)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        label={uz.symbols.more}
        icon={<Ellipsis size={22} strokeWidth={2.6} aria-hidden />}
      />
      <AnchoredMenu anchorRef={btnRef} open={open} onClose={close} width={260} label={uz.symbols.more}>
        {SYMBOL_MORE.map((id) => (
          <button
            key={id}
            type="button"
            role="menuitemradio"
            aria-checked={active === id}
            onClick={() => {
              setActive(id);
              close();
            }}
            className="flex h-11 items-center gap-3 rounded-lg px-2.5 text-left text-[15px] hover:bg-white/[0.06] aria-checked:bg-primary/25"
          >
            <SymbolIcon id={id} size={26} />
            {uz.symbols[id]}
          </button>
        ))}
      </AnchoredMenu>
    </>
  );
}
