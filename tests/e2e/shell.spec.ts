import { expect, test, type Page } from '@playwright/test';

const ROUTES: Array<[path: string, heading: RegExp]> = [
  ['/projects/', /Loyihalar/],
  ['/install/', /Montaj rejimi/],
  ['/materials/', /Materiallar/],
  ['/settings/', /Sozlamalar/],
];

async function noHorizontalScroll(page: Page) {
  const [scrollW, innerW] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);
  expect(scrollW).toBeLessThanOrEqual(innerW);
}

test('dashboard opens with header, symbol bar and canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Loyiha tanlanmagan' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Elektr belgilar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yangi loyiha' }).first()).toBeVisible();
  await noHorizontalScroll(page);
});

test('every nav route opens and has no horizontal scroll', async ({ page }) => {
  for (const [path, heading] of ROUTES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await noHorizontalScroll(page);
  }
});

test('navigation links move between pages', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Asosiy menyu' }).filter({ visible: true });
  await nav.getByRole('link', { name: /Loyihalar/ }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await nav.getByRole('link', { name: /Sozlama/ }).click();
  await expect(page).toHaveURL(/\/settings\/$/);
  await nav.getByRole('link', { name: /Bosh/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Loyiha tanlanmagan' })).toBeVisible();
});

test('Montaj rejimi button opens the install route', async ({ page }) => {
  await page.goto('/');
  await page.locator('header').getByRole('link', { name: 'Montaj rejimi' }).click();
  await expect(page).toHaveURL(/\/install\//);
});

test('later-phase buttons are disabled', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Saqlash' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Eksport PDF' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Bekor qilish' })).toBeDisabled();
});

test('symbol chips select the active symbol, Boshqa opens the rest', async ({ page }) => {
  await page.goto('/');
  const bar = page.getByRole('toolbar', { name: 'Elektr belgilar' });
  await bar.getByRole('button', { name: 'Internet' }).click();
  await expect(bar.getByRole('button', { name: 'Internet' })).toHaveAttribute('aria-pressed', 'true');
  await bar.getByRole('button', { name: 'Boshqa' }).click();
  await page.getByRole('menuitemradio', { name: 'Konditsioner' }).click();
  await expect(bar.getByRole('button', { name: 'Boshqa' })).toHaveAttribute('aria-pressed', 'true');
});

test('static export does not ship demo data', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { level: 1, name: 'Loyiha tanlanmagan' })).toBeVisible();
});
