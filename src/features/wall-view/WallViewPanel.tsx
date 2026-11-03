'use client';

import { selectWallElevation } from '@/domain/selectors';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { useCurrentProject } from '@/store/projectStore';
import { WallElevationDrawing } from './WallElevation';

/** "Devor ko'rinishi (Xona – Yo'nalish devori)" panel content. */
export function WallViewPanel({ showTitle = true }: { showTitle?: boolean }) {
  const project = useCurrentProject();
  const wallId = useEditorStore((s) => s.selectedWallId);
  const roomId = useEditorStore((s) => s.selectedRoomId);
  const elevation = project && wallId ? selectWallElevation(project, wallId, roomId ?? undefined) : null;
  const subtitle =
    elevation?.room && elevation.direction
      ? ` (${elevation.room.name} – ${uz.wallView.directions[elevation.direction]})`
      : '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1.5 lg:pt-4 lg:pb-2">
        {showTitle ? (
          <h2 className="truncate text-[16px] font-semibold lg:text-[17px]">
            {uz.wallView.title}
            <span className="font-normal">{subtitle}</span>
          </h2>
        ) : (
          <span className="truncate text-[15px] text-text-muted">
            {subtitle.trim().replace(/^\(|\)$/g, '')}
          </span>
        )}
        {elevation ? (
          <span className="tabular shrink-0 rounded-full bg-primary/25 px-3.5 py-1 text-[14px] text-text">
            {elevation.points.length} {uz.wallView.points}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 px-3 pb-2">
        {elevation ? (
          <WallElevationDrawing elevation={elevation} />
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-text-muted">
            {uz.wallView.empty}
          </div>
        )}
      </div>
    </div>
  );
}
