'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useSyncStore } from '@/store/syncStore';

const INTERVAL_MS = 10_000;
const AFTER_EDIT_MS = 1_500;

/**
 * Background sync (ARCHITECTURE §4.7): while logged in — at start, every 10 s, when the connection returns,
 * when the tab becomes visible and shortly after a save. Failures back off (syncStore.backoffMs).
 */
export function SyncBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  useEffect(() => {
    void useAuthStore.getState().load();
  }, []);
  useEffect(() => {
    if (!userId) {
      useSyncStore.getState().reset();
      return;
    }
    const run = () => document.visibilityState === 'visible' && void useSyncStore.getState().run();
    const ready = () => useProjectStore.getState().status === 'ready';
    let editTimer: ReturnType<typeof setTimeout> | null = null;
    const start = () => ready() && run();
    start();
    const unsubReady = useProjectStore.subscribe((s, prev) => {
      if (s.status === 'ready' && prev.status !== 'ready') run();
      if (s.lastSavedAt !== prev.lastSavedAt) {
        if (editTimer) clearTimeout(editTimer);
        editTimer = setTimeout(run, AFTER_EDIT_MS);
      }
    });
    const timer = setInterval(() => ready() && run(), INTERVAL_MS);
    const onOnline = () => {
      useSyncStore.setState({ retryAt: 0 });
      start();
    };
    const onVisible = () => document.visibilityState === 'visible' && start();
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      if (editTimer) clearTimeout(editTimer);
      unsubReady();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);
  return null;
}
