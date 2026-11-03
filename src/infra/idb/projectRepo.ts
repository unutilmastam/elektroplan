import { ProjectSchema } from '@/domain/schemas';
import type { Project } from '@/domain/types';
import { getDb } from './db';

/**
 * Minimal project repository (Phase 2). Full debounced autosave + outbox arrive in Phase 8.
 * Every read is validated; invalid records are skipped and reported, never crash the app.
 */
export interface LoadResult {
  projects: Project[];
  invalidIds: string[];
}

export async function loadAllProjects(): Promise<LoadResult> {
  const db = await getDb();
  const tx = db.transaction('projects', 'readonly');
  const [keys, values] = await Promise.all([tx.store.getAllKeys(), tx.store.getAll()]);
  await tx.done;
  const projects: Project[] = [];
  const invalidIds: string[] = [];
  values.forEach((v, i) => {
    const r = ProjectSchema.safeParse(v);
    if (r.success) projects.push(r.data);
    else invalidIds.push(String(keys[i]));
  });
  return { projects, invalidIds };
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.put('projects', ProjectSchema.parse(project), project.id);
}

export async function getMeta<T>(key: string, parse: (v: unknown) => T | null): Promise<T | null> {
  const db = await getDb();
  return parse(await db.get('meta', key));
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put('meta', value, key);
}

export const META_LAST_OPENED = 'lastOpenedProjectId';

/** Ask the browser not to evict our data (ARCHITECTURE §4.6). Safe to call repeatedly. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
