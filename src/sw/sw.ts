/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist } from 'serwist';

/**
 * ELEKTROPLAN service worker (ARCHITECTURE §4.6.1). Precaches the whole static export — every page,
 * JS/CSS chunk, font (incl. the PDF fonts) and icon — so after the first visit the app starts in
 * airplane mode. Pages are matched without their query (`/editor/?id=…` -> `/editor/`).
 * Projects are never cached here: they live in IndexedDB.
 */
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    ignoreURLParametersMatching: [/.*/],
    cleanupOutdatedCaches: true,
    concurrency: 8,
  },
  // the new version waits for "Yangilash" (activateUpdate posts SKIP_WAITING)
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // server API (Phase 12) is never cached: sync talks to the real server or fails and retries
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    // an unknown page while offline opens the app home instead of the browser error page
    entries: [{ url: '/', matcher: ({ request }) => request.destination === 'document' }],
  },
});

self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});

serwist.addEventListeners();
