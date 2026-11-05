import { expect, test } from '@playwright/test';
import { openSeededProject, worldToPage } from './fixtures/seed';

test('symbol gallery: all 12 symbols, sizes, colours and the zoom strip', async ({ page }) => {
  await page.goto('/settings/');
  await page.getByRole('link', { name: /Belgilar galereyasi/ }).click();
  await expect(page).toHaveURL(/\/settings\/symbols\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Belgilar galereyasi' })).toBeVisible();
  await expect(page.getByTestId('gallery-symbol')).toHaveCount(12);
  await expect(page.getByTestId('zoom-strip').locator('canvas').first()).toBeAttached();
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
});

test('picking a symbol starts placement mode with a preview; Escape ends it', async ({ page }) => {
  await openSeededProject(page);
  await page
    .getByRole('toolbar', { name: 'Elektr belgilar' })
    .getByRole('button', { name: 'Internet' })
    .click();
  await expect(page.getByText('Internet — joylashtirish')).toBeVisible();
  const p = await worldToPage(page, 150, 100); // middle of a room, far from walls
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  await expect(page.getByText(/Belgini devor yoniga bosing/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Internet — joylashtirish')).toBeHidden();
  await expect(page.getByRole('button', { name: /^Tanlash/ })).toHaveAttribute('aria-pressed', 'true');
});

test('"Tugatish" button leaves placement mode (touch devices)', async ({ page }) => {
  await openSeededProject(page);
  await page.getByRole('toolbar', { name: 'Elektr belgilar' }).getByRole('button', { name: 'TV' }).click();
  await page.getByRole('button', { name: 'Tugatish' }).click();
  await expect(page.getByText('TV — joylashtirish')).toBeHidden();
});
