import { create } from 'zustand';
import { uuidv7 } from '@/domain/ids';
import { FREE_PROJECTS } from '@/domain/plan';
import { uz } from '@/i18n/uz';
import { api, ApiFailure, NetworkError } from '@/infra/api';
import { getSynced, pendingOutbox, putSynced, removeOutbox, syncedRevisions } from '@/infra/idb/syncRepo';
import { syncOnce, type SyncReport } from '@/infra/sync/syncEngine';
import { useAuthStore } from './authStore';
import { useProjectStore } from './projectStore';
import { usePwaStore } from './pwaStore';
import { useUiStore } from './uiStore';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';
/** first retry after 5 s, doubling up to 5 min */
export const backoffMs = (failures: number) => Math.min(5 * 60_000, 5_000 * 2 ** Math.max(0, failures - 1));

interface SyncStoreState {
  state: SyncState;
  lastSyncAt: string | null;
  failures: number;
  /** earliest time (ms) of the next automatic attempt after a failure */
  retryAt: number;
  lastReport: SyncReport | null;
  run: (reason?: 'auto' | 'manual') => Promise<void>;
  reset: () => void;
}

let running: Promise<void> | null = null;

export const useSyncStore = create<SyncStoreState>()((set, get) => ({
  state: 'idle',
  lastSyncAt: null,
  failures: 0,
  retryAt: 0,
  lastReport: null,
  reset: () => set({ state: 'idle', lastSyncAt: null, failures: 0, retryAt: 0, lastReport: null }),
  run: (reason = 'auto') => {
    if (running) return running;
    const user = useAuthStore.getState().user;
    if (!user || !navigator.onLine) return Promise.resolve();
    if (reason === 'auto' && Date.now() < get().retryAt) return Promise.resolve();
    running = (async () => {
      set({ state: 'syncing' });
      const store = useProjectStore.getState;
      try {
        await store().flush();
        void useAuthStore.getState().refresh(); // Pro turned on / off by the admin
        const report = await syncOnce({
          userId: user.id,
          api,
          projects: () => store().projects,
          saveLocal: (p, needsPush, expected) => store().saveFromServer(p, needsPush, expected),
          markPushed: (id, revision, ownerId) => store().markPushed(id, revision, ownerId),
          synced: { get: getSynced, put: putSynced, revisions: syncedRevisions },
          outbox: { pending: pendingOutbox, remove: removeOutbox },
          makeId: uuidv7,
          now: () => new Date().toISOString(),
        });
        set({
          state: 'synced',
          lastSyncAt: new Date().toISOString(),
          failures: 0,
          retryAt: 0,
          lastReport: report,
        });
        const notify = useUiStore.getState().notify;
        if (report.attached) notify(uz.sync.attached.replace('{n}', String(report.attached)));
        else if (report.rejected.some((r) => r.code === 'pro_required'))
          notify(uz.pro.syncRefused.replace('{limit}', String(FREE_PROJECTS)));
        else if (report.rejected.length)
          notify(uz.sync.rejected.replace('{n}', String(report.rejected.length)));
        else if (reason === 'manual') notify(uz.sync.done);
      } catch (e) {
        if (e instanceof ApiFailure && e.status === 401) {
          await useAuthStore.getState().expired();
          set({ state: 'idle' });
          useUiStore.getState().notify(uz.sync.sessionExpired);
        } else {
          const failures = get().failures + 1;
          set({
            state: e instanceof NetworkError && !navigator.onLine ? 'idle' : 'error',
            failures,
            retryAt: Date.now() + backoffMs(failures),
          });
          if (reason === 'manual') useUiStore.getState().notify(uz.sync.failed);
        }
      } finally {
        running = null;
        void usePwaStore.getState().refreshUnsent();
      }
    })();
    return running;
  },
}));
