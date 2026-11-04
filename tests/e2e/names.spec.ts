import { expect, test, type Page } from '@playwright/test';
import { expectStored, storedProject, tapWorld } from './fixtures/app';
import { openSeededProject, SEED_ID } from './fixtures/seed';

/** Room and wall names from the properties panel, on every device layout. */
async function properties(page: Page): Promise<Page> {
  const w = page.viewportSize()?.width ?? 0;
  if (w < 600) await page.getByRole('tab', { name: 'Tanlangan' }).click();
  else if (w < 1024) await page.getByRole('button', { name: 'Nuqta xususiyatlari' }).click();
  return page;
}

test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
});

test('a wall gets an optional name; it shows in the wall view and survives a reload', async ({ page }) => {
  await tapWorld(page, 220, 0); // top wall of Mehmonxona (no point there)
  const panel = await properties(page);
  const name = panel.getByTestId('wall-name').filter({ visible: true });
  await expect(name).toBeVisible();
  await name.fill('TV devori');
  await name.press('Enter');
  await expectStored(page, (p) =>
    (p as unknown as { walls: Array<{ id: string; name: string | null }> }).walls.some(
      (x) => x.id === 'w1' && x.name === 'TV devori',
    ),
  );
  await page.reload();
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await tapWorld(page, 150, 22); // the socket on that wall → wall view of w1
  if ((page.viewportSize()?.width ?? 0) < 1024) await page.getByRole('tab', { name: 'Devor' }).click();
  await expect(
    page
      .getByText(/TV devori · Mehmonxona/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  // clearing removes the name
  await tapWorld(page, 220, 0);
  const again = (await properties(page)).getByTestId('wall-name').filter({ visible: true });
  await again.fill('');
  await again.press('Enter');
  await expectStored(page, (p) =>
    (p as unknown as { walls: Array<{ id: string; name: string | null }> }).walls.some(
      (x) => x.id === 'w1' && x.name === null,
    ),
  );
});

test('a room is renamed from its panel on every layout', async ({ page }) => {
  await tapWorld(page, 100, 120); // inside Mehmonxona
  const panel = await properties(page);
  const name = panel.getByLabel('Nomi', { exact: true }).filter({ visible: true });
  await name.fill('Bolalar xonasi');
  await name.press('Enter');
  await expectStored(page, (p) =>
    (p as unknown as { rooms: Array<{ name: string }> }).rooms.some((r) => r.name === 'Bolalar xonasi'),
  );
  const s = (await storedProject(page)) as unknown as { rooms: Array<{ id: string; name: string }> };
  expect(s.rooms.find((r) => r.id === 'rA')!.name).toBe('Bolalar xonasi');
});
