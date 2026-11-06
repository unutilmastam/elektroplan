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
