import { panelFocus, type PanelFocus, type Selection } from './selection';
import type { ElectricalPoint, Project, Room, Wall } from './types';
import { cornerDistance, wallDirection, type WallDirection } from './walls';

export interface RoomStat {
  room: Room;
  pointCount: number;
  completedCount: number;
}

/** Rooms in list order with their live point counts. */
export function selectRoomStats(project: Project): RoomStat[] {
  return project.rooms
    .filter((r) => r.deletedAt === null)
    .sort((a, b) => a.order - b.order)
    .map((room) => {
      const pts = project.points.filter((p) => p.deletedAt === null && p.roomId === room.id);
      return {
        room,
        pointCount: pts.length,
        completedCount: pts.filter((p) => p.status === 'completed').length,
      };
    });
}

export interface ElevationPoint {
  point: ElectricalPoint;
  /** horizontal position from the wall's left corner (plan units ≈ cm) */
  distance: number;
  /** mount height in cm (falls back to 0 when unknown) */
  height: number;
}

export interface WallElevation {
  wall: Wall;
  room: Room | null;
  direction: WallDirection | null;
  length: number;
  displayHeight: number;
  points: ElevationPoint[];
}

/** docs/DATA_MODEL.md §2 selectWallElevation — points sorted left → right. */
export function selectWallElevation(project: Project, wallId: string, roomId?: string): WallElevation | null {
  const wall = project.walls.find((w) => w.id === wallId && w.deletedAt === null);
  if (!wall) return null;
  const length = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
  const preferred = roomId ?? wall.roomIds[0];
  const room = project.rooms.find((r) => r.id === preferred && r.deletedAt === null) ?? null;
  const points = project.points
    .filter((p) => p.deletedAt === null && p.wallId === wall.id && (room === null || p.roomId === room.id))
    .map((point) => ({
      point,
      distance: point.distanceFromCornerCm ?? cornerDistance(wall, point.t ?? 0, point.side),
      height: point.mountHeightCm ?? 0,
    }))
    .sort((a, b) => a.distance - b.distance);
  return {
    wall,
    room,
    direction: room ? wallDirection(wall, room) : null,
    length,
    displayHeight: project.settings.wallDisplayHeightCm,
    points,
  };
}

/** Wall of `roomId` that carries the most points (ties → first wall). Used for the wall view default. */
export function pickDefaultWallId(project: Project, roomId: string): string | null {
  const walls = project.walls.filter((w) => w.deletedAt === null && w.roomIds.includes(roomId));
  let best: string | null = null;
  let bestCount = -1;
  for (const w of walls) {
    const n = project.points.filter(
      (p) => p.deletedAt === null && p.wallId === w.id && p.roomId === roomId,
    ).length;
    if (n > bestCount) {
      best = w.id;
      bestCount = n;
    }
  }
  return best;
}

/** Panel focus for a selection, falling back to the room's busiest wall for the wall view. */
export function focusForSelection(project: Project, sel: Selection): PanelFocus {
  const f = panelFocus(project, sel);
  if (f.roomId && !f.wallId) return { ...f, wallId: pickDefaultWallId(project, f.roomId) };
  return f;
}

/** Walls of a room in outline order (prev / next buttons in the wall view). */
export function roomWallIds(project: Project, roomId: string): string[] {
  const room = project.rooms.find((r) => r.id === roomId && r.deletedAt === null);
  if (!room) return [];
  const out: string[] = [];
  const same = (p: { x: number; y: number }, q: { x: number; y: number }) =>
    Math.abs(p.x - q.x) < 0.5 && Math.abs(p.y - q.y) < 0.5;
  room.vertices.forEach((a, i) => {
    const b = room.vertices[(i + 1) % room.vertices.length]!;
    const w = project.walls.find(
      (x) => x.deletedAt === null && ((same(x.a, a) && same(x.b, b)) || (same(x.a, b) && same(x.b, a))),
    );
    if (w && !out.includes(w.id)) out.push(w.id);
  });
  return out;
}
