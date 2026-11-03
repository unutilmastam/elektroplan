import { expect, test, type Page } from '@playwright/test';
import { expectStored, storedProject } from './fixtures/app';
import { openSeededProject, SEED_ID, worldToPage } from './fixtures/seed';

type P = { id: string; status: string; deletedAt: string | null; x: number; y: number };
type S = {
  points: P[];
  installLog: Array<{ pointId: string; fromStatus: string; toStatus: string; createdAt: string }>;
};
const phone = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;
const sheet = (page: Page) => page.getByTestId('status-sheet');

test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
});

test('opens from the editor; Keyingi picks an open point; big buttons set status, logged and kept after reload', async ({
  page,
}) => {
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('header').getByRole('link', { name: 'Montaj rejimi' }).click();
  await expect(page).toHaveURL(/\/install\/\?id=/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sinov uyi' })).toBeVisible();
  await expect(page.getByText('0/2').first()).toBeVisible();

  await page.getByRole('button', { name: 'Keyingi bajarilmagan nuqta' }).click();
  await expect(sheet(page)).toBeVisible();
  const done = sheet(page).getByRole('radio', { name: 'Bajarildi' });
  const box = (await done.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(60); // glove-friendly
  await done.click();
  await expect(done).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('1/2').first()).toBeVisible();

  await page.reload(); // progress never lost
  await expect(page.getByText('1/2').first()).toBeVisible();
  const s = (await storedProject(page)) as unknown as S;
  expect(s.points.filter((p) => p.status === 'completed')).toHaveLength(1);
  expect(s.installLog).toHaveLength(1);
  expect(s.installLog[0]).toMatchObject({ fromStatus: 'pending', toStatus: 'completed' });
});

test('tap a point on the plan; nothing can be moved or deleted in Montaj rejimi', async ({ page }) => {
  await page.goto(`/install/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  const a = await worldToPage(page, 150, 22);
  await page.mouse.click(a.x, a.y);
  await expect(sheet(page)).toContainText('Ikki rozetka');
  // drag the point: the plan pans, the point stays
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 60, a.y + 40, { steps: 6 });
  await page.mouse.up();
  await page.keyboard.press('Delete');
  await page.waitForTimeout(700);
  const p1 = ((await storedProject(page)) as unknown as S).points.find((p) => p.id === 'p1')!;
  expect(p1.deletedAt).toBeNull();
  expect(Math.round(p1.x)).toBe(150);
  await expect(page.getByRole('button', { name: /Chizish asboblari/ })).toHaveCount(0);
});

test('rooms and the "only open" filter; the list on phones', async ({ page }) => {
  await page.goto(`/install/?id=${SEED_ID}`);
  await page.getByRole('tab', { name: /Oshxona/ }).click();
  if (phone(page)) await page.getByRole('tab', { name: 'Ro‘yxat' }).click();
  const list = page.getByTestId('install-list');
  await expect(list.getByRole('button')).toHaveCount(1); // only Oshxona's switch
  await list.getByRole('button').first().click();
  await sheet(page).getByRole('radio', { name: 'Bajarildi' }).click();
  await expect(page.getByRole('tab', { name: /Oshxona/ })).toContainText('1/1');
  await page.getByRole('switch', { name: 'Faqat bajarilmaganlar' }).click();
  await expect(list).toContainText('Bu yerda nuqta yo‘q');
  await page.getByRole('tab', { name: /Barchasi/ }).click();
  await expect(list.getByRole('button')).toHaveCount(1);
  await expectStored(page, (s) => (s as unknown as S).installLog?.length === 1);
});

test('wall view opens from the sheet', async ({ page }) => {
  await page.goto(`/install/?id=${SEED_ID}`);
  await page.getByRole('button', { name: 'Keyingi bajarilmagan nuqta' }).click();
  await sheet(page).getByRole('button', { name: 'Devor ko‘rinishini ochish' }).click();
  await expect(page.getByRole('dialog', { name: 'Devor ko‘rinishi' })).toBeVisible();
});
