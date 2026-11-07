'use client';

import { useRef, type PointerEvent } from 'react';
import type { Fixture, Room3D } from '@/domain/room3d';
import { hitRoom, moveFixtureRecipe, type Hit3D } from '@/domain/room3dEdit';
import type { Project } from '@/domain/types';
import { useProjectStore } from '@/store/projectStore';
import { pick, ray, type Cam } from './camera';
import type { useLook } from './useLook';

export interface DragPreview {
  pointId: string;
  hit: Hit3D;
  size: number;
}

/**
 * PHASE 24 — in the 3D view a press that starts on a fixture moves it (editor only); anywhere else the
 * finger looks around. While dragging, `preview` holds where it would go; letting go saves one undo step.
 */
export function useFixtureDrag(o: {
  editable: boolean;
  room: Room3D | null;
  roomId: string | null;
  project: Project;
  preview: DragPreview | null;
  setPreview: (p: DragPreview | null) => void;
  setPicked: (f: Fixture | null) => void;
  camera: () => Cam;
  look: ReturnType<typeof useLook>;
}) {
  const { editable, room, project, preview, setPreview, setPicked } = o;
  const current = o.roomId;
  const drag = useRef<{
    pointId: string;
    size: number;
    ceiling: boolean;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const viewCam = o.camera;
  const local = (e: { clientX: number; clientY: number; currentTarget: Element }) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => {
      if (editable && room && current && e.isPrimary) {
        const l = local(e);
        const fx = pick(room, viewCam(), l.x, l.y, l.w, l.h);
        if (fx) {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            pointId: fx.pointId,
            size: fx.h,
            ceiling: fx.wallId === null,
            x: e.clientX,
            y: e.clientY,
            moved: false,
          };
          setPicked(fx);
          return;
        }
      }
      o.look.onPointerDown(e);
    },
    onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => {
      const dr = drag.current;
      if (!dr) return o.look.onPointerMove(e);
      if (!dr.moved && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 6) return;
      dr.moved = true;
      const l = local(e);
      const cam = viewCam();
      const hit = hitRoom(project, current!, cam.eye, ray(cam, l.x, l.y, l.w, l.h), dr.ceiling);
      if (hit) setPreview({ pointId: dr.pointId, hit, size: dr.size });
    },
    onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => {
      const dr = drag.current;
      if (!dr) return o.look.onPointerUp(e);
      drag.current = null;
      if (dr.moved && preview) {
        useProjectStore
          .getState()
          .apply(
            'Nuqtani ko‘chirish (3D)',
            moveFixtureRecipe(project, preview.pointId, preview.hit, preview.size, new Date().toISOString()),
          );
      }
      setPreview(null);
    },
    onPointerCancel: (e: PointerEvent<HTMLCanvasElement>) => {
      if (drag.current) {
        drag.current = null;
        setPreview(null);
      } else o.look.onPointerCancel(e);
    },
    onWheel: o.look.onWheel,
  };
}
