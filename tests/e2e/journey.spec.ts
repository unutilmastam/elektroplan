import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import {
  drag,
  expectStored,
  liveRooms,
  newProject,
  pickTool,
  storedProject,
  tapWorld,
  unit,
} from './fixtures/app';
import { WEBKIT_OFFLINE_SKIP } from './fixtures/network';

/**
 * PHASE 13 — the whole job on every device profile, start to finish, on a project drawn through the UI:
 * loyiha → xonalar → nuqtalar → devor ko‘rinishi → montaj → PDF → oflayn → sinxron.
 */
test.use({ serviceWorkers: 'allow' });

type Pt = { id: string; wallId: string | null; status: string; deletedAt: string | null };
const livePoints = async (page: Page) =>
  ((await storedProject(page)) as unknown as { points: Pt[] }).points.filter((p) => p.deletedAt === null);
const chip = (page: Page, name: string) =>
  page.getByRole('toolbar', { name: 'Elektr belgilar' }).getByRole('button', { name, exact: true });
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test('full job: draw → points → wall view → montaj → PDF → offline → sync', async ({
  page,
  context,
  request,
  browserName,
}, info) => {
  test.setTimeout(120_000);

  // 1. project + two rooms drawn with the rectangle tool
  await newProject(page, 'To‘liq ish');
  const projectUrl = page.url();
  const u = await unit(page);
  await pickTool(page, 'To‘rtburchak xona');
  await drag(page, [-160 * u, -100 * u], [0, 0]);
  await drag(page, [0, -100 * u], [120 * u, 0]);
  await expectStored(page, (p) => liveRooms(p).length === 2);

  // 2. electrical points next to walls (snap onto the wall, default heights)
  await chip(page, 'Rozetka').click();
  await tapWorld(page, -80 * u, -100 * u + 10);
  await chip(page, 'Viklyuchatel').click();
  await tapWorld(page, 120 * u - 10, -50 * u);
  await expect
    .poll(async () => (await livePoints(page)).filter((p) => p.wallId).length, { timeout: 5000 })
    .toBe(2);

  // 3. wall view of the socket's wall shows the socket
  const [socket] = await livePoints(page);
  await page
    .getByRole('toolbar', { name: 'Chizma asboblari' })
    .getByRole('button', { name: /^Tanlash/ })
    .click();
  await tapWorld(page, -80 * u, -100 * u + 10);
  if (!wide(page)) await page.getByRole('tab', { name: 'Devor' }).click();
  const elevation = page.getByTestId('wall-elevation').filter({ visible: true }).first();
  await expect(elevation.locator(`[data-point-id="${socket!.id}"]`)).toBeVisible();

  // 4. montaj rejimi: the next open point is marked done
  await page.goto(projectUrl.replace('/editor/', '/install/'));
  await expect(page.getByText('0/2').first()).toBeVisible();
  await page.getByRole('button', { name: 'Keyingi bajarilmagan nuqta' }).click();
  await page.getByTestId('status-sheet').getByRole('radio', { name: 'Bajarildi' }).click();
  await expect(page.getByText('1/2').first()).toBeVisible();

  // 5. PDF on the device
  await page.goto(projectUrl);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  const [pdf] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('header').getByRole('button', { name: 'Eksport PDF' }).click(),
  ]);
  expect(
    readFileSync((await pdf.path())!)
      .subarray(0, 5)
      .toString(),
  ).toBe('%PDF-');

  // 6. airplane mode: the project opens from the device, montaj goes on
  const offline = browserName !== 'webkit';
  if (offline) {
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: 30_000 })
      .toBe(true);
    await context.setOffline(true);
  } else info.annotations.push({ type: 'skip-step', description: `6 offline: ${WEBKIT_OFFLINE_SKIP}` });
  await page.goto(projectUrl.replace('/editor/', '/install/'));
  if (offline) await expect(page.getByTestId('offline-badge').first()).toBeVisible();
  await page.getByRole('button', { name: 'Keyingi bajarilmagan nuqta' }).click();
  await page.getByTestId('status-sheet').getByRole('radio', { name: 'Bajarildi' }).click();
  await expect(page.getByText('2/2').first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('2/2').first()).toBeVisible();
  if (offline) await context.setOffline(false);

  // 7. account + sync: the finished job is on the server, nothing waits in the outbox
  const health = await request.get('/api/health').catch(() => null);
  test.skip(!health || health.status() !== 200, 'API / database not available — steps 1–6 passed');
  await page.goto('/login/');
  await page.getByRole('tab', { name: 'Yangi akkaunt' }).click();
  await page.getByLabel('Ismingiz').fill('Usta');
  await page
    .getByLabel('Telefon raqam yoki email')
    .fill(`journey-${info.project.name}-${Date.now()}@test.uz`);
  await page.getByLabel('Parol').fill('maxfiy-parol-1');
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'akkauntga biriktirildi' })).toBeVisible({
    timeout: 15_000,
  });
  await page.goto(projectUrl);
  await expect
    .poll(async () => (await storedProject(page)) as unknown as { revision: number }, { timeout: 15_000 })
    .toMatchObject({ revision: 1 });
  await expect(page.locator('[data-testid="sync-badge"][data-state="synced"]').first()).toBeVisible({
    timeout: 15_000,
  });
});
