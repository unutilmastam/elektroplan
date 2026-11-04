'use client';

import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { roomWallIds, selectWallElevation } from '@/domain/selectors';
import { countOf } from '@/i18n/plural';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { useCurrentProject } from '@/store/projectStore';
import { WallElevationDrawing } from './WallElevation';
import { WallViewFullscreen } from './WallViewFullscreen';

const iconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.07] hover:text-text disabled:opacity-40';

/** Header controls shared by the panel and the full-screen view: prev / next wall and the point count. */
export function useWallView() {
  const project = useCurrentProject();
  const wallId = useEditorStore((s) => s.selectedWallId);
  const roomId = useEditorStore((s) => s.selectedRoomId);
  const pointId = useEditorStore((s) => s.selectedPointId);
  // a wall inside one room has two faces: show the face of the selected point
  const point =
    project && pointId ? project.points.find((p) => p.id === pointId && p.wallId === wallId) : undefined;
  const elevation =
    project && wallId ? selectWallElevation(project, wallId, roomId ?? undefined, point?.side) : null;
  const walls = project && elevation?.room ? roomWallIds(project, elevation.room.id) : [];
  const step = (dir: 1 | -1) => {
    if (!walls.length || !wallId) return;
    const i = walls.indexOf(wallId);
    const next = walls[(i + dir + walls.length) % walls.length]!;
    useEditorStore
      .getState()
      .setFocus(
        { wallId: next, pointId: null },
        elevation?.room ? [{ kind: 'room', id: elevation.room.id }] : undefined,
      );
  };
  const place =
    elevation?.room && elevation.direction
      ? `${elevation.room.name} – ${uz.wallView.directions[elevation.direction]}`
      : '';
  // a named wall ("TV devori") shows its name first
  const subtitle = elevation?.wall.name
    ? place
      ? `${elevation.wall.name} · ${place}`
      : elevation.wall.name
    : place;
  return { elevation, subtitle, step, canStep: walls.length > 1 };
}

export function WallSwitcher({ step, canStep }: { step: (d: 1 | -1) => void; canStep: boolean }) {
  return (
    <>
      <button
        type="button"
        className={iconBtn}
        aria-label={uz.wallView.prev}
        disabled={!canStep}
        onClick={() => step(-1)}
      >
        <ChevronLeft size={18} aria-hidden />
      </button>
      <button
        type="button"
        className={iconBtn}
        aria-label={uz.wallView.next}
        disabled={!canStep}
        onClick={() => step(1)}
      >
        <ChevronRight size={18} aria-hidden />
      </button>
    </>
  );
}

/** "Devor ko'rinishi (Xona – Yo'nalish devori)" panel. */
export function WallViewPanel({ showTitle = true }: { showTitle?: boolean }) {
  const { elevation, subtitle, step, canStep } = useWallView();
  const [full, setFull] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 px-4 pt-2.5 pb-1 lg:pt-3.5 lg:pb-1.5">
        {showTitle ? (
          <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold lg:text-[17px]">
            {uz.wallView.title}
            {subtitle ? <span className="font-normal"> ({subtitle})</span> : null}
          </h2>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[15px] text-text-muted">{subtitle}</span>
        )}
        {elevation ? (
          <>
            <WallSwitcher step={step} canStep={canStep} />
            <button
              type="button"
              className={iconBtn}
              aria-label={uz.wallView.fullscreen}
              onClick={() => setFull(true)}
            >
              <Maximize2 size={17} aria-hidden />
            </button>
            <span className="tabular ml-1 shrink-0 rounded-full bg-primary/25 px-3.5 py-1 text-[14px] text-text">
              {countOf(elevation.points.length, uz.wallView.points)}
            </span>
          </>
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
      {full ? <WallViewFullscreen onClose={() => setFull(false)} /> : null}
    </div>
  );
}
