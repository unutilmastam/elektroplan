'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { produce } from 'immer';
import { buildRoom3D, type Fixture } from '@/domain/room3d';
import { moveFixtureRecipe } from '@/domain/room3dEdit';
import type { Project } from '@/domain/types';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { lookAt, multiply, perspective } from './mat4';
import { Room3DRenderer } from './renderer';
import { Room3DToolbar } from './Room3DToolbar';
import { START, camera, pick, viewFov, type Mode } from './camera';
import { useFixtureDrag, type DragPreview } from './useFixtureDrag';
import { useLook, type Look } from './useLook';

/** PHASE 23: full-screen 3D of a room — look around from inside or view it from above; tap a part. */
export default function Room3DView({
  project,
  roomId,
  onClose,
  editable = false,
}: {
  project: Project;
  roomId: string | null;
  onClose: () => void;
  /** PHASE 24: fixtures can be dragged to a new place */
  editable?: boolean;
}) {
  const rooms = useMemo(
    () => project.rooms.filter((r) => r.deletedAt === null).sort((a, b) => a.order - b.order),
    [project.rooms],
  );
  const [current, setCurrent] = useState(
    roomId && rooms.some((r) => r.id === roomId) ? roomId : (rooms[0]?.id ?? null),
  );
  const [mode, setMode] = useState<Mode>('inside');
  const [look, setLook] = useState<Look>(START.inside);
  const [picked, setPicked] = useState<Fixture | null>(null);
  const [noGl, setNoGl] = useState(false);
  const [marks, setMarks] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Room3DRenderer | null>(null);
  // PHASE 24: while a fixture is dragged, the room shows where it would go
  const [preview, setPreview] = useState<DragPreview | null>(null);
  const shown = useMemo(
    () =>
      preview
        ? produce(
            project,
            moveFixtureRecipe(project, preview.pointId, preview.hit, preview.size, new Date().toISOString()),
          )
        : project,
    [project, preview],
  );
  const room = useMemo(() => (current ? buildRoom3D(shown, current) : null), [shown, current]);
  const lookRef = useRef(look);
  lookRef.current = look;

  const draw = useCallback(() => {
    const c = canvas.current;
    const r = renderer.current;
    if (!c || !r || !room) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(c.clientWidth * dpr);
    const h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const cam = camera(room, mode, lookRef.current);
    r.render(
      multiply(
        perspective(viewFov(cam.fov, w / Math.max(1, h)), w / Math.max(1, h), 4, 8000),
        lookAt(cam.eye, cam.target),
      ),
      w,
      h,
      mode === 'inside',
      marks,
    );
  }, [room, mode, marks]);

  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = Room3DRenderer.create(canvas.current);
    if (!renderer.current) setNoGl(true);
    return () => renderer.current?.dispose();
  }, []);
  useEffect(() => {
    if (room && renderer.current) renderer.current.setRoom(room);
  }, [room]);
  useEffect(() => setPicked(null), [current]);
  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw, look, room]);
  useEffect(() => {
    const ro = new ResizeObserver(() => requestAnimationFrame(draw));
    if (canvas.current) ro.observe(canvas.current);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', esc);
    };
  }, [draw, onClose]);

  const handlers = useLook(
    () => lookRef.current,
    setLook,
    (x, y) => {
      const c = canvas.current;
      if (!room || !c) return;
      const cam = camera(room, mode, lookRef.current);
      const fov = viewFov(cam.fov, c.clientWidth / Math.max(1, c.clientHeight));
      setPicked(pick(room, { ...cam, fov }, x, y, c.clientWidth, c.clientHeight));
    },
    mode === 'inside' ? [35, 110] : [0.9, 5],
  );
  const pointer = useFixtureDrag({
    editable,
    room,
    roomId: current,
    project,
    preview,
    setPreview,
    setPicked,
    camera: () => {
      const c = canvas.current!;
      const cam = camera(room!, mode, lookRef.current);
      return { ...cam, fov: viewFov(cam.fov, c.clientWidth / Math.max(1, c.clientHeight)) };
    },
    look: handlers,
  });
  const dragHeight =
    preview?.hit.kind === 'wall'
      ? Math.round(room?.fixtures.find((f) => f.pointId === preview.pointId)?.c[1] ?? 0)
      : null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setLook(START[m]);
  };
  const wallName = (id: string | null) => project.walls.find((w) => w.id === id)?.name;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[#14171c]"
      role="dialog"
      aria-modal="true"
      aria-label={uz.room3d.open}
      data-testid="room3d"
    >
      <Room3DToolbar
        rooms={rooms}
        current={current}
        onRoom={setCurrent}
        mode={mode}
        onMode={switchMode}
        marks={marks}
        onMarks={() => setMarks((m) => !m)}
        onReset={() => setLook(START[mode])}
        onClose={onClose}
      />
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full touch-none"
          data-testid="room3d-canvas"
          data-yaw={look.yaw.toFixed(1)}
          {...pointer}
        />
        {noGl || !room ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-text-muted">
            {noGl ? uz.room3d.noWebgl : uz.room3d.noRoom}
          </p>
        ) : null}
        {preview ? (
          <div
            className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-[15px] font-semibold text-[#fde68a]"
            data-testid="room3d-dragging"
          >
            {preview.hit.kind === 'wall'
              ? fmt(uz.room3d.dragging, { h: dragHeight ?? 0 })
              : uz.room3d.draggingCeiling}
          </div>
        ) : null}
        {picked ? (
          <div
            className="glass absolute right-3 bottom-3 left-3 flex flex-col gap-0.5 p-3 sm:left-auto sm:w-[320px]"
            data-testid="room3d-picked"
          >
            <span className="text-[15px] font-semibold">{uz.symbols[picked.symbolId]}</span>
            <span className="text-[13.5px] text-text-muted">
              {picked.wallId === null
                ? uz.room3d.ceiling
                : fmt(uz.room3d.height, { h: Math.round(picked.c[1]) })}
              {wallName(picked.wallId) ? ` · ${fmt(uz.room3d.wall, { name: wallName(picked.wallId)! })}` : ''}
            </span>
            {project.points.find((p) => p.id === picked.pointId)?.description ? (
              <span className="text-[13.5px]">
                {project.points.find((p) => p.id === picked.pointId)!.description}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="pointer-events-none absolute right-3 bottom-3 left-3 text-center text-[12.5px] text-white/60">
            {editable ? uz.room3d.hintEdit : uz.room3d.hint}
          </p>
        )}
      </div>
    </div>
  );
}
