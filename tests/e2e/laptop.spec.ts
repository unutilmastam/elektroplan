/** Regression (2026-11-07): on a laptop-height screen the placing banner covered the top wall, taps did nothing. */
import { test } from '@playwright/test';
import { expectStored, tapWorld } from './fixtures/app';
import { openSeededProject, SEED_ID } from './fixtures/seed';

for (const dpr of [1, 0.8]) {
  test(`add a socket (dpr ${dpr})`, async ({ browser }, info) => {
    test.skip(info.project.name !== 'desktop-windows');
    const ctx = await browser.newContext({
      viewport: { width: Math.round(1366 / dpr), height: Math.round(720 / dpr) },
      deviceScaleFactor: dpr,
    });
    const page = await ctx.newPage();
    await openSeededProject(page);
    await page.goto(`/editor/?id=${SEED_ID}`);
    await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
    await page
      .getByRole('toolbar', { name: 'Elektr belgilar' })
      .getByRole('button', { name: 'Rozetka', exact: true })
      .click();
    await tapWorld(page, 80, 12);
    await expectStored(page, (p) => (p as unknown as { points: unknown[] }).points.length === 3);
    await page
      .getByRole('toolbar', { name: 'Elektr belgilar' })
      .getByRole('button', { name: 'Viklyuchatel', exact: true })
      .click();
    await tapWorld(page, 250, 188);
    await expectStored(page, (p) => (p as unknown as { points: unknown[] }).points.length === 4);
    await ctx.close();
  });
}

test('adding a socket on the phone and the iPad', async ({ page }, info) => {
  test.skip(!['iphone', 'ipad-landscape', 'android'].includes(info.project.name));
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page
    .getByRole('toolbar', { name: 'Elektr belgilar' })
    .getByRole('button', { name: 'Rozetka', exact: true })
    .click();
  await tapWorld(page, 80, 12);
  await expectStored(page, (p) => (p as unknown as { points: unknown[] }).points.length === 3);
});
