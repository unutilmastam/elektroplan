import { describe, expect, it } from 'vitest';
import { createProject, deleteProject, duplicateProject, updateProjectInfo } from '@/domain/commands';
import { ProjectSchema } from '@/domain/schemas';
import { buildDemoProject } from '@/features/dashboard/demoProject';

const T0 = '2026-11-03T10:00:00.000Z';
const T1 = '2026-11-03T11:00:00.000Z';
const info = { name: 'Chilonzor', customerName: 'Aliyev Aziz', address: 'Toshkent' };

describe('project commands', () => {
  it('creates an empty project with the form data', () => {
    const p = createProject(info, 'p1', T0);
    expect(p).toMatchObject({
      id: 'p1',
      ...info,
      rooms: [],
      points: [],
      revision: 0,
      createdAt: T0,
      deletedAt: null,
    });
    expect(ProjectSchema.safeParse(p).success).toBe(true);
  });

  it('updates info and bumps updatedAt without touching content', () => {
    const p = createProject(info, 'p1', T0);
    const u = updateProjectInfo(p, { name: 'Yunusobod', customerName: '', address: 'Toshkent' }, T1);
    expect(u).toMatchObject({ name: 'Yunusobod', customerName: '', createdAt: T0, updatedAt: T1 });
    expect(p.name).toBe('Chilonzor');
  });

  it('soft-deletes', () => {
    expect(deleteProject(createProject(info, 'p1', T0), T1)).toMatchObject({ deletedAt: T1, updatedAt: T1 });
  });

  it('duplicates with fresh ids, remapped references and reset progress', () => {
    const src = buildDemoProject();
    let n = 0;
    const copy = duplicateProject(src, 'Nusxa', () => `id-${++n}`, T1);
    expect(copy.id).not.toBe(src.id);
    expect(copy.name).toBe('Nusxa');
    expect(copy.rooms).toHaveLength(src.rooms.length);
    expect(copy.points).toHaveLength(src.points.length);
    const roomIds = new Set(copy.rooms.map((r) => r.id));
    const wallIds = new Set(copy.walls.map((w) => w.id));
    for (const r of src.rooms) expect(roomIds.has(r.id)).toBe(false);
    for (const w of copy.walls) for (const rid of w.roomIds) expect(roomIds.has(rid)).toBe(true);
    for (const p of copy.points) {
      expect(roomIds.has(p.roomId)).toBe(true);
      if (p.wallId) expect(wallIds.has(p.wallId)).toBe(true);
      expect(p.status).toBe('pending');
    }
    for (const o of copy.openings) expect(wallIds.has(o.wallId)).toBe(true);
    expect(copy.createdAt).toBe(T1);
    expect(ProjectSchema.safeParse(copy).success).toBe(true);
    // deep copy: mutating the copy does not affect the source
    copy.rooms[0]!.vertices[0]!.x = 9999;
    expect(src.rooms[0]!.vertices[0]!.x).not.toBe(9999);
  });
});
