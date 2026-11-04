'use client';

import { useEffect } from 'react';
import { routeExternalLinks } from '@/infra/desktop/desktop';
import { registerServiceWorker } from '@/infra/pwa/registerSw';
import { useProjectStore } from '@/store/projectStore';
import { usePwaStore, type BeforeInstallPromptEvent } from '@/store/pwaStore';

/** Service worker, connection state, install prompt and the unsent-changes counter (no UI). */
export function PwaBootstrap() {
  useEffect(() => {
    const pwa = usePwaStore.getState();
    pwa.init();
    registerServiceWorker((w) => usePwaStore.getState().setWaiting(w));
    const unlinks = routeExternalLinks();
    const online = () => usePwaStore.getState().setOnline(true);
    const offline = () => usePwaStore.getState().setOnline(false);
    const prompt = (e: Event) => {
      e.preventDefault(); // show our own "Ilovani o‘rnatish" button instead of the mini-infobar
      usePwaStore.getState().setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const installed = () => {
      usePwaStore.getState().setInstallEvent(null);
      usePwaStore.getState().setStandalone(true);
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', installed);
    // every save appends to the outbox -> recount
    const unsub = useProjectStore.subscribe((s, prev) => {
      if (s.lastSavedAt !== prev.lastSavedAt || s.projects.length !== prev.projects.length)
        void usePwaStore.getState().refreshUnsent();
    });
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('beforeinstallprompt', prompt);
      window.removeEventListener('appinstalled', installed);
      unsub();
      unlinks();
    };
  }, []);
  return null;
}
