import { devices, expect, test, type Browser } from '@playwright/test';
import { seedProject } from './fixtures/seed';

/**
 * PHASE 15: every screen fits on phones (small / large, portrait / landscape), Android tablets and iPads:
 * no sideways scrolling, nothing pushed off screen, the page itself never scrolls (panels scroll inside).
 * Runs once (desktop profile) and opens its own device contexts. The full audit with screenshots:
 * scripts/audit-layout.mjs.
 */
const DEVICES: Array<[string, Parameters<Browser['newContext']>[0]]> = [
  ['iPhone SE (320)', devices['iPhone SE']],
  ['Galaxy S24 (360)', devices['Galaxy S24']],
  ['iPhone 15 Pro Max', devices['iPhone 15 Pro Max']],
  ['iPhone landscape', devices['iPhone 14 landscape']],
  ['Galaxy Tab S9', devices['Galaxy Tab S9']],
  ['iPad Mini', devices['iPad Mini']],
  ['iPad Mini landscape', devices['iPad Mini landscape']],
];
const SCREENS = [
  '/',
  '/projects/',
  `/editor/?id=${seedProject.id}`,
  `/install/?id=${seedProject.id}`,
  '/settings/',
  '/login/',
  '/pro/',
];

test('all screens fit every device size', async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop-windows', 'runs once, opens its own device contexts');
  test.setTimeout(240_000);
  const problems: string[] = [];
  for (const [name, dev] of DEVICES) {
    const ctx = await browser.newContext({ ...dev, baseURL, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto('/projects/');
    await page.getByText('Hali loyiha yo‘q').waitFor();
    await page.evaluate(async (p) => {
      const db: IDBDatabase = await new Promise((res) => {
        const r = indexedDB.open('elektroplan');
        r.onsuccess = () => res(r.result);
      });
      await new Promise<void>((res) => {
        const tx = db.transaction('projects', 'readwrite');
        tx.objectStore('projects').put(p, p.id);
        tx.oncomplete = () => res();
      });
      db.close();
    }, seedProject);
    for (const url of SCREENS) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const vw = innerWidth;
        const de = document.documentElement;
        const off: string[] = [];
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if (b.right <= vw + 1 && b.left >= -1) continue;
          let clipped = false;
          for (let p = el.parentElement; p; p = p.parentElement)
            if (getComputedStyle(p).overflowX !== 'visible') clipped = true;
          if (!clipped && getComputedStyle(el).position !== 'fixed')
            off.push(
              (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.tagName).slice(0, 30),
            );
        }
        return { h: de.scrollWidth - innerWidth, v: de.scrollHeight - innerHeight, off: off.slice(0, 3) };
      });
      if (r.h > 1) problems.push(`${name} ${url}: page scrolls sideways by ${r.h}px`);
      if (r.v > 1) problems.push(`${name} ${url}: page scrolls vertically by ${r.v}px`);
      for (const o of r.off) problems.push(`${name} ${url}: off screen "${o}"`);
    }
    await ctx.close();
  }
  expect(problems).toEqual([]);
});
