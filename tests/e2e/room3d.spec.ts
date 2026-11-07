import { expect, test, type Page } from '@playwright/test';
import { seedProject } from './fixtures/seed';

async function put(page: Page, project: unknown) {
  await page.goto('/projects/');
  await page.getByText('Hali loyiha yo‘q').waitFor();
  await page.evaluate(async (p) => {
    const db: IDBDatabase = await new Promise((res) => {
      const r = indexedDB.open('elektroplan');
      r.onsuccess = () => res(r.result);
    });
    await new Promise<void>((res) => {
      const tx = db.transaction(['projects', 'meta'], 'readwrite');
      tx.objectStore('projects').put(p, (p as { id: string }).id);
      tx.objectStore('meta').put((p as { id: string }).id, 'lastOpenedProjectId');
      tx.oncomplete = () => res();
    });
    db.close();
  }, project);
}

/** PHASE 23: a room in 3D — walls, doors, windows and the wall parts; look around by finger. */
function project() {
  const s = seedProject as unknown as { points: Array<Record<string, unknown>> };
  const pt = (
    id: string,
    symbolId: string,
    wallId: string | null,
    t: number | null,
    x: number,
    y: number,
    h: number | null,
  ) => ({
    ...s.points[0],
    id,
    symbolId,
    wallId,
    t,
    x,
    y,
    mountHeightCm: h,
    roomId: 'rA',
    color: '#3b8bff',
  });
  return {
    ...seedProject,
    openings: [
      { id: 'win', wallId: 'w1', kind: 'window', t: 0.7, width: 120, swing: 1 },
      { id: 'door', wallId: 'w4', kind: 'door', t: 0.5, width: 90, swing: 1 },
    ],
    points: [
      ...s.points,
      pt('p3', 'switch-double', 'w4', 0.15, 0, 170, 90),
      pt('p4', 'ac', 'w3', 0.5, 150, 200, 220),
      pt('p5', 'socket-quad', 'w3', 0.2, 240, 200, 30),
      pt('p6', 'ceiling-light', null, null, 150, 100, null),
      pt('p7', 'internet', 'w2', 0.4, 300, 80, 30),
    ],
  };
}

test('3D: opens from the plan, draws the room, looks around by dragging, switches room and view, closes', async ({
  page,
}, info) => {
  await put(page, project());
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  const canvas = page.getByTestId('room3d-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('room3d-room')).toHaveValue('rA');
  // something was drawn (not one flat colour)
  const colours = await canvas.evaluate((c: HTMLCanvasElement) => {
    const t = document.createElement('canvas');
    t.width = 40;
    t.height = 40;
    const g = t.getContext('2d')!;
    g.drawImage(c, 0, 0, 40, 40);
    const d = g.getImageData(0, 0, 40, 40).data;
    const set = new Set<string>();
    for (let i = 0; i < d.length; i += 16) set.add(`${d[i]! >> 4},${d[i + 1]! >> 4},${d[i + 2]! >> 4}`);
    return set.size;
  });
  expect(colours).toBeGreaterThan(5);
  const yaw0 = Number(await canvas.getAttribute('data-yaw'));
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw'))).toBeGreaterThan(yaw0 + 10);
  await page.getByRole('radio', { name: 'Tepadan' }).click();
  await expect(page.getByRole('radio', { name: 'Tepadan' })).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('room3d-marks').click();
  await expect(page.getByTestId('room3d-marks')).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('room3d-room').selectOption('rB');
  await expect(page.getByTestId('room3d-room')).toHaveValue('rB');
  if (['ipad-landscape', 'iphone'].includes(info.project.name))
    await page.screenshot({ path: `docs/screenshots/phase-23/${info.project.name}-oshxona.png` });
  await page.getByTestId('room3d-close').click();
  await expect(page.getByTestId('room3d')).toBeHidden();
});

test('3D screenshots (iPad, iPhone)', async ({ page }, info) => {
  test.skip(!['ipad-landscape', 'iphone'].includes(info.project.name));
  await put(page, project());
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  await page.getByTestId('room3d-canvas').waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `docs/screenshots/phase-23/${info.project.name}-1.png` });
  const box = (await page.getByTestId('room3d-canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 300, box.y + box.height / 2 - 60, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/screenshots/phase-23/${info.project.name}-2.png` });
  await page.getByRole('radio', { name: 'Tepadan' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/screenshots/phase-23/${info.project.name}-3.png` });
});

test('3D: drag a switch on the wall — it gets a new height and place; one undo puts it back', async ({
  page,
}) => {
  const base = project();
  const sw = {
    ...(base.points[0] as Record<string, unknown>),
    id: 'sw',
    symbolId: 'switch-single',
    wallId: 'w2',
    t: 0.5,
    x: 278,
    y: 100,
    mountHeightCm: 145,
    roomId: 'rA',
  };
  await put(page, { ...base, points: [...base.points, sw] });
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  const canvas = page.getByTestId('room3d-canvas');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  // the walk starts looking at the far wall of the room: the switch is in the middle of the screen
  const yaw0 = await canvas.getAttribute('data-yaw');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(cx + i * 8, cy + i * 14);
  await expect(page.getByTestId('room3d-dragging')).toContainText('Poldan');
  await page.mouse.up();
  const stored = async () =>
    page.evaluate(async (id) => {
      const db: IDBDatabase = await new Promise((res) => {
        const r = indexedDB.open('elektroplan');
        r.onsuccess = () => res(r.result);
      });
      const p = await new Promise<{ points: Array<{ id: string; mountHeightCm: number; t: number }> }>(
        (res) => {
          const q = db.transaction('projects').objectStore('projects').get(id);
          q.onsuccess = () => res(q.result);
        },
      );
      db.close();
      return p.points.find((x) => x.id === 'sw')!;
    }, seedProject.id);
  await expect.poll(async () => (await stored()).mountHeightCm).toBeLessThan(135);
  expect((await stored()).t).toBeGreaterThan(0.5);
  // the view did not turn while the switch was dragged
  expect(await canvas.getAttribute('data-yaw')).toBe(yaw0);
  await page.getByTestId('room3d-close').click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(async () => (await stored()).mountHeightCm).toBe(145);
});

const stick = async (page: Page, dx: number, dy: number, ms: number) => {
  const b = (await page.getByTestId('room3d-stick').boundingBox())!;
  const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.waitForTimeout(ms);
  await page.mouse.up();
};
const posOf = async (page: Page) =>
  ((await page.getByTestId('room3d-canvas').getAttribute('data-pos')) ?? '0,0').split(',').map(Number) as [
    number,
    number,
  ];

test('3D walk: the stick walks you forward, a wall stops you, the door takes you to the next room', async ({
  page,
}) => {
  await put(page, {
    ...project(),
    openings: [{ id: 'door', wallId: 'w2', kind: 'door', t: 0.5, width: 90, swing: 1 }],
  });
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  const canvas = page.getByTestId('room3d-canvas');
  await expect(canvas).toHaveAttribute('data-pos', /\d/);
  await expect(canvas).toHaveAttribute('data-room', 'rA');
  const [x0] = await posOf(page);
  // facing the door in the wall to the next room (x = 300): walk forward through it
  await stick(page, 0, -60, 2600);
  await expect.poll(async () => (await posOf(page))[0]).toBeGreaterThan(x0 + 150);
  await expect(canvas).toHaveAttribute('data-room', 'rB');
  await expect(page.getByTestId('room3d-room')).toHaveValue('rB');
  // keep walking: the far wall of rB (x = 500) stops you before it
  await stick(page, 0, -60, 2200);
  const [x1] = await posOf(page);
  expect(x1).toBeLessThan(500 - 8 - 20);
  expect(x1).toBeGreaterThan(420);
});

test('3D walk: keyboard W walks, ← turns; the room list takes you to a room', async ({ page }, info) => {
  test.skip(!['desktop-windows', 'ipad-landscape'].includes(info.project.name));
  await put(page, project());
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  const canvas = page.getByTestId('room3d-canvas');
  await expect(canvas).toHaveAttribute('data-pos', /\d/);
  const [x0] = await posOf(page);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  await expect.poll(async () => (await posOf(page))[0]).toBeGreaterThan(x0 + 30);
  const yaw = Number(await canvas.getAttribute('data-yaw'));
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowLeft');
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw'))).toBeGreaterThan(yaw + 15);
  await page.getByTestId('room3d-room').selectOption('rB');
  await expect.poll(async () => (await posOf(page))[0]).toBeGreaterThan(300);
});

test('3D add: pick a switch, tap the wall in front — a new switch at that height; Esc stops adding', async ({
  page,
}, info) => {
  await put(page, project());
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  const canvas = page.getByTestId('room3d-canvas');
  await expect(canvas).toHaveAttribute('data-pos', /\d/);
  await page.getByTestId('room3d-add-switch-single').click();
  await expect(page.getByTestId('room3d-hint')).toContainText(/Devorni bosing/);
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 - 40, box.y + box.height / 2);
  const count = async () =>
    page.evaluate(async (id) => {
      const db: IDBDatabase = await new Promise((res) => {
        const r = indexedDB.open('elektroplan');
        r.onsuccess = () => res(r.result);
      });
      const p = await new Promise<{
        points: Array<{ symbolId: string; wallId: string; mountHeightCm: number; deletedAt: string | null }>;
      }>((res) => {
        const q = db.transaction('projects').objectStore('projects').get(id);
        q.onsuccess = () => res(q.result);
      });
      db.close();
      return p.points.filter((x) => x.symbolId === 'switch-single' && x.deletedAt === null);
    }, seedProject.id);
  await expect.poll(async () => (await count()).length).toBe(2);
  const added = (await count()).find((x) => x.wallId === 'w2')!;
  expect(added.mountHeightCm).toBeGreaterThan(120);
  expect(added.mountHeightCm).toBeLessThan(170);
  if (['ipad-landscape', 'iphone'].includes(info.project.name)) {
    await page.waitForTimeout(300);
    await page.screenshot({ path: `docs/screenshots/phase-25/${info.project.name}-add.png` });
  }
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('room3d-add-switch-single')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('room3d')).toBeVisible();
});

test('3D walk screenshots (iPad, iPhone, desktop)', async ({ page }, info) => {
  test.skip(!['ipad-landscape', 'iphone', 'desktop-windows'].includes(info.project.name));
  await put(page, {
    ...project(),
    openings: [
      { id: 'win', wallId: 'w1', kind: 'window', t: 0.7, width: 120, swing: 1 },
      { id: 'door', wallId: 'w2', kind: 'door', t: 0.5, width: 90, swing: 1 },
      { id: 'win2', wallId: 'w6', kind: 'window', t: 0.5, width: 100, swing: 1 },
    ],
  });
  await page.goto(`/editor/?id=${seedProject.id}`);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.getByTestId('open-3d').click();
  await expect(page.getByTestId('room3d-canvas')).toHaveAttribute('data-pos', /\d/);
  await page.waitForTimeout(500);
  const shot = (n: string) => page.screenshot({ path: `docs/screenshots/phase-25/${info.project.name}-${n}.png` });
  await shot('1-xona');
  await stick(page, 0, -60, 1500);
  await page.waitForTimeout(200);
  await shot('2-eshikdan');
  await page.getByRole('radio', { name: 'Tepadan' }).click();
  await page.waitForTimeout(300);
  await shot('3-tepadan');
});
