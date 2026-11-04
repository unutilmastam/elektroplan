import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { buildBackup } from '@/domain/backup';

/** Restoring a backup right after the page opens must compare with the projects already on the device. */
describe('importBackup before the projects are loaded', () => {
  it('waits for IndexedDB: an equal project is not re-added, newer local work is not overwritten', async () => {
    vi.resetModules();
    globalThis.indexedDB = new IDBFactory();
    let store = (await import('@/store/projectStore')).useProjectStore;
    await store.getState().init();
    const id = await store.getState().create({ name: 'Uy', customerName: '', address: '' });
    const saved = store.getState().projects.find((p) => p.id === id)!;
    await store.getState().flush();
    const file = new File(
      [JSON.stringify(buildBackup([saved], new Date().toISOString()))],
      'b.elektroplan.json',
    );

    // new page: the store has not read IndexedDB yet
    vi.resetModules();
    store = (await import('@/store/projectStore')).useProjectStore;
    const ui = (await import('@/store/uiStore')).useUiStore;
    const { importBackup } = await import('@/features/offline-library/backupActions');
    expect(store.getState().status).toBe('idle');
    const importing = importBackup(file);
    await store.getState().init();
    await importing;
    expect(ui.getState().notice?.text).toContain('1 ta o‘zgarishsiz');
    expect(store.getState().projects.filter((p) => p.id === id)).toHaveLength(1);
  });
});
