import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { drag, liveRooms, pickTool, storedProject, unit } from './fixtures/app';
import { openSeededProject, SEED_ID } from './fixtures/seed';

/**
 * PHASE 11 acceptance — "airplane mode": after one online visit the app opens with NO network,
 * every saved project is listed, opens, can be edited (plan + montaj status), PDF is exported.
 */
test.use({ serviceWorkers: 'allow' });

/** First online visit: the service worker installs, precaches the app and takes control. */
async function installApp(page: Page) {
  await openSeededProject(page);
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const reg = await navigator.serviceWorker.getRegistration();
          return reg?.active?.state === 'activated' && navigator.serviceWorker.controller !== null;
        }),
      { timeout: 30_000 },
    )
    .toBe(true);
}

test('airplane mode: app opens, projects list, editor, montaj and PDF work without internet', async ({
  page,
  context,
}) => {
  await installApp(page);
  await context.setOffline(true);

  // cold start of every page from the service worker cache
  await page.goto('/projects/');
  await expect(page.getByTestId('offline-badge').first()).toBeVisible();
  await expect(page.getByTestId('project-card')).toHaveCount(1);
  await expect(page.getByText('Sinov uyi')).toBeVisible();

  // open the project (client-side navigation, RSC payload from the cache)
  await page.getByRole('link', { name: 'Ochish' }).click();
  await expect(page).toHaveURL(new RegExp(`/editor/\\?id=${SEED_ID}`));
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await expect(page.getByRole('heading', { level: 1, name: 'Sinov uyi' })).toBeVisible();

  // PDF export offline (fonts come from the precache)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('header').getByRole('button', { name: 'Eksport PDF' }).click(),
  ]);
  const bytes = readFileSync((await download.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');

  // montaj rejimi offline: mark a point done, kept after an offline reload
  await page.goto(`/install/?id=${SEED_ID}`);
  await expect(page.getByTestId('offline-badge').first()).toBeVisible();
  await page.getByRole('button', { name: 'Keyingi bajarilmagan nuqta' }).click();
  await page.getByTestId('status-sheet').getByRole('radio', { name: 'Bajarildi' }).click();
  await expect(page.getByText('1/2').first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('1/2').first()).toBeVisible();

  // the rest of the app shell also opens
  for (const [url, heading] of [
    ['/settings/', 'Sozlamalar'],
    ['/', 'Sinov uyi'],
  ] as const) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }

  // a new project is created and drawn with no internet, and survives an offline reload
  await page.goto('/projects/');
  await page.getByRole('button', { name: 'Yangi loyiha' }).first().click();
  await page.getByRole('dialog').getByLabel('Loyiha nomi').fill('Oflayn obyekt');
  await page.getByRole('dialog').getByRole('button', { name: 'Yaratish' }).click();
  await expect(page).toHaveURL(/\/editor\/\?id=/);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  const u = await unit(page);
  await pickTool(page, 'To‘rtburchak xona');
  await drag(page, [-160 * u, -100 * u], [0, 0]);
  await expect.poll(async () => liveRooms(await storedProject(page)).length, { timeout: 5000 }).toBe(1);
  await page.reload();
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await expect(page.getByRole('heading', { level: 1, name: 'Oflayn obyekt' })).toBeVisible();
  expect(liveRooms(await storedProject(page))).toHaveLength(1);
  await page.goto('/projects/');
  await expect(page.getByTestId('project-card')).toHaveCount(2);

  // back online: the badge disappears
  await context.setOffline(false);
  await expect(page.getByTestId('offline-badge')).toHaveCount(0);
});

test('new version: "Yangilash" notice, one tap activates it and reloads', async ({ page, context }) => {
  await installApp(page);
  const first = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistration())!.active!.scriptURL,
  );
  // the server now has a new build (test server hook: changed bytes in sw.js for this browser only)
  await context.addCookies([{ name: 'e2e-sw-build', value: 'next', url: page.url() }]);
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  const notice = page.getByTestId('update-notice');
  await expect(notice).toBeVisible({ timeout: 30_000 });
  await expect(notice).toContainText('yangi versiyasi tayyor');
  await Promise.all([page.waitForEvent('load'), notice.getByRole('button', { name: 'Yangilash' }).click()]);
  await page.getByRole('heading', { level: 1, name: 'Sinov uyi' }).waitFor();
  await expect(page.getByTestId('update-notice')).toHaveCount(0);
  const after = await page.evaluate(async () => {
    const reg = (await navigator.serviceWorker.getRegistration())!;
    return { waiting: reg.waiting !== null, active: reg.active!.scriptURL };
  });
  expect(after).toEqual({ waiting: false, active: first }); // same URL, new script now active
});

test('web app manifest and icons are valid for install (Android / Windows / iOS)', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const m = await (await request.get(href!)).json();
  expect(m).toMatchObject({ name: 'ElektroPlan', display: 'standalone', start_url: '/', scope: '/' });
  const sizes = (m.icons as Array<{ sizes: string; purpose: string; src: string }>).map(
    (i) => `${i.sizes}:${i.purpose}`,
  );
  expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
  for (const i of m.icons as Array<{ src: string }>) expect((await request.get(i.src)).ok()).toBe(true);
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(apple!)).ok()).toBe(true);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#05080f');
});

test('Chromium installability check passes (what Lighthouse "installable" audits)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP is Chromium only');
  await installApp(page);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: Array<{ errorId: string }>;
  };
  expect(installabilityErrors).toEqual([]);
  const { url, errors } = (await cdp.send('Page.getAppManifest')) as { url: string; errors: unknown[] };
  expect(url).toContain('/manifest.webmanifest');
  expect(errors).toEqual([]);
});
