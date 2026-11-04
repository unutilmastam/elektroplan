import { expect, test, type Page } from '@playwright/test';
import { expectStored, tapWorld } from './fixtures/app';
import { openSeededProject, SEED_ID } from './fixtures/seed';

/** PHASE 18: optional wall length (typed) on every device layout. */
async function properties(page: Page): Promise<Page> {
  const w = page.viewportSize()?.width ?? 0;
  if (w < 600) await page.getByRole('tab', { name: 'Tanlangan' }).click();
  else if (w < 1024) await page.getByRole('button', { name: 'Nuqta xususiyatlari' }).click();
  return page;
}

type Stored = { rooms: Array<{ id: string; vertices: Array<{ x: number; y: number }> }> };
const maxX = (p: Stored, id: string) => Math.max(...p.rooms.find((r) => r.id === id)!.vertices.map((v) => v.x));
const minX = (p: Stored, id: string) => Math.min(...p.rooms.find((r) => r.id === id)!.vertices.map((v) => v.x));

test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
});

test('a wall shows its length and takes a typed one; the room stretches, the neighbour follows', async ({
  page,
}) => {
  await tapWorld(page, 220, 0); // top wall of Mehmonxona: 300 cm
  const len = (await properties(page)).getByTestId('wall-length').filter({ visible: true });
  await expect(len).toHaveValue('3 m');
  await len.fill('4');
  await len.press('Enter');
  await expectStored(page, (p) => maxX(p as unknown as Stored, 'rA') === 400);
  await expectStored(page, (p) => minX(p as unknown as Stored, 'rB') === 400);
  await expect(len).toHaveValue('4 m');

  // a nonsense length is refused with a hint, nothing changes
  await len.fill('abc');
  await len.press('Enter');
  await expect(page.getByText(/20 sm dan 100 m gacha/).filter({ visible: true })).toBeVisible();
  await expectStored(page, (p) => maxX(p as unknown as Stored, 'rA') === 400);

  // one undo puts it back
  await len.fill('');
  await len.blur();
  await page.keyboard.press('ControlOrMeta+z');
  await expectStored(page, (p) => maxX(p as unknown as Stored, 'rA') === 300);
});

test('wall sizes on the plan can be switched off in Settings', async ({ page }) => {
  await page.goto('/settings/');
  const sw = page.getByRole('switch', { name: /Devor o‘lchamlari/ });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(page.getByRole('switch', { name: /Devor o‘lchamlari/ })).toHaveAttribute('aria-checked', 'false');
});
