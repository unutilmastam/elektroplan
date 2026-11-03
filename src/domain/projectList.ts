import { computeProgress } from './progress';
import type { Project } from './types';

export type ProjectSort = 'updated' | 'created' | 'name' | 'progress';

export interface ProjectSummary {
  id: string;
  name: string;
  customerName: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  roomCount: number;
  pointCount: number;
  percent: number;
}

export function summarizeProject(p: Project): ProjectSummary {
  const progress = computeProgress(p.points);
  return {
    id: p.id,
    name: p.name,
    customerName: p.customerName,
    address: p.address,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    roomCount: p.rooms.filter((r) => r.deletedAt === null).length,
    pointCount: progress.total,
    percent: progress.percent,
  };
}

const norm = (s: string) =>
  s
    .toLocaleLowerCase('uz')
    .replace(/[‘’ʻʼ`']/g, "'")
    .trim();

/**
 * Name order that is identical on every device: Latin A–Z (Oʻ/Gʻ with O/G, Ch/Sh with C/S),
 * case-insensitive, numbers in natural order. ('uz' collation differs between browsers.)
 */
export function compareNames(a: string, b: string): number {
  const ka = norm(a).replace(/'/g, '');
  const kb = norm(b).replace(/'/g, '');
  return ka.localeCompare(kb, 'en', { sensitivity: 'base', numeric: true });
}

/** Live projects matching `query` (name / customer / address), sorted. */
export function filterAndSortProjects(
  projects: readonly Project[],
  query: string,
  sort: ProjectSort,
): ProjectSummary[] {
  const q = norm(query);
  const list = projects
    .filter((p) => p.deletedAt === null)
    .filter((p) => q === '' || [p.name, p.customerName, p.address].some((f) => norm(f).includes(q)))
    .map(summarizeProject);
  const byDateDesc = (k: 'updatedAt' | 'createdAt') => (a: ProjectSummary, b: ProjectSummary) =>
    b[k].localeCompare(a[k]);
  const cmp: Record<ProjectSort, (a: ProjectSummary, b: ProjectSummary) => number> = {
    updated: byDateDesc('updatedAt'),
    created: byDateDesc('createdAt'),
    name: (a, b) => compareNames(a.name, b.name) || byDateDesc('updatedAt')(a, b),
    progress: (a, b) => b.percent - a.percent || byDateDesc('updatedAt')(a, b),
  };
  return list.sort(cmp[sort]);
}

/** Most recently updated live projects. */
export function recentProjects(projects: readonly Project[], limit: number): ProjectSummary[] {
  return filterAndSortProjects(projects, '', 'updated').slice(0, limit);
}

/** Next free "<base>", "<base> 2", "<base> 3"… among live project names. */
export function uniqueName(base: string, projects: readonly Project[]): string {
  const taken = new Set(projects.filter((p) => p.deletedAt === null).map((p) => p.name));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}
