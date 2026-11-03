import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Store + IndexedDB repo together, with a fresh fake DB and fresh module state per test. */
async function freshStore() {
  vi.resetModules();
  globalThis.indexedDB = new IDBFactory();
  const store = await import('@/store/projectStore');
  const repo = await import('@/infra/idb/projectRepo');
  return { ...store, ...repo };
}

const info = { name: 'Chilonzor', customerName: 'Aliyev Aziz', address: 'Toshkent' };

describe('projectStore + IndexedDB', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('persists create / edit / duplicate / delete across a "page reload"', async () => {
    const { useProjectStore } = await freshStore();
    await useProjectStore.getState().init();
    const s = useProjectStore.getState;
    const id = await s().create(info);
    expect(s().currentId).toBe(id);
    await s().updateInfo(id, { ...info, name: 'Yunusobod' });
    const copyId = await s().duplicate(id, 'Yunusobod (nusxa)');
    expect(copyId).not.toBeNull();
    await s().remove(id);
    expect(s().currentId).toBeNull();

    // Reload: new module instance, same IndexedDB
    vi.resetModules();
    const again = await import('@/store/projectStore');
    await again.useProjectStore.getState().init();
    const st = again.useProjectStore.getState();
    const live = st.projects.filter((p) => p.deletedAt === null);
    expect(live.map((p) => p.name)).toEqual(['Yunusobod (nusxa)']);
    expect(st.projects.find((p) => p.id === id)?.deletedAt).not.toBeNull();
    expect(st.lastOpenedId).toBe(id);
  });

  it('skips invalid records instead of crashing', async () => {
    const { useProjectStore, saveProject, loadAllProjects } = await freshStore();
    const { getDb } = await import('@/infra/idb/db');
    const db = await getDb();
    await db.put('projects', { id: 'broken', name: 42 }, 'broken');
    const { createProject } = await import('@/domain/commands');
    await saveProject(createProject(info, 'ok', '2026-11-03T00:00:00.000Z'));
    const r = await loadAllProjects();
    expect(r.projects.map((p) => p.id)).toEqual(['ok']);
    expect(r.invalidIds).toEqual(['broken']);
    await useProjectStore.getState().init();
    expect(useProjectStore.getState().projects).toHaveLength(1);
  });

  it('flags save errors (e.g. storage full) without losing the in-memory project', async () => {
    vi.resetModules();
    globalThis.indexedDB = new IDBFactory();
    vi.doMock('@/infra/idb/projectRepo', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@/infra/idb/projectRepo')>()),
      saveProject: vi.fn().mockRejectedValue(new Error('QuotaExceededError')),
    }));
    const { useProjectStore } = await import('@/store/projectStore');
    await useProjectStore.getState().init();
    const id = await useProjectStore.getState().create(info);
    expect(useProjectStore.getState().saveError).toBe(true);
    expect(useProjectStore.getState().projects.some((p) => p.id === id)).toBe(true);
    vi.doUnmock('@/infra/idb/projectRepo');
  });
});
