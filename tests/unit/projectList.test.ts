import { describe, expect, it } from 'vitest';
import { createProject, deleteProject } from '@/domain/commands';
import { compareNames, filterAndSortProjects, recentProjects, uniqueName } from '@/domain/projectList';

const mk = (id: string, name: string, customer: string, created: string, updated: string) => ({
  ...createProject({ name, customerName: customer, address: 'Toshkent' }, id, created),
  updatedAt: updated,
});

const projects = [
  mk('a', 'Yunusobod uy', 'Karimov', '2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z'),
  mk('b', 'Chilonzor kvartira', 'Aliyev', '2026-02-01T00:00:00Z', '2026-02-15T00:00:00Z'),
  mk('c', 'Oʻrikzor ofis', 'Sobirov', '2026-03-01T00:00:00Z', '2026-03-02T00:00:00Z'),
  deleteProject(
    mk('d', 'O‘chirilgan', 'X', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    '2026-04-01T00:00:00Z',
  ),
];

describe('project list', () => {
  it('hides deleted projects and sorts by last update', () => {
    expect(filterAndSortProjects(projects, '', 'updated').map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });
  it('sorts by created date and by name', () => {
    expect(filterAndSortProjects(projects, '', 'created').map((p) => p.id)).toEqual(['c', 'b', 'a']);
    expect(filterAndSortProjects(projects, '', 'name').map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
  it('compares names the same way on every device', () => {
    expect(compareNames('Uy 10', 'Uy 9')).toBeGreaterThan(0);
    expect(compareNames('oʻrikzor', 'Orzu')).toBeLessThan(0);
    expect(compareNames('Chilonzor', 'chilonzor')).toBe(0);
  });
  it('searches name, customer and address, case/apostrophe-insensitive', () => {
    expect(filterAndSortProjects(projects, 'aliyev', 'updated').map((p) => p.id)).toEqual(['b']);
    expect(filterAndSortProjects(projects, "o'rikzor", 'updated').map((p) => p.id)).toEqual(['c']);
    expect(filterAndSortProjects(projects, 'TOSHKENT', 'updated')).toHaveLength(3);
    expect(filterAndSortProjects(projects, 'yo‘q', 'updated')).toHaveLength(0);
  });
  it('summarizes progress', () => {
    expect(filterAndSortProjects(projects, '', 'updated')[0]).toMatchObject({
      roomCount: 0,
      pointCount: 0,
      percent: 0,
    });
  });
  it('returns recent projects', () => {
    expect(recentProjects(projects, 2).map((p) => p.id)).toEqual(['c', 'a']);
  });
  it('makes unique names', () => {
    expect(uniqueName('Yangi', projects)).toBe('Yangi');
    expect(uniqueName('Yunusobod uy', projects)).toBe('Yunusobod uy 2');
    expect(uniqueName('O‘chirilgan', projects)).toBe('O‘chirilgan');
  });
});
