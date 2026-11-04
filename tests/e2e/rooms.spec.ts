import { expect, test } from '@playwright/test';
import {
  drag,
  expectStored,
  liveRooms,
  liveWalls,
  newProject,
  pickTool,
  shakyOutline,
  storedProject,
  tapWorld,
  unit,
} from './fixtures/app';
import { worldMapper, worldToPage } from './fixtures/seed';

const isRect = (vs: Array<{ x: number; y: number }>) =>
  vs.length === 4 && new Set(vs.map((v) => v.x)).size === 2 && new Set(vs.map((v) => v.y)).size === 2;

test('two rectangle rooms share one wall; no sizes are asked', async ({ page }) => {
  await newProject(page);
  const u = await unit(page);
  await pickTool(page, 'To‘rtburchak xona');
  await drag(page, [-160 * u, -100 * u], [0 * u, 0 * u]);
  await drag(page, [0 * u, -100 * u], [120 * u, 0 * u]);
  if ((page.viewportSize()?.width ?? 0) >= 600) {
    await expect(page.getByRole('button', { name: /^Xona 1/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Xona 2/ })).toBeVisible();
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expectStored(page, (p) => liveRooms(p).length === 2 && liveWalls(p).length === 7);
  const p = await storedProject(page);
  expect(liveWalls(p).filter((w) => w.roomIds.length === 2)).toHaveLength(1);
});

test('a shaky hand-drawn rectangle becomes a clean rectangle; one undo shows the raw sketch', async ({
  page,
}) => {
  await newProject(page);
  const u = await unit(page);
  await pickTool(page, 'Qo‘lda chizish');
  const pts = shakyOutline(
    [
      [-150 * u, -90 * u],
      [130 * u, -90 * u],
      [130 * u, 90 * u],
      [-150 * u, 90 * u],
    ],
    4 * u,
    6 * u,
  );
  const toPage = await worldMapper(page);
  const first = toPage(...pts[0]!);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const q of pts.slice(1)) {
    const s = toPage(...q);
    await page.mouse.move(s.x, s.y);
  }
  await page.mouse.up();
  await expectStored(page, (p) => liveRooms(p).length === 1 && isRect(liveRooms(p)[0]!.vertices));
  const vs = liveRooms(await storedProject(page))[0]!.vertices;
  const xs = vs.map((v) => v.x);
  const ys = vs.map((v) => v.y);
  // on the 20-unit grid, within one grid step of what was drawn
  expect(vs.every((v) => v.x % 20 === 0 && v.y % 20 === 0)).toBe(true);
  expect(Math.abs(Math.min(...xs) + 150 * u)).toBeLessThanOrEqual(20);
  expect(Math.abs(Math.max(...xs) - 130 * u)).toBeLessThanOrEqual(20);
  expect(Math.abs(Math.min(...ys) + 90 * u)).toBeLessThanOrEqual(20);
  expect(Math.abs(Math.max(...ys) - 90 * u)).toBeLessThanOrEqual(20);
  await page.getByRole('button', { name: 'Bekor qilish' }).click();
  await expectStored(page, (p) => liveRooms(p).length === 1 && !isRect(liveRooms(p)[0]!.vertices));
  await page.getByRole('button', { name: 'Qaytarish' }).click();
  await expectStored(page, (p) => isRect(liveRooms(p)[0]!.vertices));
});

test('freeform room: tap corners and close on the first one (L shape)', async ({ page }) => {
  await newProject(page);
  const u = await unit(page);
  await pickTool(page, 'Erkin xona');
  for (const [x, y] of [
    [-100, -100],
    [100, -100],
    [100, 0],
    [0, 0],
    [0, 100],
    [-100, 100],
    [-100, -100],
  ] as const)
    await tapWorld(page, x * u, y * u);
  await expectStored(page, (p) => liveRooms(p).length === 1 && liveRooms(p)[0]!.vertices.length === 6);
});

test('dragging the shared wall stretches both rooms; rename + colour from the room panel persist', async ({
  page,
}) => {
  await newProject(page);
  const u = await unit(page);
  await pickTool(page, 'To‘rtburchak xona');
  await drag(page, [-160 * u, -100 * u], [0 * u, 0 * u]);
  await drag(page, [0 * u, -100 * u], [120 * u, 0 * u]);
  await page.getByRole('button', { name: /Tanlash/ }).click();
  await drag(page, [0 * u, -50 * u], [40 * u, -50 * u]); // select + drag the shared wall
  await expectStored(page, (p) => liveRooms(p).every((r) => r.vertices.some((v) => v.x > 0)));

  // double tap a room → name field focused
  const c = await worldToPage(page, -80 * u, -50 * u);
  await page.mouse.dblclick(c.x, c.y);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const name = page.locator('aside:visible').getByLabel('Nomi');
    await expect(name).toBeFocused();
    await name.fill('Mehmonxona');
    await name.press('Enter');
    await page.locator('aside:visible').getByRole('radio', { name: 'Yashil' }).click();
    await expectStored(page, (p) =>
      liveRooms(p).some((r) => r.name === 'Mehmonxona' && r.color === '#22c55e'),
    );
    await page.reload();
    await expect(page.getByRole('button', { name: /^Mehmonxona/ })).toBeVisible();
  }
});

test('door on a wall; an outer wall alone cannot be deleted (message shown)', async ({ page }) => {
  await newProject(page);
  const u = await unit(page);
  await pickTool(page, 'To‘rtburchak xona');
  await drag(page, [-160 * u, -100 * u], [0 * u, 0 * u]);
  await pickTool(page, 'Eshik');
  await tapWorld(page, -80 * u, 0 * u);
  await expectStored(page, (p) => p.openings.length === 1 && p.openings[0]!.kind === 'door');
  await page.getByRole('button', { name: /Tanlash/ }).click();
  await tapWorld(page, -160 * u, -50 * u); // left outer wall
  await page.keyboard.press('Delete');
  await expect(page.getByRole('status')).toContainText('tashqi devorini');
  expect(liveWalls(await storedProject(page))).toHaveLength(4);
});

test('finger sketch on a touch screen is straightened (Chromium touch emulation)', async ({
  page,
  browserName,
  context,
}) => {
  test.skip(browserName !== 'chromium', 'CDP touch is Chromium-only; straightening is unit-tested');
  await newProject(page);
  const u = await unit(page);
  await pickTool(page, 'Qo‘lda chizish');
  const cdp = await context.newCDPSession(page);
  const pts = shakyOutline(
    [
      [-90 * u, -70 * u],
      [90 * u, -70 * u],
      [90 * u, 70 * u],
      [-90 * u, 70 * u],
    ],
    3 * u,
    5 * u,
  );
  const send = async (type: 'touchStart' | 'touchMove' | 'touchEnd', q?: [number, number]) => {
    const s = q ? await worldToPage(page, ...q) : null;
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: s ? [{ x: s.x, y: s.y, id: 0 }] : [] });
  };
  await send('touchStart', pts[0]);
  for (const q of pts.slice(1)) await send('touchMove', q);
  await send('touchEnd');
  await expectStored(page, (p) => liveRooms(p).length === 1 && isRect(liveRooms(p)[0]!.vertices));
});
