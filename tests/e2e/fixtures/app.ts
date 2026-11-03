import { expect, type Page } from '@playwright/test';
import { worldToPage } from './seed';

export interface StoredProject {
  id: string;
  rooms: Array<{
    id: string;
    name: string;
    color: string;
    vertices: Array<{ x: number; y: number }>;
    deletedAt: string | null;
  }>;
  walls: Array<{
    id: string;
    roomIds: string[];
    deletedAt: string | null;
    a: { x: number; y: number };
    b: { x: number; y: number };
  }>;
  openings: Array<{ id: string; kind: string }>;
}

/** Creates an empty project through the UI and lands on the editor. */
export async function newProject(page: Page, name = 'Chizma') {
  await page.goto('/projects/');
  await page.getByRole('button', { name: 'Yangi loyiha' }).first().click();
  await page.getByRole('dialog').getByLabel('Loyiha nomi').fill(name);
  await page.getByRole('dialog').getByRole('button', { name: 'Yaratish' }).click();
  await expect(page).toHaveURL(/\/editor\/\?id=/);
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
}

/** Reads the open project from IndexedDB (what is really saved). */
export async function storedProject(page: Page): Promise<StoredProject> {
  const id = new URL(page.url()).searchParams.get('id')!;
  return page.evaluate(async (pid) => {
    const db: IDBDatabase = await new Promise((res) => {
      const r = indexedDB.open('elektroplan');
      r.onsuccess = () => res(r.result);
    });
    const p = await new Promise((res) => {
      const g = db.transaction('projects').objectStore('projects').get(pid);
      g.onsuccess = () => res(g.result);
    });
    db.close();
    return p as StoredProject;
  }, id);
}

export const liveRooms = (p: StoredProject) => p.rooms.filter((r) => r.deletedAt === null);
export const liveWalls = (p: StoredProject) => p.walls.filter((w) => w.deletedAt === null);

/** Polls IndexedDB until `check` passes (edits are written after a short debounce). */
export async function expectStored(page: Page, check: (p: StoredProject) => boolean) {
  await expect.poll(async () => check(await storedProject(page)), { timeout: 5000 }).toBe(true);
}

export async function drag(page: Page, from: [number, number], to: [number, number], steps = 8) {
  const a = await worldToPage(page, ...from);
  const b = await worldToPage(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps });
  await page.mouse.up();
}

export async function tapWorld(page: Page, x: number, y: number) {
  const p = await worldToPage(page, x, y);
  await page.mouse.click(p.x, p.y);
}

/** A shaky closed outline around `corners` (deterministic wobble), world units. */
export function shakyOutline(corners: Array<[number, number]>, amp = 4, step = 6): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const ring = [...corners, corners[0]!];
  let k = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i]!;
    const [x1, y1] = ring[i + 1]!;
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let j = 0; j < n; j++) {
      k++;
      out.push([
        x0 + ((x1 - x0) * j) / n + Math.sin(k * 1.3) * amp,
        y0 + ((y1 - y0) * j) / n + Math.cos(k * 0.7) * amp,
      ]);
    }
  }
  out.push([corners[0]![0] + 5, corners[0]![1] + 4]);
  return out;
}

/** Choose a drawing tool through the toolbar flyout (works without a keyboard). */
export async function pickTool(page: Page, name: string) {
  await page.getByRole('button', { name: 'Chizish asboblari' }).click();
  await page.getByRole('menuitemradio', { name }).click();
}

/** Shape scale for the screen: phones get smaller drawings so they stay clear of the toolbar. */
export async function unit(page: Page): Promise<number> {
  const box = (await page.getByTestId('plan-canvas').boundingBox())!;
  return Math.min(1, (box.width - 140) / 400, (box.height - 60) / 260);
}
