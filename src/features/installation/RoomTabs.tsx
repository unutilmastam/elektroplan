'use client';

import { Check } from 'lucide-react';
import type { RoomProgress } from '@/domain/installation';
import type { Progress } from '@/domain/progress';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

/** Horizontal room navigator with per-room progress (scrolls on phones). */
export function RoomTabs({
  rooms,
  total,
  value,
  onChange,
}: {
  rooms: RoomProgress[];
  total: Progress;
  value: string | null;
  onChange: (roomId: string | null) => void;
}) {
  const chip = (id: string | null, label: string, p: Progress) => (
    <button
      key={id ?? 'all'}
      type="button"
      role="tab"
      aria-selected={value === id}
      onClick={() => onChange(id)}
      className={cn(
        'flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[15px] whitespace-nowrap',
        value === id
          ? 'border-primary-hi/60 bg-primary text-white'
          : 'border-white/10 bg-[#0d1527] text-text',
      )}
    >
      {p.ready ? (
        <Check size={16} className={value === id ? 'text-white' : 'text-success'} aria-hidden />
      ) : null}
      {label}
      <span className={cn('tabular text-[13px]', value === id ? 'text-white/85' : 'text-text-muted')}>
        {p.completed}
        {uz.install.of}
        {p.total}
      </span>
    </button>
  );
  return (
    <div
      role="tablist"
      aria-label={uz.install.rooms}
      className="no-scrollbar -mx-1 flex shrink-0 gap-2 overflow-x-auto px-1"
    >
      {chip(null, uz.install.allRooms, total)}
      {rooms.map((r) => chip(r.room.id, r.room.name, r))}
    </div>
  );
}
