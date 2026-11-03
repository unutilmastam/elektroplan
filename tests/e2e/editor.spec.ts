import { expect, test, type Page } from '@playwright/test';
import { openSeededProject, worldToPage } from './fixtures/seed';

const pointPanel = (page: Page) => page.locator('aside:visible').filter({ hasText: 'Tanlangan nuqta' });
const fromCorner = (page: Page) => pointPanel(page).getByLabel('Chap burchakdan:');
const undoBtn = (page: Page) => page.getByRole('button', { name: 'Bekor qilish' });
const redoBtn = (page: Page) => page.getByRole('button', { name: 'Qaytarish' });
const status = (page: Page) => page.getByText('Jami', { exact: true }).locator('..');

async function click(page: Page, x: number, y: number) {
  const p = await worldToPage(page, x, y);
  await page.mouse.click(p.x, p.y);
}

async function drag(page: Page, from: [number, number], to: [number, number]) {
  const a = await worldToPage(page, ...from);
  const b = await worldToPage(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await page.mouse.up();
}

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test('tap selects a point; drag slides it along its wall; undo/redo; change survives reload', async ({
  page,
}) => {
  await openSeededProject(page);
  await expect(undoBtn(page)).toBeDisabled();
  await click(page, 150, 22);
  if (wide(page)) await expect(fromCorner(page)).toHaveValue('150');

  await drag(page, [150, 22], [230, 90]); // can only slide along the top wall
  if (wide(page)) await expect(fromCorner(page)).toHaveValue('230');
  await expect(undoBtn(page)).toBeEnabled();

  await undoBtn(page).click();
  if (wide(page)) await expect(fromCorner(page)).toHaveValue('150');
  await redoBtn(page).click();
  if (wide(page)) await expect(fromCorner(page)).toHaveValue('230');

  await page.waitForTimeout(700); // debounced IndexedDB write
  await page.reload();
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await click(page, 230, 22);
  if (wide(page)) await expect(fromCorner(page)).toHaveValue('230');
  await expect(undoBtn(page)).toBeDisabled(); // history is per session
});

test('delete from the point panel, undo brings it back', async ({ page }) => {
  test.skip(!wide(page), 'point panel is a slide-over/sheet below 1024px (covered by the context-menu test)');
  await openSeededProject(page);
  await click(page, 478, 100);
  await pointPanel(page).getByRole('button', { name: 'O‘chirish' }).click();
  await expect(pointPanel(page)).toContainText('Nuqta tanlanmagan');
  await expect(status(page)).toContainText('1');
  await undoBtn(page).click();
  await expect(page.getByText('Jami', { exact: true }).locator('..')).toContainText('2');
});

test('marquee selects everything; Delete key; Ctrl+Z restores', async ({ page }) => {
  await openSeededProject(page);
  await page.getByRole('button', { name: /Ramka tanlash/ }).click();
  await drag(page, [505, 205], [-5, -5]); // from bottom-right (top-left may be under the toolbar)
  await page.keyboard.press('Delete');
  await expect(page.getByText('Reja hali bo‘sh')).toBeVisible();
  await page.keyboard.press('Control+z');
  await expect(page.getByText('Reja hali bo‘sh')).toBeHidden();
  await page.keyboard.press('Control+Shift+z');
  await expect(page.getByText('Reja hali bo‘sh')).toBeVisible();
});

test('right click opens the context menu; O‘chirish deletes the point', async ({ page }) => {
  await openSeededProject(page);
  const p = await worldToPage(page, 150, 22);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Amallar menyusi' });
  await expect(menu).toBeVisible();
  await page.waitForTimeout(500);
  await menu.getByRole('menuitem', { name: 'O‘chirish' }).click();
  await expect(menu).toBeHidden();
  await expect(undoBtn(page)).toBeEnabled();
});

test('zoom buttons, keyboard and fit change the view; empty-space drag pans', async ({ page }) => {
  await openSeededProject(page);
  const host = page.getByTestId('plan-canvas');
  const scale = async () => Number(await host.getAttribute('data-scale'));
  const s0 = await scale();
  await page.getByRole('button', { name: 'Kattalashtirish' }).click();
  expect(await scale()).toBeCloseTo(s0 * 1.2, 2);
  await page.getByRole('button', { name: 'Kichiklashtirish' }).click();
  await page.getByRole('button', { name: 'Kichiklashtirish' }).click();
  expect(await scale()).toBeCloseTo(s0 / 1.2, 2);
  await page.getByRole('button', { name: 'Ekranga sig‘dirish' }).click();
  expect(await scale()).toBeCloseTo(s0, 2);

  const vx0 = Number(await host.getAttribute('data-vx'));
  const box = (await host.boundingBox())!;
  const ex = box.x + box.width - 40;
  const ey = box.y + box.height - 30; // empty corner of the canvas
  await page.mouse.move(ex, ey);
  await page.mouse.down();
  await page.mouse.move(ex - 40, ey, { steps: 4 });
  await page.mouse.move(ex - 100, ey, { steps: 4 });
  await page.mouse.up();
  expect(Number(await host.getAttribute('data-vx'))).toBeLessThan(vx0 - 60);
});

test('two-finger pinch zooms (Chromium touch emulation)', async ({ page, browserName, context }) => {
  test.skip(browserName !== 'chromium', 'CDP touch is Chromium-only; pinch math is unit-tested');
  await openSeededProject(page);
  const host = page.getByTestId('plan-canvas');
  const s0 = Number(await host.getAttribute('data-scale'));
  const box = (await host.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const pts = (d: number) => [
    { x: cx - d, y: cy, id: 0 },
    { x: cx + d, y: cy, id: 1 },
  ];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(30) });
  for (let d = 40; d <= 90; d += 10)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Number(await host.getAttribute('data-scale'))).toBeGreaterThan(s0 * 2.5);
});

test('"Faqat Pencil bilan chizish" setting is saved on the device', async ({ page }) => {
  await page.goto('/settings/');
  const sw = page.getByRole('switch', { name: 'Faqat Pencil bilan chizish' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(200);
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Faqat Pencil bilan chizish' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
