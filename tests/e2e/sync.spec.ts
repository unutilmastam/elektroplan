import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { openSeededProject } from './fixtures/seed';

/**
 * PHASE 12: account + server sync in the real app (static export + PHP API + MySQL).
 * Device A (this profile) and device B (a second browser = another iPad/phone) work on the same project
 * offline and reconnect: nothing is lost. Skipped when the API has no database.
 */
test.use({ serviceWorkers: 'allow' }); // offline steps reload pages from the service worker cache

/** Waits until the service worker controls the page (the app then opens offline). */
async function offlineReady(page: Page) {
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: 30_000 })
    .toBe(true);
}

test.beforeEach(async ({ request }) => {
  const r = await request.get('/api/health').catch(() => null);
  test.skip(!r || r.status() !== 200, 'API / database not available');
});

const login = (info: TestInfo) => `e2e-${info.project.name}-${info.workerIndex}-${Date.now()}@test.uz`;
const PASSWORD = 'maxfiy-parol-1';

async function syncNow(page: Page) {
  await page.goto('/login/');
  const btn = page.getByRole('button', { name: 'Hozir sinxronlash' });
  await expect(btn).toBeEnabled();
  await btn.click();
  await expect(page.getByRole('status').filter({ hasText: 'Sinxronlandi' }).first()).toBeVisible();
  await expect(btn).toBeEnabled();
}

async function stored(page: Page, id: string) {
  return page.evaluate(async (id) => {
    const db: IDBDatabase = await new Promise((res) => {
      const r = indexedDB.open('elektroplan');
      r.onsuccess = () => res(r.result);
    });
    const get = <T>(store: string, key?: IDBValidKey) =>
      new Promise<T>((res) => {
        const tx = db.transaction(store).objectStore(store);
        const g = key === undefined ? tx.count() : tx.get(key);
        g.onsuccess = () => res(g.result as T);
      });
    const p = await get<{ ownerId: string | null; revision: number; name: string; address: string }>(
      'projects',
      id,
    );
    const outbox = await get<number>('outbox');
    db.close();
    return { ...p, outbox };
  }, id);
}

async function secondDevice(browser: Browser, info: TestInfo) {
  const ctx = await browser.newContext({ ...info.project.use, serviceWorkers: 'allow' });
  return { ctx, page: await ctx.newPage() };
}

async function editInfo(page: Page, field: 'Loyiha nomi' | 'Manzil', value: string) {
  await page.goto('/projects/');
  await page.getByTestId('project-card').getByRole('button', { name: 'Tahrirlash' }).click();
  await page.getByRole('dialog').getByLabel(field).fill(value);
  await page.getByRole('dialog').getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('register, local projects are attached to the account and saved on the server', async ({
  page,
}, info) => {
  const id = `seed-${info.project.name}-${Date.now()}`;
  await openSeededProject(page, id); // a project made before having an account
  await page.goto('/login/');
  await page.getByRole('tab', { name: 'Yangi akkaunt' }).click();
  await page.getByLabel('Ismingiz').fill('Aziz usta');
  await page.getByLabel('Telefon raqam yoki email').fill(login(info));
  await page.getByLabel('Parol').fill(PASSWORD);
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole('status').filter({ hasText: 'akkauntga biriktirildi' })).toBeVisible({
    timeout: 15_000,
  });
  await expect.poll(async () => (await stored(page, id)).revision, { timeout: 10_000 }).toBe(1);
  const s = await stored(page, id);
  expect(s.ownerId).toBeTruthy();
  expect(s.outbox).toBe(0); // nothing waits for the server
  await expect(page.getByTestId('unsent-badge')).toHaveCount(0);
  // account page
  await page.goto('/login/');
  await expect(page.getByTestId('account-name')).toHaveText('Aziz usta');
  await expect(page.getByTestId('last-sync')).toContainText('Oxirgi sinxronizatsiya');
});

test('wrong password and invalid input are explained in Uzbek', async ({ page }) => {
  await page.goto('/login/');
  await page.getByLabel('Telefon raqam yoki email').fill('12');
  await page.getByLabel('Parol').fill('123');
  await page.getByRole('button', { name: 'Kirish' }).last().click();
  await expect(page.getByText('Telefon raqam yoki email noto‘g‘ri')).toBeVisible();
  await expect(page.getByText('Parol kamida 8 ta belgidan iborat bo‘lsin')).toBeVisible();
  await page.getByLabel('Telefon raqam yoki email').fill('nobody@test.uz');
  await page.getByLabel('Parol').fill('noto-g-ri-parol');
  await page.getByRole('button', { name: 'Kirish' }).last().click();
  await expect(page.getByRole('alert').filter({ hasText: 'Login yoki parol noto‘g‘ri' })).toBeVisible();
});

test('two devices edit the same project offline, reconnect: both changes and the montaj status survive', async ({
  page,
  context,
  browser,
}, info) => {
  test.setTimeout(90_000);
  const email = login(info);
  // device A: project + account
  const id = `seed-${info.project.name}-${Date.now()}`;
  await openSeededProject(page, id);
  await page.goto('/login/');
  await page.getByRole('tab', { name: 'Yangi akkaunt' }).click();
  await page.getByLabel('Ismingiz').fill('Usta');
  await page.getByLabel('Telefon raqam yoki email').fill(email);
  await page.getByLabel('Parol').fill(PASSWORD);
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click();
  await expect.poll(async () => (await stored(page, id)).revision, { timeout: 15_000 }).toBe(1);

  // device B logs in: the project is downloaded and opens
  const b = await secondDevice(browser, info);
  await b.page.goto('/login/');
  await b.page.getByLabel('Telefon raqam yoki email').fill(email.toUpperCase());
  await b.page.getByLabel('Parol').fill(PASSWORD);
  await b.page.getByRole('button', { name: 'Kirish' }).last().click();
  await expect(b.page).toHaveURL(/\/projects\/$/);
  await expect(b.page.getByText('Sinov uyi')).toBeVisible({ timeout: 15_000 });
  await offlineReady(page);
  await offlineReady(b.page);

  // ---- both offline ----
  await context.setOffline(true);
  await b.ctx.setOffline(true);
  await editInfo(page, 'Loyiha nomi', 'Sinov uyi (iPad)');
  await editInfo(b.page, 'Manzil', 'Samarqand, Registon 1');
  await b.page.goto(`/install/?id=${id}`);
  await b.page.getByRole('button', { name: 'Keyingi bajarilmagan nuqta' }).click();
  await b.page.getByTestId('status-sheet').getByRole('radio', { name: 'Bajarildi' }).click();
  await expect(b.page.getByText('1/2').first()).toBeVisible();

  // ---- back online: B first, then A (409 -> merge), then B again ----
  await b.ctx.setOffline(false);
  await syncNow(b.page);
  await context.setOffline(false);
  await syncNow(page);
  await syncNow(b.page);

  for (const p of [page, b.page]) {
    await p.goto('/projects/');
    await expect(p.getByText('Sinov uyi (iPad)')).toBeVisible();
    await expect(p.getByText('Samarqand, Registon 1')).toBeVisible();
    await p.goto(`/install/?id=${id}`);
    await expect(p.getByText('1/2').first()).toBeVisible();
    const s = await stored(p, id);
    expect(s.outbox).toBe(0);
  }
  await b.ctx.close();
});

test('logout keeps the projects on the device', async ({ page }, info) => {
  const id = `seed-${info.project.name}-${Date.now()}`;
  await openSeededProject(page, id);
  await page.goto('/login/');
  await page.getByRole('tab', { name: 'Yangi akkaunt' }).click();
  await page.getByLabel('Ismingiz').fill('Usta');
  await page.getByLabel('Telefon raqam yoki email').fill(login(info));
  await page.getByLabel('Parol').fill(PASSWORD);
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click();
  await expect.poll(async () => (await stored(page, id)).revision, { timeout: 15_000 }).toBe(1);
  await page.goto('/login/');
  await page.getByRole('button', { name: 'Chiqish' }).click();
  await expect(
    page.getByRole('button', { name: 'Akkaunt yaratish' }).or(page.getByRole('tab', { name: 'Kirish' })),
  ).toBeVisible();
  await page.goto('/projects/');
  await expect(page.getByTestId('project-card')).toHaveCount(1);
});
