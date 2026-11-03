import { ProjectSchema } from '@/domain/schemas';
import type { Project } from '@/domain/types';

/**
 * Write-ahead journal for page close. Browsers may abort an IndexedDB transaction started while the page is
 * unloading, but localStorage writes are synchronous. On pagehide the unsaved project goes here first;
 * on the next start it is moved into IndexedDB (if it is newer) and the journal is cleared.
 */
const KEY = 'elektroplan:unsaved';

export interface Stash {
  project: Project;
  ops: unknown[];
}

export function stashUnsaved(project: Project, ops: readonly unknown[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ project, ops }));
  } catch {
    // storage full / private mode: IndexedDB write is still attempted
  }
}

export function clearStash(projectId?: string): void {
  try {
    if (projectId === undefined) return localStorage.removeItem(KEY);
    const s = readStash();
    if (!s || s.project.id === projectId) localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function readStash(): Stash | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { project?: unknown; ops?: unknown };
    const p = ProjectSchema.safeParse(v.project);
    return p.success ? { project: p.data, ops: Array.isArray(v.ops) ? v.ops : [] } : null;
  } catch {
    return null;
  }
}
