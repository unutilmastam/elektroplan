'use client';

import type { Fixture } from '@/domain/room3d';
import type { Project } from '@/domain/types';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import type { DragPreview } from './useFixtureDrag';

/** Texts over the 3D picture: the dragging banner, the tapped part, or a hint for what you can do. */
export function Room3DHud({
  project,
  picked,
  preview,
  dragHeight,
  adding,
  walking,
  editable,
}: {
  project: Project;
  picked: Fixture | null;
  preview: DragPreview | null;
  dragHeight: number | null;
  adding: boolean;
  walking: boolean;
  editable: boolean;
}) {
  const wallName = (id: string | null) => project.walls.find((w) => w.id === id)?.name;
  const point = picked ? project.points.find((p) => p.id === picked.pointId) : undefined;
  const room = picked ? project.rooms.find((r) => r.id === picked.roomId)?.name : undefined;
  const hint = adding
    ? uz.room3d.hintAdd
    : walking
      ? editable
        ? uz.room3d.hintWalkEdit
        : uz.room3d.hintWalk
      : editable
        ? uz.room3d.hintEdit
        : uz.room3d.hint;
  return (
    <>
      {preview ? (
        <div
          className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-[15px] font-semibold text-[#fde68a]"
          data-testid="room3d-dragging"
        >
          {preview.hit.kind === 'wall'
            ? fmt(uz.room3d.dragging, { h: dragHeight ?? 0 })
            : uz.room3d.draggingCeiling}
        </div>
      ) : null}
      {picked && !adding ? (
        <div
          className="glass absolute right-3 bottom-3 left-3 z-10 flex flex-col gap-0.5 p-3 sm:left-auto sm:w-[320px]"
          data-testid="room3d-picked"
        >
          <span className="text-[15px] font-semibold">{uz.symbols[picked.symbolId]}</span>
          <span className="text-[13.5px] text-text-muted">
            {picked.wallId === null
              ? uz.room3d.ceiling
              : fmt(uz.room3d.height, { h: Math.round(picked.c[1]) })}
            {wallName(picked.wallId) ? ` · ${fmt(uz.room3d.wall, { name: wallName(picked.wallId)! })}` : ''}
            {room ? ` · ${room}` : ''}
          </span>
          {point?.description ? <span className="text-[13.5px]">{point.description}</span> : null}
        </div>
      ) : (
        <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex justify-center max-sm:left-40">
          <p
            className="w-fit max-w-[720px] rounded-xl bg-black/50 px-3 py-1.5 text-center text-[12.5px] text-white/85 backdrop-blur-sm"
            data-testid="room3d-hint"
          >
            {hint}
          </p>
        </div>
      )}
    </>
  );
}
