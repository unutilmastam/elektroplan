import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openSeededProject } from './fixtures/seed';

test('Zaxira nusxa: export all projects to .elektroplan.json and restore them on a clean device', async ({
  page,
  browser,
}, info) => {
  await openSeededProject(page);
  await page.goto('/settings/');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('backup-export-all').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.elektroplan\.json$/);
  const text = readFileSync((await download.path())!, 'utf8');
  const file = JSON.parse(text);
  expect(file).toMatchObject({ format: 'elektroplan-backup', version: 1 });
  expect(file.projects).toHaveLength(1);
  const path = info.outputPath('backup.elektroplan.json');
  writeFileSync(path, text);

  // a fresh device (new context = empty IndexedDB) restores the file
  const ctx = await browser.newContext({ ...info.project.use, baseURL: info.project.use.baseURL });
  const p2 = await ctx.newPage();
  await p2.goto('/projects/');
  await p2.getByText('Hali loyiha yo‘q').waitFor();
  await p2.goto('/settings/');
  await p2.getByTestId('backup-file').setInputFiles(path);
  await expect(p2.getByRole('status').filter({ hasText: 'Tiklandi' })).toContainText('1 ta yangi');
  await p2.goto('/projects/');
  await expect(p2.getByTestId('project-card')).toHaveCount(1);
  await expect(p2.getByText('Sinov uyi')).toBeVisible();

  // importing the same file again changes nothing (never overwrites equal / newer work)
  await p2.goto('/settings/');
  await p2.getByTestId('backup-file').setInputFiles(path);
  await expect(p2.getByRole('status').filter({ hasText: 'Tiklandi' })).toContainText('1 ta o‘zgarishsiz');

  // a broken file is refused with a clear message
  const bad = info.outputPath('bad.json');
  writeFileSync(bad, '{"hello": 1}');
  await p2.getByTestId('backup-file').setInputFiles(bad);
  await expect(p2.getByRole('status').filter({ hasText: 'Fayl' })).toContainText('buzilgan');
  await ctx.close();
});

test('per-project Zaxira nusxa from the project card', async ({ page }) => {
  await openSeededProject(page);
  await page.goto('/projects/');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('project-card').getByRole('button', { name: 'Zaxira nusxa' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^Sinov-uyi-\d{4}-\d{2}-\d{2}\.elektroplan\.json$/);
});

test('iPhone / iPad: one-time "Bosh ekranga qo‘shing" hint', async ({ browser }, info) => {
  test.skip(!/ipad|iphone/.test(info.project.name), 'iOS only');
  // clean device: the hint has not been seen yet
  const ctx = await browser.newContext({ ...info.project.use, storageState: undefined });
  const page = await ctx.newPage();
  await page.goto('/projects/');
  const hint = page.getByTestId('ios-install-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('Bosh ekranga qo‘shish');
  await hint.getByRole('button', { name: 'Tushunarli' }).click();
  await expect(hint).toHaveCount(0);
  await page.reload();
  await page.getByRole('heading', { level: 1, name: 'Loyihalar' }).waitFor();
  await page.waitForTimeout(500);
  await expect(hint).toHaveCount(0);
  await ctx.close();
});
