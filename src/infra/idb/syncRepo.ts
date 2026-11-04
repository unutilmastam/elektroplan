import { ProjectSchema } from '@/domain/schemas';
import type { Project } from '@/domain/types';
import { getDb } from './db';

/** Server-sync bookkeeping in IndexedDB: last agreed versions (`synced`) and sent outbox rows. */

export async function getSynced(id: string): Promise<Project | null> {
  const r = ProjectSchema.safeParse(await (await getDb()).get('synced', id));
  return r.success ? r.data : null;
}

export async function putSynced(p: Project): Promise<void> {
  await (await getDb()).put('synced', p, p.id);
}

/** id -> revision of every project this device has agreed with the server. */
export async function syncedRevisions(): Promise<Record<string, number>> {
  const db = await getDb();
  const out: Record<string, number> = {};
  let c = await db.transaction('synced').store.openCursor();
  while (c) {
    const r = ProjectSchema.safeParse(c.value);
    if (r.success) out[String(c.key)] = r.data.revision;
    c = await c.continue();
  }
  return out;
}

export async function clearSynced(): Promise<void> {
  await (await getDb()).clear('synced');
}

/** Outbox rows of one project waiting for the server: keys (to delete after a push) + the patches (history). */
export async function pendingOutbox(projectId: string): Promise<{ keys: number[]; ops: unknown[] }> {
  const db = await getDb();
  const idx = db.transaction('outbox').store.index('byProject');
  const keys: number[] = [];
  const ops: unknown[] = [];
  let c = await idx.openCursor(projectId);
  while (c) {
    keys.push(Number(c.primaryKey));
    ops.push(...c.value.ops);
    c = await c.continue();
  }
  return { keys, ops };
}

export async function removeOutbox(keys: readonly number[]): Promise<void> {
  if (!keys.length) return;
  const tx = (await getDb()).transaction('outbox', 'readwrite');
  for (const k of keys) void tx.store.delete(k);
  await tx.done;
}
