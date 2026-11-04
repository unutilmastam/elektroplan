/**
 * Service worker registration (Serwist worker built to /sw.js, production builds only).
 * A new version waits until the user taps "Yangilash" (no surprise reload in the middle of drawing).
 */
export function registerServiceWorker(onUpdate: (waiting: ServiceWorker) => void): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;
  const sw = navigator.serviceWorker;
  // A worker found while the page was already controlled is an UPDATE. The very first install is not —
  // decided when the worker is found, because some browsers (WebKit) deliver its 'installed' event late,
  // after the new worker has already taken control (clientsClaim), which looked like an update.
  const watch = (w: ServiceWorker | null) => {
    if (!w || !sw.controller) return;
    const check = () => w.state === 'installed' && onUpdate(w);
    check();
    w.addEventListener('statechange', check);
  };
  sw.register('/sw.js', { scope: '/' })
    .then((reg) => {
      if (reg.waiting && sw.controller) onUpdate(reg.waiting);
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      const update = () => navigator.onLine && void reg.update().catch(() => undefined);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && update());
      setInterval(update, 60 * 60 * 1000);
    })
    .catch(() => undefined); // no SW (private mode, http): the app still works online
}

/** Activates the waiting version and reloads once it controls the page. */
export function activateUpdate(waiting: ServiceWorker): void {
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}
