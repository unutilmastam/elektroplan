'use client';

import { Box, Eye, RotateCcw, X } from 'lucide-react';
import type { Room } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import type { Mode } from './camera';

/** Top bar of the 3D view: room, inside / from above, highlight, reset, close. */
export function Room3DToolbar({
  rooms,
  current,
  onRoom,
  mode,
  onMode,
  marks,
  onMarks,
  onReset,
  onClose,
}: {
  rooms: Room[];
  current: string | null;
  onRoom: (id: string) => void;
  mode: Mode;
  onMode: (m: Mode) => void;
  marks: boolean;
  onMarks: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2"
      style={{ paddingTop: 'max(8px, var(--safe-top))' }}
    >
      <Box size={22} className="text-primary-hi" aria-hidden />
      <select
        aria-label={uz.room3d.room}
        value={current ?? ''}
        onChange={(e) => onRoom(e.target.value)}
        className="h-10 min-w-0 max-w-[50vw] rounded-lg border border-white/12 bg-[#0a1222] px-2 text-[15px]"
        data-testid="room3d-room"
      >
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2 max-sm:order-2 max-sm:w-full">
        <div role="radiogroup" className="flex gap-1 rounded-xl border border-white/10 p-1">
          {(['inside', 'top'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => onMode(m)}
              className={cn(
                'h-8 rounded-lg px-3 text-[13.5px]',
                mode === m ? 'bg-primary text-white' : 'text-text-muted',
              )}
            >
              {m === 'inside' ? <Eye size={15} className="mr-1 inline" aria-hidden /> : null}
              {uz.room3d[m]}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={marks}
          onClick={onMarks}
          className={cn(
            'h-10 rounded-lg px-3 text-[13.5px]',
            marks ? 'bg-[#facc15]/20 text-[#fde68a]' : 'text-text-muted',
          )}
          data-testid="room3d-marks"
        >
          {uz.room3d.marks}
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label={uz.room3d.reset}
          title={uz.room3d.reset}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06]"
        >
          <RotateCcw size={18} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={uz.room3d.close}
        className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-text hover:bg-white/[0.08] max-sm:order-1"
        data-testid="room3d-close"
      >
        <X size={22} aria-hidden />
      </button>
    </div>
  );
}
