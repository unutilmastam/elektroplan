import { workOrder } from './installation';
import { computeProgress, type Progress } from './progress';
import { roomWallIds, selectWallElevation, type WallElevation } from './selectors';
import type { ElectricalPoint, Project, Room, SymbolId } from './types';
import type { WallDirection } from './walls';

/**
 * What goes into the PDF (ARCHITECTURE §4.8), as plain data: cover → plan → points by room →
 * wall elevations → legend. Points are numbered 1…N in work order; the same number is printed on the plan,
 * in the table and in the elevations. Pure, so it is unit-tested; drawing lives in features/export-pdf.
 */
export interface ReportRow {
  no: number;
  point: ElectricalPoint;
  direction: WallDirection | null;
}

export interface ReportRoom {
  room: Room;
  progress: Progress;
  rows: ReportRow[];
}

export interface ReportWall {
  elevation: WallElevation;
  numbers: Map<string, number>;
}

export interface Report {
  project: Project;
  date: string;
  progress: Progress;
  numbers: Map<string, number>;
  rooms: ReportRoom[];
  walls: ReportWall[];
  legend: SymbolId[];
}

export function buildReport(project: Project, date: string): Report {
  const ordered = workOrder(project);
  const numbers = new Map(ordered.map((p, i) => [p.id, i + 1]));
  const rooms: ReportRoom[] = project.rooms
    .filter((r) => r.deletedAt === null)
    .sort((a, b) => a.order - b.order)
    .map((room) => {
      const pts = ordered.filter((p) => p.roomId === room.id);
      return {
        room,
        progress: computeProgress(pts),
        rows: pts.map((point) => ({
          no: numbers.get(point.id)!,
          point,
          direction: point.wallId
            ? (selectWallElevation(project, point.wallId, room.id)?.direction ?? null)
            : null,
        })),
      };
    });
  const walls: ReportWall[] = [];
  for (const r of rooms) {
    for (const wallId of roomWallIds(project, r.room.id)) {
      const e = selectWallElevation(project, wallId, r.room.id);
      if (e && e.points.length) walls.push({ elevation: e, numbers });
    }
  }
  const used = new Set(ordered.map((p) => p.symbolId));
  return {
    project,
    date,
    progress: computeProgress(project.points),
    numbers,
    rooms,
    walls,
    legend: [...used].sort(),
  };
}

/** dd.mm.yyyy */
export function reportDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** File name: safe on every OS, keeps Uzbek letters readable. */
export function pdfFileName(name: string): string {
  const base = name
    .trim()
    .replace(/[‘’ʻʼ`']/g, '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return `${base || 'loyiha'}_elektroplan.pdf`;
}
