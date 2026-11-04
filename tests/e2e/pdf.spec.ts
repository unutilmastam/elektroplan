import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openSeededProject, SEED_ID } from './fixtures/seed';

test('Eksport PDF builds an A4 PDF on the device and downloads it ', async ({ page }) => {
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  const btn = page.locator('header').getByRole('button', { name: 'Eksport PDF' });
  await expect(btn).toBeEnabled();
  const t0 = Date.now();
  const [download] = await Promise.all([page.waitForEvent('download'), btn.click()]);
  expect(Date.now() - t0).toBeLessThan(5000);
  expect(download.suggestedFilename()).toBe('Sinov_uyi_elektroplan.pdf');
  const bytes = readFileSync((await download.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(50_000);
  await expect(page.getByRole('status')).toContainText('PDF tayyor');
});
