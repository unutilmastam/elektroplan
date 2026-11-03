import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/** IndexedDB layout — docs/DATA_MODEL.md §4. Values are validated with zod on read (projectRepo). */
export interface ElektroDB extends DBSchema {
  projects: { key: string; value: unknown };
  outbox: {
    key: number;
    value: { projectId: string; baseRevision: number; ops: unknown[]; createdAt: string };
  };
  meta: { key: string; value: unknown };
}

export const DB_NAME = 'elektroplan';
export const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ElektroDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<ElektroDB>> {
  dbPromise ??= openDB<ElektroDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('projects');
        db.createObjectStore('outbox', { autoIncrement: true });
        db.createObjectStore('meta');
      }
    },
    blocking() {
      // Another tab wants a newer schema: close so it can upgrade.
      void dbPromise?.then((db) => db.close());
      dbPromise = null;
    },
  });
  return dbPromise;
}

/** Test helper: forget the cached connection. */
export function resetDbForTests(): void {
  dbPromise = null;
}
