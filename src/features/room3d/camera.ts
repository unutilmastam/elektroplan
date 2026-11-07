import { EYE_HEIGHT, rayToSurface, type Scene3D } from '@/domain/house3d';
import type { Fixture } from '@/domain/room3d';
import type { Vec2 } from '@/domain/types';
import { add, cross, direction, dot, norm, scale, sub, type Vec3 } from './mat4';
import type { Look } from './useLook';

/** PHASE 23/25 — where the 3D camera is (standing at `pos`, or above the home), and what a tap hits. Pure. */
export type Mode = 'inside' | 'top';
export const START: Record<Mode, Look> = {
  inside: { yaw: 0, pitch: -4, zoom: 80 },
  top: { yaw: 35, pitch: 55, zoom: 2.3 },
};

export interface Cam {
  eye: Vec3;
  target: Vec3;
  fov: number;
}

export function camera(scene: Scene3D, mode: Mode, l: Look, pos: Vec2): Cam {
  if (mode === 'inside') {
    const eye: Vec3 = [pos.x, EYE_HEIGHT, pos.y];
    return { eye, target: add(eye, direction(l.yaw + 180, l.pitch)), fov: l.zoom };
  }
  const target: Vec3 = [scene.center[0], scene.height * 0.3, scene.center[2]];
  const dir = direction(l.yaw, Math.max(12, Math.min(88, l.pitch)));
  return { eye: add(target, scale(dir, scene.radius * l.zoom + 150)), target, fov: 50 };
}

/** The look yaw that faces plan direction `yaw` (deg, as `startPose` gives it). */
export const yawFacing = (yaw: number) => yaw + 180;

/** Plan step for a walk input: `fwd` along the view, `side` to the right, in cm. */
export function stepFor(look: Look, fwd: number, side: number): Vec2 {
  const [fx, , fz] = direction(look.yaw + 180, 0);
  // right of the view direction, seen from above with y down the screen (= +z)
  return { x: fx * fwd - fz * side, y: fz * fwd + fx * side };
}

/** The fixture under a tap: a ray from the camera through the pixel, nearest face it passes through. */
/** Direction of the ray from the camera through pixel (x, y) of a w × h view. */
export function ray(cam: Cam, x: number, y: number, w: number, h: number): Vec3 {
  const f = norm(sub(cam.target, cam.eye));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const t = Math.tan((cam.fov * Math.PI) / 360);
  const nx = (x / w) * 2 - 1;
  const ny = 1 - (y / h) * 2;
  return norm(add(f, add(scale(r, nx * t * (w / h)), scale(u, ny * t))));
}

export function pick(scene: Scene3D, cam: Cam, x: number, y: number, w: number, h: number): Fixture | null {
  const d = ray(cam, x, y, w, h);
  // nothing behind a wall: the first solid surface the ray meets limits the search
  let best: { fx: Fixture; dist: number } | null = null;
  const wall = rayToSurface(scene.quads, cam.eye, d) + 3;
  for (const fx of scene.fixtures) {
    const den = dot(d, fx.n);
    if (Math.abs(den) < 1e-6) continue;
    const dist = dot(sub(fx.c, cam.eye), fx.n) / den;
    if (dist <= 0 || dist > wall) continue;
    const hit = add(cam.eye, scale(d, dist));
    const rel = sub(hit, fx.c);
    const up: Vec3 = fx.n[1] !== 0 ? [0, 0, 1] : [0, 1, 0];
    // a little slack: small plates are easy to hit with a finger
    if (
      Math.abs(dot(rel, fx.u)) <= fx.w / 2 + 6 &&
      Math.abs(dot(rel, up)) <= fx.h / 2 + 6 &&
      (!best || dist < best.dist)
    )
      best = { fx, dist };
  }
  return best?.fx ?? null;
}

/** Vertical field of view for the canvas: on a tall (portrait) screen `fov` is kept as the horizontal one. */
export function viewFov(fov: number, aspect: number): number {
  if (aspect >= 1) return fov;
  const h = (fov * Math.PI) / 180;
  return Math.min(125, (2 * Math.atan(Math.tan(h / 2) / aspect) * 180) / Math.PI);
}
