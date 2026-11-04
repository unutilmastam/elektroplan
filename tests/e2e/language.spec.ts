import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openSeededProject, SEED_ID } from './fixtures/seed';

/** PHASE 16: Uzbek / Russian. */
test('Settings: switch to Russian — every screen follows, the choice survives a reload, back to Uzbek', async ({
  page,
}) => {
  await openSeededProject(page);
  await page.goto('/settings/');
  await page.getByTestId('lang-ru').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible();
  await expect(page.getByTestId('lang-ru')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible();

  await page.goto('/projects/');
  await expect(page.getByRole('heading', { level: 1, name: 'Проекты' })).toBeVisible();
  await expect(page.getByText('1 проект', { exact: true })).toBeVisible();
  await expect(page.getByTestId('project-card')).toContainText('2 комнаты');
  await expect(page.getByTestId('project-card')).toContainText('2 точки');

  await page.goto(`/editor/?id=${SEED_ID}`);
  await expect(
    page
      .getByRole('toolbar', { name: 'Электрические символы' })
      .getByRole('button', { name: 'Розетка', exact: true }),
  ).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Режим монтажа' })).toBeVisible();

  await page.goto(`/install/?id=${SEED_ID}`);
  await page.getByRole('button', { name: 'Следующая невыполненная точка' }).click();
  await expect(page.getByTestId('status-sheet').getByRole('radio', { name: 'Выполнено' })).toBeVisible();

  // PDF in Russian on the device
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  const [pdf] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('header').getByRole('button', { name: 'Экспорт PDF' }).click(),
  ]);
  expect(
    readFileSync((await pdf.path())!)
      .subarray(0, 5)
      .toString(),
  ).toBe('%PDF-');
  await expect(page.getByRole('status').filter({ hasText: 'PDF готов' })).toBeVisible();

  await page.goto('/settings/');
  await page.getByTestId('lang-uz').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sozlamalar' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uz');
});

test.describe('a phone set to Russian', () => {
  test.use({ locale: 'ru-RU' });
  test('opens in Russian on the first start', async ({ page }) => {
    await page.goto('/projects/');
    await expect(page.getByRole('heading', { level: 1, name: 'Проекты' })).toBeVisible();
    await expect(page.getByText('Проектов пока нет')).toBeVisible();
  });
});
