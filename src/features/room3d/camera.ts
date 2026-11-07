import type { Fixture, Room3D } from '@/domain/room3d';
import { add, cross, direction, dot, norm, scale, sub, type Vec3 } from './mat4';
import type { Look } from './useLook';

/** PHASE 23 — where the 3D camera is for a look state, and what a tap hits. Pure. */
export type Mode = 'inside' | 'top';
export const START: Record<Mode, Look> = {
  inside: { yaw: 0, pitch: -4, zoom: 90 },
  top: { yaw: 35, pitch: 55, zoom: 2.3 },
};

export interface Cam {
  eye: Vec3;
  target: Vec3;
  fov: number;
}

export function camera(room: Room3D, mode: Mode, l: Look): Cam {
  if (mode === 'inside')
    return { eye: room.eye, target: add(room.eye, direction(l.yaw + 180, l.pitch)), fov: l.zoom };
  const target: Vec3 = [room.center[0], room.height * 0.3, room.center[2]];
  const dir = direction(l.yaw, Math.max(12, Math.min(88, l.pitch)));
  return { eye: add(target, scale(dir, room.radius * l.zoom + 150)), target, fov: 50 };
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

export function pick(room: Room3D, cam: Cam, x: number, y: number, w: number, h: number): Fixture | null {
  const d = ray(cam, x, y, w, h);
  let best: { fx: Fixture; dist: number } | null = null;
  for (const fx of room.fixtures) {
    const den = dot(d, fx.n);
    if (Math.abs(den) < 1e-6) continue;
    const dist = dot(sub(fx.c, cam.eye), fx.n) / den;
    if (dist <= 0) continue;
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
