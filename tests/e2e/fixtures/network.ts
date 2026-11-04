import type { BrowserContext } from '@playwright/test';

/**
 * "No connection to the server" for a device.
 * Chromium: real offline (context.setOffline) — pages then come from the service worker.
 * WebKit: Playwright's WebKit cannot serve navigations from a service worker while offline ("internal
 * error"), so there the server is made unreachable instead (every /api request fails like a dropped
 * connection). The sync logic sees exactly the same failures; real Safari offline is on the manual list.
 */
export async function cutConnection(ctx: BrowserContext, browserName: string) {
  if (browserName === 'webkit') await ctx.route('**/api/**', (r) => r.abort('internetdisconnected'));
  else await ctx.setOffline(true);
}

export async function restoreConnection(ctx: BrowserContext, browserName: string) {
  if (browserName === 'webkit') await ctx.unroute('**/api/**');
  else await ctx.setOffline(false);
}

export const WEBKIT_OFFLINE_SKIP =
  'Playwright WebKit cannot load pages from a service worker while offline; covered on the Chromium profiles and on real Safari (docs/MANUAL_TEST.md §5)';
