import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '@/domain/commands';
import type { Project } from '@/domain/types';

const info = { name: 'Chilonzor', customerName: '', address: '' };

/** A fresh "browser": new IndexedDB, new module instances. */
async function boot(keepDb = false) {
  vi.resetModules();
  if (!keepDb) globalThis.indexedDB = new IDBFactory();
  const store = await import('@/store/projectStore');
  const repo = await import('@/infra/idb/projectRepo');
  const db = await import('@/infra/idb/db');
  await store.useProjectStore.getState().init();
  return { s: store.useProjectStore.getState, store, repo, db };
}

/** "Close the browser": drop the connection without flushing, then start again on the same data. */
async function reopen(prev: Awaited<ReturnType<typeof boot>>) {
  await prev.db.resetDbForTests();
  return boot(true);
}

const rename = (name: string) => (d: { name: string }) => {
  d.name = name;
};

describe('autosave (fake-indexeddb)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('an edit is written after the 500 ms pause; reopening keeps it', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    app.s().apply('rename', rename('Yunusobod'));
    expect(app.s().saveState).toBe('dirty');
    await new Promise((r) => setTimeout(r, 650));
    expect(app.s().saveState).toBe('saved');
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('Yunusobod');
  });

  it('closing before the pause: the page-hide flush saves it', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    app.s().apply('rename', rename('Sergeli'));
    await app.s().flush(); // what pagehide / visibilitychange / beforeunload / "Saqlash" do
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('Sergeli');
  });

  it('closing at any moment never loses what was saved before (atomic writes)', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    for (const n of ['A', 'B', 'C']) {
      app.s().apply('rename', rename(n));
      await app.s().flush();
    }
    app.s().apply('rename', rename('D')); // still in the 500 ms window when the "browser dies"
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('C');
  });

  it('every change goes to the outbox as patches (undo as inverse patches)', async () => {
    const app = await boot();
    const id = await app.s().create(info);
    app.s().apply('rename', rename('X'));
    await app.s().flush();
    app.s().undo();
    await app.s().flush();
    const out = await app.repo.outboxFor(id);
    expect(out).toHaveLength(3); // create snapshot, rename, undo
    expect(out[1]!.ops).toEqual([{ op: 'replace', path: ['name'], value: 'X' }]);
    expect(out[2]!.ops).toEqual([{ op: 'replace', path: ['name'], value: 'Chilonzor' }]);
    expect(out.every((o) => o.projectId === id && o.baseRevision === 0)).toBe(true);
  });

  it('a corrupt record is restored from the last valid snapshot', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    app.s().apply('rename', rename('Yaxshi'));
    await app.s().flush();
    app.s().apply('rename', rename('Oxirgi'));
    await app.s().flush();
    const db = await app.db.getDb();
    await db.put('projects', { id, name: 42, garbage: true }, id); // e.g. storage glitch
    app = await reopen(app);
    const p = app.s().projects.find((x) => x.id === id)!;
    expect(p.name).toBe('Yaxshi'); // previous valid snapshot
    expect(app.s().recoveredCount).toBe(1);
    const again = await reopen(app);
    expect(again.s().recoveredCount).toBe(0); // written back, clean next time
  });

  it('a failed write keeps the old data on disk and reports the error', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    const db = await app.db.getDb();
    const orig = db.transaction.bind(db);
    // make the next transaction fail
    (db as unknown as { transaction: unknown }).transaction = () => {
      throw new Error('QuotaExceededError');
    };
    app.s().apply('rename', rename('Yo‘qolmasin'));
    await app.s().flush();
    expect(app.s().saveState).toBe('error');
    (db as unknown as { transaction: unknown }).transaction = orig;
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('Chilonzor');
  });

  it('closing the page: the journal (localStorage) saves the edit even if IndexedDB is cut off', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    const db = await app.db.getDb();
    const orig = db.transaction.bind(db);
    (db as unknown as { transaction: unknown }).transaction = () => {
      throw new Error('AbortError: page is unloading');
    };
    app.s().apply('rename', rename('Jurnaldan'));
    await app.s().flush(true); // pagehide
    (db as unknown as { transaction: unknown }).transaction = orig;
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('Jurnaldan');
    expect(localStorage.getItem('elektroplan:unsaved')).toBeNull(); // moved into IndexedDB
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('Jurnaldan');
  });

  it('an older journal never overwrites newer saved data', async () => {
    let app = await boot();
    const id = await app.s().create(info);
    const { stashUnsaved } = await import('@/infra/idb/stash');
    const old = {
      ...app.s().projects.find((p) => p.id === id)!,
      name: 'Eski',
      updatedAt: '2000-01-01T00:00:00.000Z',
    };
    stashUnsaved(old, []);
    app = await reopen(app);
    expect(app.s().projects.find((p) => p.id === id)!.name).toBe('Chilonzor');
  });

  it('migrates a version-1 database without losing projects', async () => {
    vi.resetModules();
    globalThis.indexedDB = new IDBFactory();
    const p: Project = createProject(info, 'old-1', '2026-11-01T00:00:00.000Z');
    const v1 = await openDB('elektroplan', 1, {
      upgrade(db) {
        db.createObjectStore('projects');
        db.createObjectStore('outbox', { autoIncrement: true });
        db.createObjectStore('meta');
      },
    });
    await v1.put('projects', p, p.id);
    v1.close();
    const app = await boot(true);
    expect(app.s().projects.map((x) => x.id)).toEqual(['old-1']);
    const db = await app.db.getDb();
    expect(db.version).toBe(3);
    expect([...db.objectStoreNames]).toContain('synced');
    expect([...db.objectStoreNames]).toContain('backups');
  });
});
