'use client';

import type { SymbolId } from '@/domain/types';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

/** What can be put on a wall / the ceiling straight from the 3D view. */
export const PALETTE_3D: SymbolId[] = [
  'socket-single',
  'socket-double',
  'socket-triple',
  'switch-single',
  'switch-double',
  'internet',
  'ceiling-light',
];

/** PHASE 25 — pick a socket / switch / lamp, then tap the wall (or ceiling) where it goes. Tap again: off. */
export function Room3DPalette({
  active,
  onPick,
}: {
  active: SymbolId | null;
  onPick: (s: SymbolId | null) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label={uz.room3d.add}
      data-testid="room3d-palette"
      className="no-scrollbar absolute top-3 right-3 z-10 flex max-h-[calc(100%-120px)] flex-col gap-1 overflow-y-auto rounded-2xl border border-white/12 bg-black/45 p-1.5 backdrop-blur-md"
    >
      {PALETTE_3D.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={active === id}
          aria-label={uz.symbols[id]}
          title={uz.symbols[id]}
          data-testid={`room3d-add-${id}`}
          onClick={() => onPick(active === id ? null : id)}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
            active === id ? 'bg-primary ring-2 ring-white/70' : 'hover:bg-white/10',
          )}
        >
          <SymbolIcon id={id} size={28} />
        </button>
      ))}
    </div>
  );
}
