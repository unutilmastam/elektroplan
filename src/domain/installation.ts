import type { Draft } from 'immer';
import { computeProgress, type Progress } from './progress';
import type { ElectricalPoint, PointStatus, Project, Room } from './types';

/** Montaj rejimi (Phase 9): status changes with an append-only log, room progress, the next point to do. Pure. */

export const STATUS_ORDER: PointStatus[] = ['pending', 'in_progress', 'completed'];

/** Sets a point's status and appends an InstallationTask (who / when). No-op when unchanged. */
export function setStatusRecipe(
  pointId: string,
  status: PointStatus,
  taskId: string,
  now: string,
  userId: string | null = null,
) {
  return (d: Draft<Project>) => {
    const p = d.points.find((x) => x.id === pointId && x.deletedAt === null);
    if (!p || p.status === status) return;
    d.installLog.push({
      id: taskId,
      pointId,
      userId,
      fromStatus: p.status,
      toStatus: status,
      createdAt: now,
    });
    p.status = status;
    p.statusChangedAt = now;
    p.updatedAt = now;
  };
}

/** Next status for a single "advance" tap: pending → in_progress → completed (completed stays). */
export function advance(status: PointStatus): PointStatus {
  return status === 'pending' ? 'in_progress' : 'completed';
}

const live = (p: Project) => p.points.filter((x) => x.deletedAt === null);
const liveRooms = (p: Project) =>
  p.rooms.filter((r) => r.deletedAt === null).sort((a, b) => a.order - b.order);

export interface RoomProgress extends Progress {
  room: Room;
}

export function roomProgress(p: Project): RoomProgress[] {
  return liveRooms(p).map((room) => ({
    room,
    ...computeProgress(live(p).filter((x) => x.roomId === room.id)),
  }));
}

/**
 * Work order: rooms in list order; inside a room wall points by wall then distance from the left corner,
 * ceiling points last. Stable, so "Keyingi" walks the job the same way every time.
 */
export function workOrder(p: Project, roomId: string | null = null, onlyOpen = false): ElectricalPoint[] {
  const roomIndex = new Map(liveRooms(p).map((r, i) => [r.id, i]));
  const wallIndex = new Map(p.walls.map((w, i) => [w.id, i]));
  return live(p)
    .filter((x) => (roomId === null || x.roomId === roomId) && (!onlyOpen || x.status !== 'completed'))
    .sort(
      (a, b) =>
        (roomIndex.get(a.roomId) ?? 1e9) - (roomIndex.get(b.roomId) ?? 1e9) ||
        (a.wallId === null ? 1 : 0) - (b.wallId === null ? 1 : 0) ||
        (wallIndex.get(a.wallId ?? '') ?? 0) - (wallIndex.get(b.wallId ?? '') ?? 0) ||
        (a.distanceFromCornerCm ?? 0) - (b.distanceFromCornerCm ?? 0) ||
        a.id.localeCompare(b.id),
    );
}

/** The next not-completed point after `fromId` (wrapping around), optionally within one room. */
export function nextOpenPoint(
  p: Project,
  fromId: string | null,
  roomId: string | null = null,
): ElectricalPoint | null {
  const all = workOrder(p, roomId);
  const open = all.filter((x) => x.status !== 'completed');
  if (!open.length) return null;
  const start = fromId ? all.findIndex((x) => x.id === fromId) : -1;
  for (let k = 1; k <= all.length; k++) {
    const c = all[(start + k + all.length) % all.length]!;
    if (c.status !== 'completed') return c;
  }
  return open[0]!;
}

/** Status change history of one point, newest first. */
export function pointHistory(p: Project, pointId: string) {
  return p.installLog
    .filter((t) => t.pointId === pointId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
