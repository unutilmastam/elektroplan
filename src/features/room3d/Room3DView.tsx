'use client';

import { Box, Eye, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildRoom3D, type Fixture } from '@/domain/room3d';
import type { Project } from '@/domain/types';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { lookAt, multiply, perspective } from './mat4';
import { Room3DRenderer } from './renderer';
import { START, camera, pick, viewFov, type Mode } from './camera';
import { useLook, type Look } from './useLook';

/** PHASE 23: full-screen 3D of a room — look around from inside or view it from above; tap a part. */
export default function Room3DView({
  project,
  roomId,
  onClose,
}: {
  project: Project;
  roomId: string | null;
  onClose: () => void;
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
  const room = useMemo(() => (current ? buildRoom3D(project, current) : null), [project, current]);
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
    setPicked(null);
  }, [room]);
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
      <div
        className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2"
        style={{ paddingTop: 'max(8px, var(--safe-top))' }}
      >
        <Box size={22} className="text-primary-hi" aria-hidden />
        <select
          aria-label={uz.room3d.room}
          value={current ?? ''}
          onChange={(e) => setCurrent(e.target.value)}
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
                onClick={() => switchMode(m)}
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
            onClick={() => setMarks((m) => !m)}
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
            onClick={() => setLook(START[mode])}
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
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full touch-none"
          data-testid="room3d-canvas"
          data-yaw={look.yaw.toFixed(1)}
          {...handlers}
        />
        {noGl || !room ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-text-muted">
            {noGl ? uz.room3d.noWebgl : uz.room3d.noRoom}
          </p>
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
            {uz.room3d.hint}
          </p>
        )}
      </div>
    </div>
  );
}
