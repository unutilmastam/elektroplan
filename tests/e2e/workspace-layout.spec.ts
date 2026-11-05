import { expect, test } from '@playwright/test';
import { openSeededProject, SEED_ID } from './fixtures/seed';

/** PHASE 19: the plan can fill the workspace; the bottom panels fold away (tap or drag) and stay folded. */
test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
});

const height = async (page: import('@playwright/test').Page) =>
  (await page.getByTestId('plan-canvas').boundingBox())!.height;
const width = async (page: import('@playwright/test').Page) =>
  (await page.getByTestId('plan-canvas').boundingBox())!.width;

test('"Rejani kattalashtirish" gives the plan the whole workspace and back', async ({ page }) => {
  const w0 = await width(page);
  const h0 = await height(page);
  await page.getByTestId('plan-expand').click();
  await expect(page.getByTestId('plan-expand')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await width(page)) * (await height(page))).toBeGreaterThan(w0 * h0 * 1.04);
  await page.getByTestId('plan-expand').click();
  await expect.poll(() => width(page)).toBeCloseTo(w0, -1);
});

test('bottom panels fold with a tap, stay folded after a reload, unfold again; dragging down folds', async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'the bottom row exists from 1024 px');
  const rooms = page.getByRole('heading', { name: 'Xonalar ro‘yxati' });
  await expect(rooms).toBeVisible();
  const h0 = await height(page);
  const grip = page.getByTestId('panels-grip');
  await grip.click();
  await expect(rooms).toBeHidden();
  await expect.poll(() => height(page)).toBeGreaterThan(h0 + 150);
  await page.reload();
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await expect(page.getByRole('heading', { name: 'Xonalar ro‘yxati' })).toBeHidden();
  await page.getByTestId('panels-grip').click();
  await expect(page.getByRole('heading', { name: 'Xonalar ro‘yxati' })).toBeVisible();

  // drag the grip down past the minimum → folded
  const box = (await page.getByTestId('panels-grip').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + i * 40);
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Xonalar ro‘yxati' })).toBeHidden();
});
