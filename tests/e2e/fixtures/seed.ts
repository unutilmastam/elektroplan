import type { Page } from '@playwright/test';

/** A small two-room project written straight into IndexedDB (drawing tools arrive in Phase 4). */
const NOW = '2026-11-03T10:00:00.000Z';
const st = { createdAt: NOW, updatedAt: NOW, deletedAt: null };
const v = (x: number, y: number) => ({ x, y });
const wall = (id: string, a: [number, number], b: [number, number], roomIds: string[]) => ({
  id,
  a: v(...a),
  b: v(...b),
  thickness: 16,
  roomIds,
  name: null,
  ...st,
});
const point = (
  id: string,
  symbolId: string,
  roomId: string,
  wallId: string,
  t: number,
  x: number,
  y: number,
  dist: number,
  h: number,
) => ({
  id,
  symbolId,
  roomId,
  wallId,
  t,
  side: 1,
  x,
  y,
  mountHeightCm: h,
  distanceFromCornerCm: dist,
  description: '',
  color: symbolId.startsWith('switch') ? '#ef4444' : '#3b8bff',
  label: null,
  status: 'pending',
  statusChangedAt: null,
  ...st,
});

export const SEED_ID = 'e2e-seed-project';

export const seedProject = {
  id: SEED_ID,
  ownerId: null,
  name: 'Sinov uyi',
  customerName: 'Test',
  address: 'Toshkent',
  revision: 0,
  rooms: [
    {
      id: 'rA',
      name: 'Mehmonxona',
      color: '#0d1628',
      shape: 'rect',
      vertices: [v(0, 0), v(300, 0), v(300, 200), v(0, 200)],
      labelOffset: v(0, 0),
      order: 0,
      ...st,
    },
    {
      id: 'rB',
      name: 'Oshxona',
      color: '#0d1628',
      shape: 'rect',
      vertices: [v(300, 0), v(500, 0), v(500, 200), v(300, 200)],
      labelOffset: v(0, 0),
      order: 1,
      ...st,
    },
  ],
  walls: [
    wall('w1', [0, 0], [300, 0], ['rA']),
    wall('w2', [300, 0], [300, 200], ['rA', 'rB']),
    wall('w3', [300, 200], [0, 200], ['rA']),
    wall('w4', [0, 200], [0, 0], ['rA']),
    wall('w5', [300, 0], [500, 0], ['rB']),
    wall('w6', [500, 0], [500, 200], ['rB']),
    wall('w7', [500, 200], [300, 200], ['rB']),
  ],
  points: [
    point('p1', 'socket-double', 'rA', 'w1', 0.5, 150, 22, 150, 30),
    point('p2', 'switch-single', 'rB', 'w6', 0.5, 478, 100, 100, 90),
  ],
  openings: [],
  settings: {
    gridSize: 20,
    snapToGrid: true,
    defaultSocketHeightCm: 30,
    defaultSwitchHeightCm: 90,
    wallDisplayHeightCm: 270,
  },
  ...st,
};

/** Opens the app once (creates the DB), writes the seed project, marks it last opened, reloads home. */
export async function openSeededProject(page: Page) {
  await page.goto('/projects/');
  await page.getByText('Hali loyiha yo‘q').waitFor();
  await page.evaluate(async (project) => {
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open('elektroplan');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(['projects', 'meta'], 'readwrite');
      tx.objectStore('projects').put(project, project.id);
      tx.objectStore('meta').put(project.id, 'lastOpenedProjectId');
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, seedProject);
  await page.goto('/');
  await page.getByRole('heading', { level: 1, name: 'Sinov uyi' }).waitFor();
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
}

/** Page coordinates of a world point on the plan canvas. */
export async function worldToPage(page: Page, x: number, y: number) {
  const host = page.getByTestId('plan-canvas');
  const box = (await host.boundingBox())!;
  const [vx, vy, s] = await host.evaluate((el) => [
    Number(el.dataset.vx),
    Number(el.dataset.vy),
    Number(el.dataset.scale),
  ]);
  return { x: box.x + vx! + x * s!, y: box.y + vy! + y * s! };
}
