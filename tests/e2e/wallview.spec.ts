import { expect, test, type Page } from '@playwright/test';
import { expectStored, tapWorld } from './fixtures/app';
import { openSeededProject, SEED_ID, worldToPage } from './fixtures/seed';

type P = {
  id: string;
  x: number;
  y: number;
  mountHeightCm: number | null;
  distanceFromCornerCm: number | null;
  wallId: string | null;
};
const pts = (s: unknown) => (s as { points: P[] }).points;
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/** The wall view is in the bottom row on ≥1024; below it lives in the "Devor" tab (phones: open the sheet). */
async function wallView(page: Page) {
  if (!wide(page)) {
    await page.getByRole('tab', { name: 'Devor' }).click();
  }
  return page.getByTestId('wall-elevation').filter({ visible: true });
}

test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
});

test('selecting on the plan selects in the wall view, and the other way round', async ({ page }) => {
  await tapWorld(page, 150, 22); // p1 on the top wall of Mehmonxona
  const view = await wallView(page);
  const p1 = view.locator('[data-point-id="p1"]');
  await expect(p1).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/Mehmonxona – Shimol devori/).filter({ visible: true }).first()).toBeVisible();

  // select the wall (empty wall face) → point deselected, then tap the point in the wall view
  await view.click({ position: { x: 30, y: 20 } });
  await expect(p1).toHaveAttribute('aria-pressed', 'false');
  await p1.click();
  await expect(p1).toHaveAttribute('aria-pressed', 'true');
  if (wide(page))
    await expect(
      page.getByTestId('point-panel').filter({ visible: true }).getByLabel('Chap burchakdan:'),
    ).toHaveValue('150');
});

test('dragging in the wall view edits distance (horizontal) and height (vertical); the plan follows; undo restores', async ({
  page,
}) => {
  await tapWorld(page, 150, 22);
  const view = await wallView(page);
  const btn = view.locator('[data-point-id="p1"]');
  const b = (await btn.boundingBox())!;
  const before = pts(await (await import('./fixtures/app')).storedProject(page)).find((p) => p.id === 'p1')!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 40, b.y + b.height / 2 - 25, { steps: 6 });
  await page.mouse.up();
  await expectStored(page, (s) => {
    const p = pts(s).find((x) => x.id === 'p1')!;
    return (
      p.distanceFromCornerCm! > 150 &&
      p.mountHeightCm! > 30 &&
      p.x > before.x &&
      p.distanceFromCornerCm! % 5 === 0
    );
  });
  // plan and wall view agree: the badge on the plan moved right
  const moved = pts(await (await import('./fixtures/app')).storedProject(page)).find((p) => p.id === 'p1')!;
  expect(Math.round(moved.x)).toBe(moved.distanceFromCornerCm);
  await page.getByRole('button', { name: 'Bekor qilish' }).click();
  await expectStored(page, (s) => {
    const p = pts(s).find((x) => x.id === 'p1')!;
    return p.distanceFromCornerCm === 150 && p.mountHeightCm === 30;
  });
});

test('editing height in the panel moves the symbol in the wall view', async ({ page }) => {
  test.skip(!wide(page), 'panel visible ≥1024 (smaller screens use the full-screen wall view test)');
  await tapWorld(page, 150, 22);
  const btn = page.getByTestId('wall-elevation').locator('[data-point-id="p1"]');
  const y0 = (await btn.boundingBox())!.y;
  await page
    .getByTestId('point-panel')
    .filter({ visible: true })
    .getByLabel('Pol’dan balandlik:')
    .fill('100');
  await expect.poll(async () => (await btn.boundingBox())!.y).toBeLessThan(y0 - 10);
  await expect(btn).toHaveAccessibleName(/balandlik 100 sm/);
});

test('full-screen wall view: switch walls, edit the selected point, close', async ({ page }) => {
  await tapWorld(page, 150, 22);
  await wallView(page);
  await page.getByRole('button', { name: 'To‘liq ekranda ochish' }).filter({ visible: true }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Devor ko‘rinishi' });
  await expect(dlg).toBeVisible();
  await dlg.getByLabel('Pol’dan balandlik:').fill('45');
  await expectStored(page, (s) => pts(s).find((x) => x.id === 'p1')!.mountHeightCm === 45);
  await dlg.getByRole('button', { name: 'Keyingi devor' }).click();
  await expect(dlg.getByText(/Mehmonxona – (Sharq|G‘arb|Janub) devori/)).toBeVisible();
  await dlg.getByRole('button', { name: 'Yopish' }).click();
  await expect(dlg).toBeHidden();
});

test('distance is measured from the viewer’s left corner', async ({ page }) => {
  // a socket placed near the WEST end of the bottom wall: facing south from inside, west is on the RIGHT
  await page
    .getByRole('toolbar', { name: 'Elektr belgilar' })
    .getByRole('button', { name: 'Rozetka', exact: true })
    .click();
  await tapWorld(page, 40, 190);
  await expectStored(page, (s) => pts(s).some((p) => p.wallId === 'w3' && p.distanceFromCornerCm === 260));
  const p = await worldToPage(page, 40, 190);
  expect(p.x).toBeGreaterThan(0);
});
