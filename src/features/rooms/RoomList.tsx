'use client';

import { Eye, House, List } from 'lucide-react';
import { NextPhase } from '@/components/common/Hint';
import { selectRoomStats } from '@/domain/selectors';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';
import { useCurrentProject } from '@/store/projectStore';

const ICON_COLORS = ['#ffffff', '#22c55e', '#f59e0b', '#14b8a6', '#3b8bff', '#a78bfa'];

/** "Xonalar ro'yxati". Tapping a room selects it and shows its busiest wall in the wall view. */
export function RoomList({ showTitle = true }: { showTitle?: boolean }) {
  const project = useCurrentProject();
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const select = useEditorStore((s) => s.select);
  const stats = project ? selectRoomStats(project) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showTitle ? (
        <div className="flex items-center gap-3 px-4 pt-3 pb-2 lg:pt-4 lg:pb-2.5">
          <List size={22} aria-hidden />
          <h2 className="text-[16px] font-semibold lg:text-[17px]">{uz.rooms.title}</h2>
        </div>
      ) : null}
      {stats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[14px] text-text-muted">
          {uz.rooms.empty}
        </div>
      ) : (
        <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
          {stats.map(({ room, pointCount }, i) => {
            const active = room.id === selectedRoomId;
            return (
              <li
                key={room.id}
                className={cn(
                  'flex items-center rounded-[10px]',
                  active ? 'bg-primary/85 shadow-[0_0_16px_rgba(31,111,255,0.35)]' : 'hover:bg-white/[0.04]',
                )}
              >
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => project && select(project, [{ kind: 'room', id: room.id }])}
                  className="flex h-[38px] min-w-0 flex-1 items-center gap-3 pl-2.5 text-left text-[15px] lg:h-[38px]"
                >
                  <House
                    size={21}
                    fill={active ? '#3b8bff' : ICON_COLORS[i % ICON_COLORS.length]}
                    className={active ? 'text-white' : 'text-[#0b1322]'}
                    strokeWidth={1.6}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{room.name}</span>
                  <span
                    className={cn(
                      'tabular shrink-0 text-[14px]',
                      active ? 'text-white/90' : 'text-text-muted',
                    )}
                  >
                    {pointCount} {uz.rooms.points}
                  </span>
                </button>
                <NextPhase className="flex shrink-0">
                  <button
                    type="button"
                    disabled
                    aria-label={uz.rooms.focus}
                    className={cn(
                      'flex h-[38px] w-11 items-center justify-center disabled:cursor-not-allowed',
                      active ? 'text-white' : 'text-text-muted',
                    )}
                  >
                    <Eye size={20} aria-hidden />
                  </button>
                </NextPhase>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
