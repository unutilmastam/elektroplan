import { ProjectSchema } from '@/domain/schemas';
import type { Project } from '@/domain/types';
import { getDb, readyDb, type ElektroDB, type OutboxRecord } from './db';
import type { IDBPDatabase } from 'idb';
import { clearStash, readStash } from './stash';

/**
 * Project repository. Every read is validated with zod; an unreadable record is replaced by the
 * last valid snapshot kept in `backups` (and reported), so a corrupt write never loses a project.
 */
export interface LoadResult {
  projects: Project[];
  /** records that could not be read and had no valid backup */
  invalidIds: string[];
  /** records that were unreadable and were restored from their last valid snapshot */
  recoveredIds: string[];
}

/** last snapshot written / read per project = the backup for the next write (no read needed while saving) */
const lastGood = new Map<string, Project>();

export async function loadAllProjects(): Promise<LoadResult> {
  const db = await getDb();
  const tx = db.transaction(['projects', 'backups'], 'readonly');
  const store = tx.objectStore('projects');
  const backups = tx.objectStore('backups');
  const [keys, values] = await Promise.all([store.getAllKeys(), store.getAll()]);
  const projects: Project[] = [];
  const invalidIds: string[] = [];
  const recoveredIds: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const key = String(keys[i]);
    const r = ProjectSchema.safeParse(values[i]);
    if (r.success) {
      projects.push(r.data);
      continue;
    }
    const b = ProjectSchema.safeParse(await backups.get(key));
    if (b.success) {
      projects.push(b.data);
      recoveredIds.push(key);
    } else invalidIds.push(key);
  }
  await tx.done;
  for (const p of projects) lastGood.set(p.id, p);
  // an edit journaled while the page was closing wins over an older stored snapshot
  const stash = readStash();
  if (stash) {
    const i = projects.findIndex((x) => x.id === stash.project.id);
    const stored = i >= 0 ? projects[i]! : null;
    if (!stored || stash.project.updatedAt >= stored.updatedAt) {
      await saveProject(stash.project, stash.ops);
      if (i >= 0) projects[i] = stash.project;
      else projects.push(stash.project);
    }
    clearStash();
  }
  if (recoveredIds.length) {
    // write the recovered snapshot back so the next start is clean
    const w = db.transaction('projects', 'readwrite');
    for (const p of projects.filter((x) => recoveredIds.includes(x.id))) await w.store.put(p, p.id);
    // the recovered snapshot is also the backup from now on
    await w.done;
  }
  return { projects, invalidIds, recoveredIds };
}

/**
 * Atomic save (one transaction): the previous valid snapshot becomes the backup, the new snapshot is written,
 * the change patches are appended to the outbox (server sync, Phase 12).
 * When the connection is already open every request is issued synchronously, so a save started while the
 * page is being hidden / closed still reaches IndexedDB.
 */
export function saveProject(project: Project, ops: readonly unknown[] = []): Promise<void> {
  let valid: Project;
  try {
    valid = ProjectSchema.parse(project);
  } catch (e) {
    return Promise.reject(e);
  }
  const db = readyDb();
  if (db) return write(db, valid, ops);
  return getDb().then((d) => write(d, valid, ops));
}

function write(db: IDBPDatabase<ElektroDB>, p: Project, ops: readonly unknown[]): Promise<void> {
  try {
    const tx = db.transaction(['projects', 'backups', 'outbox'], 'readwrite');
    const prev = lastGood.get(p.id);
    if (prev) void tx.objectStore('backups').put(prev, p.id);
    void tx.objectStore('projects').put(p, p.id);
    if (ops.length) {
      const rec: OutboxRecord = {
        projectId: p.id,
        baseRevision: p.revision,
        ops: [...ops],
        createdAt: new Date().toISOString(),
      };
      void tx.objectStore('outbox').add(rec);
    }
    return tx.done.then(() => {
      lastGood.set(p.id, p);
      clearStash(p.id);
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function outboxFor(projectId: string): Promise<OutboxRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex('outbox', 'byProject', projectId);
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
