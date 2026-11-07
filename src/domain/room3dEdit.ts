import type { Draft } from 'immer';
import { distance, pointInPolygon } from './geometry';
import { movePointRecipe } from './points';
import type { V3 } from './room3d';
import type { Project, Vec2 } from './types';

/**
 * PHASE 24 — moving a socket / switch / lamp with the finger in the 3D view (pure).
 * The finger's ray hits a wall's inner face (→ wall, position along it, height) or the ceiling (→ x, y).
 */

export type Hit3D =
  { kind: 'wall'; wallId: string; t: number; height: number; at: Vec2 } | { kind: 'ceiling'; at: Vec2 };

const HEIGHT_STEP = 5;

export function hitRoom(project: Project, roomId: string, eye: V3, d: V3, onCeiling: boolean): Hit3D | null {
  const room = project.rooms.find((r) => r.id === roomId && r.deletedAt === null);
  if (!room) return null;
  const H = project.settings.wallDisplayHeightCm;
  if (onCeiling) {
    if (d[1] <= 1e-6) return null;
    const s = (H - eye[1]) / d[1];
    const at = { x: eye[0] + d[0] * s, y: eye[2] + d[2] * s };
    return pointInPolygon(at, room.vertices) ? { kind: 'ceiling', at } : null;
  }
  let best: { hit: Hit3D; s: number } | null = null;
  for (const w of project.walls) {
    if (w.deletedAt !== null || !w.roomIds.includes(room.id)) continue;
    const len = distance(w.a, w.b);
    if (len < 1) continue;
    const dir = { x: (w.b.x - w.a.x) / len, y: (w.b.y - w.a.y) / len };
    let n = { x: -dir.y, y: dir.x };
    const mid = { x: (w.a.x + w.b.x) / 2 + n.x * 4, y: (w.a.y + w.b.y) / 2 + n.y * 4 };
    if (!pointInPolygon(mid, room.vertices)) n = { x: -n.x, y: -n.y };
    const half = w.thickness / 2;
    const face = { x: w.a.x + n.x * half, y: w.a.y + n.y * half };
    const den = d[0] * n.x + d[2] * n.y;
    if (den >= -1e-6) continue; // looking at the back of this face
    const s = ((face.x - eye[0]) * n.x + (face.y - eye[2]) * n.y) / den;
    if (s <= 0 || (best && s >= best.s)) continue;
    const px = eye[0] + d[0] * s;
    const pz = eye[2] + d[2] * s;
    const u = (px - face.x) * dir.x + (pz - face.y) * dir.y;
    const h = eye[1] + d[1] * s;
    if (u < -2 || u > len + 2 || h < -2 || h > H + 2) continue;
    const uu = Math.min(len, Math.max(0, u));
    best = {
      s,
      hit: {
        kind: 'wall',
        wallId: w.id,
        t: uu / len,
        height: Math.round(Math.min(H, Math.max(0, h)) / HEIGHT_STEP) * HEIGHT_STEP,
        // a plan point just inside the room in front of the hit: the plan's own move logic takes it from here
        at: { x: w.a.x + dir.x * uu + n.x * (half + 10), y: w.a.y + dir.y * uu + n.y * (half + 10) },
      },
    };
  }
  return best?.hit ?? null;
}

/** One undo step: the point goes where the finger is (wall + height, or ceiling position). */
export function moveFixtureRecipe(base: Project, pointId: string, hit: Hit3D, sizeCm: number, now: string) {
  const H = base.settings.wallDisplayHeightCm;
  const move = movePointRecipe(base, pointId, hit.at, { tolerance: 14, free: hit.kind === 'ceiling' }, now);
  return (d: Draft<Project>) => {
    move(d);
    if (hit.kind !== 'wall') return;
    const p = d.points.find((x) => x.id === pointId);
    if (!p) return;
    const half = sizeCm / 2;
    const h = Math.round(Math.min(H - half - 2, Math.max(half + 2, hit.height)));
    if (p.mountHeightCm !== h) {
      p.mountHeightCm = h;
      p.updatedAt = now;
    }
  };
}
