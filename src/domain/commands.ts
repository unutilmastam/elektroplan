import { createEmptyProject } from './project';
import type { ProjectInfo } from './schemas';
import type { Project } from './types';

/** Pure project-level commands. Callers pass ids and timestamps so results are deterministic. */

export function createProject(info: ProjectInfo, id: string, now: string): Project {
  return {
    ...createEmptyProject(id, info.name, now),
    customerName: info.customerName,
    address: info.address,
  };
}

export function updateProjectInfo(project: Project, info: ProjectInfo, now: string): Project {
  return {
    ...project,
    name: info.name,
    customerName: info.customerName,
    address: info.address,
    updatedAt: now,
  };
}

/** Soft delete so the deletion can sync later (DATA_MODEL: deletedAt). */
export function deleteProject(project: Project, now: string): Project {
  return { ...project, deletedAt: now, updatedAt: now };
}

/**
 * Deep copy with fresh ids for the project and every room / wall / point / opening, references remapped.
 * Installation progress is reset (a copy is a new job).
 */
export function duplicateProject(project: Project, name: string, newId: () => string, now: string): Project {
  const ids = new Map<string, string>();
  const map = (old: string) => {
    let n = ids.get(old);
    if (!n) {
      n = newId();
      ids.set(old, n);
    }
    return n;
  };
  const live = <T extends { deletedAt: string | null }>(xs: T[]) => xs.filter((x) => x.deletedAt === null);
  const stamp = { createdAt: now, updatedAt: now, deletedAt: null };
  return {
    ...project,
    id: newId(),
    ownerId: null,
    name,
    revision: 0,
    rooms: live(project.rooms).map((r) => ({
      ...r,
      ...stamp,
      id: map(r.id),
      vertices: r.vertices.map((v) => ({ ...v })),
      labelOffset: { ...r.labelOffset },
    })),
    walls: live(project.walls).map((w) => ({
      ...w,
      ...stamp,
      id: map(w.id),
      a: { ...w.a },
      b: { ...w.b },
      roomIds: w.roomIds.map(map),
    })),
    installLog: [], // a copy is a new job
    openings: project.openings.map((o) => ({ ...o, id: map(o.id), wallId: map(o.wallId) })),
    points: live(project.points).map((p) => ({
      ...p,
      ...stamp,
      id: map(p.id),
      roomId: map(p.roomId),
      wallId: p.wallId === null ? null : map(p.wallId),
      status: 'pending' as const,
      statusChangedAt: null,
    })),
    settings: { ...project.settings },
    ...stamp,
  };
}
