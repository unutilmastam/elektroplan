import { expect, test, type Page } from '@playwright/test';
import { drag, expectStored, storedProject, tapWorld } from './fixtures/app';
import { openSeededProject, SEED_ID } from './fixtures/seed';

type P = {
  id: string;
  wallId: string | null;
  roomId: string;
  x: number;
  y: number;
  mountHeightCm: number | null;
  deletedAt: string | null;
  status: string;
  description: string;
  color: string;
  distanceFromCornerCm: number | null;
};
const points = async (page: Page) =>
  ((await storedProject(page)) as unknown as { points: P[] }).points.filter((p) => p.deletedAt === null);
const chip = (page: Page, name: string) =>
  page.getByRole('toolbar', { name: 'Elektr belgilar' }).getByRole('button', { name, exact: true });
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test.beforeEach(async ({ page }) => {
  await openSeededProject(page);
  await page.waitForURL(/./);
  // the seed opens on "/"; storedProject() reads ?id= from the URL
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
});

test('a socket tapped near a wall snaps onto it with the default height', async ({ page }) => {
  await chip(page, 'Rozetka').click();
  await tapWorld(page, 80, 12);
  await expectStored(page, (p) => (p as unknown as { points: P[] }).points.length === 3);
  const added = (await points(page)).find((p) => p.id !== 'p1' && p.id !== 'p2')!;
  expect(added).toMatchObject({ wallId: 'w1', roomId: 'rA', mountHeightCm: 30 });
  expect(added.y).toBeGreaterThan(0); // inside the room, not on the wall line
});

test('a ceiling light goes inside the room; Shift puts a socket without a wall', async ({ page }) => {
  await chip(page, 'Lyustra').click();
  await tapWorld(page, 150, 100);
  await expectStored(page, (p) =>
    (p as unknown as { points: P[] }).points.some((x) => x.wallId === null && x.roomId === 'rA'),
  );
  await chip(page, 'Rozetka').click();
  await page.keyboard.down('Shift');
  await tapWorld(page, 400, 100);
  await page.keyboard.up('Shift');
  await expectStored(
    page,
    (p) => (p as unknown as { points: P[] }).points.filter((x) => x.wallId === null).length === 2,
  );
});

test('dragging a point to another wall re-attaches it (and changes the room)', async ({ page }) => {
  await drag(page, [150, 22], [488, 120]);
  await expectStored(page, (p) =>
    (p as unknown as { points: P[] }).points.some(
      (x) => x.id === 'p1' && x.wallId === 'w6' && x.roomId === 'rB',
    ),
  );
});

test('moving a wall carries its points', async ({ page }) => {
  await drag(page, [80, 0], [80, -40]); // select + drag the top wall of Mehmonxona
  await expectStored(page, (p) =>
    (p as unknown as { points: P[] }).points.some((x) => x.id === 'p1' && x.y < 0),
  );
});

test('every property in the panel is editable and undoable', async ({ page }) => {
  test.skip(!wide(page), 'the right panel is a slide-over / sheet below 1024px');
  await tapWorld(page, 150, 22);
  const panel = page.getByTestId('point-panel').filter({ visible: true });
  await panel.getByLabel('Pol’dan balandlik:').fill('45');
  await panel.getByLabel('Chap burchakdan:').fill('60');
  await panel.getByLabel('Izoh:').fill('Muzlatgich');
  await panel.getByRole('radio', { name: 'Yashil' }).click();
  await panel.getByRole('radio', { name: 'Bajarildi' }).click();
  await panel.getByRole('button', { name: 'Belgi turini o‘zgartirish' }).click();
  await page.getByRole('menuitemradio', { name: 'Uch rozetka' }).click();
  await expectStored(page, (p) =>
    (p as unknown as { points: Array<P & { symbolId: string }> }).points.some(
      (x) =>
        x.id === 'p1' &&
        x.mountHeightCm === 45 &&
        x.distanceFromCornerCm === 60 &&
        x.x === 60 &&
        x.description === 'Muzlatgich' &&
        x.color === '#16a34a' &&
        x.status === 'completed' &&
        x.symbolId === 'socket-triple',
    ),
  );
  await expect(page.getByText('Bajarilgan', { exact: true }).locator('..')).toContainText('1');
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Bekor qilish' }).click();
  await expectStored(page, (p) =>
    (p as unknown as { points: P[] }).points.some(
      (x) => x.id === 'p1' && x.mountHeightCm === 30 && x.status === 'pending' && x.description === '',
    ),
  );
});

test('duplicate from the panel and from the context menu', async ({ page }) => {
  await tapWorld(page, 150, 22);
  const p = await (await import('./fixtures/seed')).worldToPage(page, 150, 22);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.waitForTimeout(500);
  await page.getByRole('menu', { name: 'Amallar menyusi' }).getByRole('menuitem', { name: 'Nusxa' }).click();
  await expectStored(page, (s) => (s as unknown as { points: P[] }).points.length === 3);
  if (wide(page)) {
    await page
      .locator('aside:visible')
      .getByRole('button', { name: 'Nusxa' })
      .filter({ visible: true })
      .first()
      .click();
    await expectStored(page, (s) => (s as unknown as { points: P[] }).points.length === 4);
  }
});

test('default socket height from Sozlamalar is used for new sockets', async ({ page }) => {
  await page.goto('/settings/');
  const box = page.getByTestId('project-defaults');
  await box.getByLabel('Rozetka balandligi:').fill('40');
  await page.waitForTimeout(700);
  await page.goto(`/editor/?id=${SEED_ID}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await chip(page, 'Rozetka').click();
  await tapWorld(page, 220, 12);
  await expectStored(page, (s) =>
    (s as unknown as { points: P[] }).points.some((x) => x.mountHeightCm === 40),
  );
});
