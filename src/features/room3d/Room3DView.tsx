'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { produce } from 'immer';
import { buildHouse3D, obstacles, roomAtPoint, startPose } from '@/domain/house3d';
import type { Fixture } from '@/domain/room3d';
import { moveFixtureRecipe } from '@/domain/room3dEdit';
import type { Project, SymbolId, Vec2 } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { lookAt, multiply, perspective } from './mat4';
import { Room3DRenderer } from './renderer';
import { Room3DToolbar } from './Room3DToolbar';
import { Room3DHud } from './Room3DHud';
import { Room3DPalette } from './Room3DPalette';
import { START, camera, pick, viewFov, yawFacing, type Mode } from './camera';
import { placeFixture3D } from './place3d';
import { useFixtureDrag, type DragPreview } from './useFixtureDrag';
import { useLook, type Look } from './useLook';
import { useWalk } from './useWalk';
import { WalkStick } from './WalkStick';

/**
 * PHASE 23–25: the whole home in 3D. Walk through it (stick / WASD, walls stop you, doors stand open), look
 * around by finger, or see it from above; tap a part for its details, drag it to move it, or pick a socket
 * from the palette and tap a wall to add one.
 */
export default function Room3DView({
  project,
  roomId,
  onClose,
  editable = false,
}: {
  project: Project;
  roomId: string | null;
  onClose: () => void;
  /** fixtures can be moved and added */
  editable?: boolean;
}) {
  const rooms = useMemo(
    () => project.rooms.filter((r) => r.deletedAt === null).sort((a, b) => a.order - b.order),
    [project.rooms],
  );
  const start = useMemo(() => startPose(project, roomId), []); // eslint-disable-line react-hooks/exhaustive-deps
  const pos = useRef<Vec2>(start?.pos ?? { x: 0, y: 0 });
  const [here, setHere] = useState<string | null>(start ? roomAtPoint(project, start.pos) : null);
  const [mode, setMode] = useState<Mode>('inside');
  const [look, setLook] = useState<Look>({ ...START.inside, yaw: yawFacing(start?.yaw ?? 0) });
  const walkYaw = useRef(look.yaw);
  const [picked, setPicked] = useState<Fixture | null>(null);
  const [adding, setAdding] = useState<SymbolId | null>(null);
  const [noGl, setNoGl] = useState(false);
  const [marks, setMarks] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Room3DRenderer | null>(null);
  // while a fixture is dragged, the home shows where it would go
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
  const scene = useMemo(() => buildHouse3D(shown), [shown]);
  const obs = useMemo(() => obstacles(project), [project]);
  const lookRef = useRef(look);
  lookRef.current = look;

  const viewCam = useCallback(() => {
    const c = canvas.current!;
    const cam = camera(scene!, mode, lookRef.current, pos.current);
    return { ...cam, fov: viewFov(cam.fov, c.clientWidth / Math.max(1, c.clientHeight)) };
  }, [scene, mode]);

  const draw = useCallback(() => {
    const c = canvas.current;
    const r = renderer.current;
    if (!c || !r || !scene) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(c.clientWidth * dpr);
    const h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const cam = viewCam();
    r.render(
      multiply(perspective(cam.fov, w / Math.max(1, h), 4, 12000), lookAt(cam.eye, cam.target)),
      w,
      h,
      mode === 'inside',
      marks,
    );
    c.dataset.pos = `${pos.current.x.toFixed(1)},${pos.current.y.toFixed(1)}`;
  }, [scene, mode, marks, viewCam]);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = Room3DRenderer.create(canvas.current);
    if (!renderer.current) setNoGl(true);
    return () => renderer.current?.dispose();
  }, []);
  useEffect(() => {
    if (scene && renderer.current) renderer.current.setScene(scene);
  }, [scene]);
  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw, look]);
  useEffect(() => {
    const ro = new ResizeObserver(() => requestAnimationFrame(() => drawRef.current()));
    if (canvas.current) ro.observe(canvas.current);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (adding ? setAdding(null) : onClose());
    window.addEventListener('keydown', esc);
    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', esc);
    };
  }, [onClose, adding]);

  const stick = useWalk({
    enabled: mode === 'inside' && !!scene,
    obstacles: obs,
    pos,
    look: () => lookRef.current,
    setLook: (l) => {
      lookRef.current = l;
      setLook(l);
    },
    onMove: () => {
      drawRef.current();
      const r = roomAtPoint(project, pos.current);
      if (r) setHere(r);
    },
  });

  const handlers = useLook(
    () => lookRef.current,
    setLook,
    (x, y) => {
      const c = canvas.current;
      if (!scene || !c) return;
      if (adding)
        return placeFixture3D(project, scene, adding, viewCam(), x, y, c.clientWidth, c.clientHeight);
      setPicked(pick(scene, viewCam(), x, y, c.clientWidth, c.clientHeight));
    },
    mode === 'inside' ? [35, 110] : [0.6, 5],
  );
  const pointer = useFixtureDrag({
    editable: editable && !adding,
    scene,
    project,
    preview,
    setPreview,
    setPicked,
    camera: viewCam,
    look: handlers,
  });
  const dragHeight =
    preview?.hit.kind === 'wall'
      ? Math.round(scene?.fixtures.find((f) => f.pointId === preview.pointId)?.c[1] ?? 0)
      : null;

  const goTo = (id: string) => {
    const p = startPose(project, id);
    if (!p) return;
    pos.current = p.pos;
    setHere(id);
    setMode('inside');
    setLook({ ...START.inside, yaw: yawFacing(p.yaw) });
  };
  const switchMode = (m: Mode) => {
    if (m === mode) return;
    if (mode === 'inside') walkYaw.current = look.yaw;
    setMode(m);
    setLook(m === 'inside' ? { ...START.inside, yaw: walkYaw.current } : START.top);
  };

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
        current={here}
        onRoom={goTo}
        mode={mode}
        onMode={switchMode}
        marks={marks}
        onMarks={() => setMarks((m) => !m)}
        onReset={() => (mode === 'inside' && here ? goTo(here) : setLook(START.top))}
        onClose={onClose}
      />
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: adding ? 'crosshair' : undefined }}
          data-testid="room3d-canvas"
          data-yaw={look.yaw.toFixed(1)}
          data-room={here ?? ''}
          {...pointer}
        />
        {noGl || !scene ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-text-muted">
            {noGl ? uz.room3d.noWebgl : uz.room3d.noRoom}
          </p>
        ) : null}
        {mode === 'inside' && scene && !noGl ? <WalkStick stick={stick} /> : null}
        {editable && scene && !noGl ? (
          <Room3DPalette
            active={adding}
            onPick={(s) => {
              setAdding(s);
              setPicked(null);
            }}
          />
        ) : null}
        <Room3DHud
          project={project}
          picked={picked}
          preview={preview}
          dragHeight={dragHeight}
          adding={!!adding}
          walking={mode === 'inside'}
          editable={editable}
        />
      </div>
    </div>
  );
}
