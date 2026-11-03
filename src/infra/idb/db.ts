import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/** IndexedDB layout — docs/DATA_MODEL.md §4. Values are validated with zod on read (projectRepo). */
export interface OutboxRecord {
  projectId: string;
  baseRevision: number;
  ops: unknown[];
  createdAt: string;
}

export interface ElektroDB extends DBSchema {
  projects: { key: string; value: unknown };
  /** v2: the previous valid snapshot of each project (recovery when the current one is unreadable) */
  backups: { key: string; value: unknown };
  outbox: { key: number; value: OutboxRecord; indexes: { byProject: string } };
  meta: { key: string; value: unknown };
}

export const DB_NAME = 'elektroplan';
export const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ElektroDB>> | null = null;
/** the open connection, once ready — lets a save start its transaction synchronously (page unload) */
let openDb: IDBPDatabase<ElektroDB> | null = null;

export const readyDb = () => openDb;

/**
 * Version-gated migrations. Each step only adds; existing data is never rewritten here
 * (shape changes are handled by zod defaults on read).
 */
export function getDb(): Promise<IDBPDatabase<ElektroDB>> {
  dbPromise ??= openDB<ElektroDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        db.createObjectStore('projects');
        db.createObjectStore('outbox', { autoIncrement: true });
        db.createObjectStore('meta');
      }
      if (oldVersion < 2) {
        db.createObjectStore('backups');
        tx.objectStore('outbox').createIndex('byProject', 'projectId');
      }
    },
    blocking() {
      // Another tab wants a newer schema: close so it can upgrade.
      void dbPromise?.then((db) => db.close());
      dbPromise = null;
      openDb = null;
    },
  }).then((db) => {
    openDb = db;
    return db;
  });
  return dbPromise;
}

/** Test helper: forget the cached connection. */
export async function resetDbForTests(): Promise<void> {
  const p = dbPromise;
  dbPromise = null;
  openDb = null;
  if (p) (await p).close();
}
