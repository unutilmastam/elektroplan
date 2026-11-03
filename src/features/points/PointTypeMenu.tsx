'use client';

import { ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { AnchoredMenu } from '@/components/common/AnchoredMenu';
import type { ElectricalPoint } from '@/domain/types';
import { updatePoint } from '@/features/editor/actions';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { SYMBOL_IDS } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';

/** Big symbol + name in the panel; tapping it changes the symbol type. */
export function PointTypeMenu({ point }: { point: ElectricalPoint }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={uz.point.changeType}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mx-1 flex w-full items-center gap-4 rounded-xl px-1 py-1 text-left hover:bg-white/[0.04]"
      >
        <SymbolIcon
          id={point.symbolId}
          size={58}
          color={point.color}
          className="h-12 w-12 drop-shadow-[0_0_12px_rgba(59,139,255,0.35)] lg:h-[58px] lg:w-[58px]"
        />
        <span className="min-w-0 flex-1 truncate text-[18px] font-medium lg:text-[20px]">
          {uz.symbols[point.symbolId]}
        </span>
        <ChevronDown size={18} className="text-text-muted" aria-hidden />
      </button>
      <AnchoredMenu anchorRef={ref} open={open} onClose={close} width={270} label={uz.point.type}>
        {SYMBOL_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="menuitemradio"
            aria-checked={point.symbolId === id}
            onClick={() => {
              updatePoint(point.id, { symbolId: id }, 'type');
              close();
            }}
            className="flex h-10 items-center gap-3 rounded-lg px-2.5 text-left text-[15px] hover:bg-white/[0.06] aria-checked:bg-primary/25"
          >
            <SymbolIcon id={id} size={24} />
            {uz.symbols[id]}
          </button>
        ))}
      </AnchoredMenu>
    </>
  );
}
