import { expect, test } from '@playwright/test';
import { expectStored, storedProject, tapWorld } from './fixtures/app';
import { openSeededProject, SEED_ID } from './fixtures/seed';

type P = { id: string; mountHeightCm: number | null; deletedAt: string | null };
const saveBtn = (page: import('@playwright/test').Page) =>
  page.locator('header').getByRole('button', { name: /^Saqlash/ });

test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
});

test('the Saqlash button shows the autosave state and saves at once', async ({ page }) => {
  await expect(saveBtn(page)).toBeEnabled();
  await page
    .getByRole('toolbar', { name: 'Elektr belgilar' })
    .getByRole('button', { name: 'Rozetka', exact: true })
    .click();
  await tapWorld(page, 220, 12);
  await expect(saveBtn(page)).toHaveAttribute('data-save-state', /dirty|saving|saved/);
  await saveBtn(page).click();
  await expect(saveBtn(page)).toHaveAttribute('data-save-state', 'saved');
  await expectStored(page, (s) => (s as unknown as { points: P[] }).points.length === 3);
});

test('reloading right after an edit (before the 500 ms pause) keeps it', async ({ page }) => {
  await page
    .getByRole('toolbar', { name: 'Elektr belgilar' })
    .getByRole('button', { name: 'Rozetka', exact: true })
    .click();
  await tapWorld(page, 220, 12);
  await page.reload(); // pagehide / beforeunload flush
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  const p = (await storedProject(page)) as unknown as { points: P[] };
  expect(p.points).toHaveLength(3);
});

test('Ctrl/⌘+S saves immediately', async ({ page }) => {
  await tapWorld(page, 150, 22);
  await page.keyboard.press('Delete');
  await page.keyboard.press('ControlOrMeta+s');
  await expectStored(
    page,
    (s) => (s as unknown as { points: P[] }).points.find((x) => x.id === 'p1')!.deletedAt !== null,
  );
});
