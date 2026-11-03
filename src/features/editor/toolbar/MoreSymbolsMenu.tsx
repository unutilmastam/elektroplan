'use client';

import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { SYMBOL_MORE } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { SymbolChip } from './SymbolChip';

/** "Boshqa" chip: opens a menu with the remaining symbols. */
export function MoreSymbolsMenu() {
  const active = useEditorStore((s) => s.activeSymbolId);
  const setActive = useEditorStore((s) => s.setActiveSymbol);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setPos(null);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null);
    const dismiss = () => setPos(null);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  const toggle = () => {
    if (open) return setPos(null);
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - 268)), top: r.bottom + 6 });
  };

  return (
    <>
      <SymbolChip
        ref={btnRef}
        active={SYMBOL_MORE.includes(active)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        label={uz.symbols.more}
        icon={<Ellipsis size={22} strokeWidth={2.6} aria-hidden />}
      />
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="glass fixed z-50 flex w-[260px] flex-col gap-1 p-2"
              style={{ left: pos.left, top: pos.top }}
            >
              {SYMBOL_MORE.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active === id}
                  onClick={() => {
                    setActive(id);
                    setPos(null);
                  }}
                  className="flex h-11 items-center gap-3 rounded-lg px-2.5 text-left text-[15px] hover:bg-white/[0.06] aria-checked:bg-primary/25"
                >
                  <SymbolIcon id={id} size={26} />
                  {uz.symbols[id]}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
