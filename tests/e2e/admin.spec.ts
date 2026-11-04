import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { openSeededProject } from './fixtures/seed';

/** PHASE 14: free-plan limit, Pro page, admin panel (masters, Pro on, password reset), forced new password. */
const ADMIN = 'admin@e2e.uz';
const PASS = 'maxfiy-parol-1';

async function apiUp(page: Page) {
  const r = await page.request.get('/api/health').catch(() => null);
  return !!r && r.status() === 200;
}

async function register(page: Page, login: string, name: string) {
  await page.goto('/login/');
  await page.getByRole('tab', { name: 'Yangi akkaunt' }).click();
  await page.getByLabel('Ismingiz').fill(name);
  await page.getByLabel('Telefon raqam yoki email').fill(login);
  await page.getByLabel('Parol').fill(PASS);
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
}

async function loginAs(page: Page, login: string, password = PASS) {
  await page.goto('/login/');
  await page.getByLabel('Telefon raqam yoki email').fill(login);
  await page.getByLabel('Parol').fill(password);
  await page.getByRole('button', { name: 'Kirish' }).last().click();
}

/** The admin account is shared by all profiles running in parallel: create it once, then log in. */
async function asAdmin(page: Page) {
  await page.goto('/login/');
  await page.getByRole('tab', { name: 'Yangi akkaunt' }).click();
  await page.getByLabel('Ismingiz').fill('Bosh admin');
  await page.getByLabel('Telefon raqam yoki email').fill(ADMIN);
  await page.getByLabel('Parol').fill(PASS);
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click();
  const taken = page.getByText('allaqachon ro‘yxatdan o‘tgan');
  await expect(page.getByRole('heading', { level: 1, name: 'Loyihalar' }).or(taken)).toBeVisible();
  if (await taken.isVisible()) {
    await page.getByRole('tab', { name: 'Kirish' }).click();
    await loginAs(page, ADMIN);
    await expect(page).toHaveURL(/\/projects\/$/);
  }
}

async function device(browser: Browser, info: TestInfo) {
  const ctx = await browser.newContext({ ...info.project.use });
  return { ctx, page: await ctx.newPage() };
}

test('free plan: the second project asks for Pro; the Pro page shows the price', async ({ page }) => {
  await openSeededProject(page);
  await page.goto('/projects/');
  await page.getByRole('button', { name: 'Yangi loyiha' }).first().click();
  const dlg = page.getByTestId('pro-limit');
  await expect(dlg).toContainText('Yangi loyiha uchun Pro kerak');
  // duplicating is a new project too
  await dlg.getByRole('button', { name: 'Keyinroq' }).click();
  await page.getByTestId('project-card').getByRole('button', { name: 'Nusxa olish' }).click();
  await expect(page.getByTestId('pro-limit')).toBeVisible();
  await page.getByTestId('pro-limit').getByRole('link', { name: 'Pro haqida' }).click();
  await expect(page).toHaveURL(/\/pro\/$/);
  await expect(page.getByTestId('pro-price')).toHaveText('99 000 so‘m / oy');
  await expect(page.getByRole('link', { name: 'Pro sotib olish uchun avval akkaunt oching' })).toBeVisible();
  await expect(page.getByTestId('project-card')).toHaveCount(0); // (on /pro, nothing was created)
  await page.goto('/projects/');
  await expect(page.getByTestId('project-card')).toHaveCount(1);
});

test('admin: masters list, Pro +1 month, password reset; the master must set a new password', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120_000);
  test.skip(!(await apiUp(page)), 'API / database not available');
  const phone = `+99890${String(Date.now()).slice(-7)}`;
  const name = `Usta ${info.project.name} ${Date.now() % 100000}`;

  // a master registers on their phone
  const m = await device(browser, info);
  await register(m.page, phone, name);

  // the admin finds them
  await asAdmin(page);
  await page.goto('/login/');
  await page.getByTestId('account-admin').click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await page.getByLabel('Ism yoki telefon bo‘yicha qidirish').fill(name);
  const card = page.getByTestId('master-card').filter({ hasText: name });
  await expect(card).toHaveCount(1);
  await expect(card.getByTestId('master-plan')).toHaveText('Bepul');

  // Pro for one month
  await card.getByRole('button', { name: '+1 oy' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ha' }).click();
  await expect(card.getByTestId('master-plan')).toContainText('Pro:');

  // the master sees Pro (after the next account refresh: open the app again)
  await m.page.goto('/pro/');
  await expect(m.page.getByTestId('pro-status')).toContainText('Pro faol', { timeout: 15_000 });
  // with Pro: more than one project, duplicating works
  for (const n of ['Birinchi uy', 'Ikkinchi uy']) {
    await m.page.goto('/projects/');
    await m.page.getByRole('button', { name: 'Yangi loyiha' }).first().click();
    await m.page.getByRole('dialog').getByLabel('Loyiha nomi').fill(n);
    await m.page.getByRole('dialog').getByRole('button', { name: 'Yaratish' }).click();
    await expect(m.page).toHaveURL(/\/editor\/\?id=/);
  }
  await m.page.goto('/projects/');
  await m.page
    .getByTestId('project-card')
    .filter({ hasText: 'Birinchi uy' })
    .getByRole('button', { name: 'Nusxa olish' })
    .click();
  await expect(m.page.getByTestId('project-card')).toHaveCount(3);

  // password reset: temporary password shown once
  await card.getByRole('button', { name: 'Parolni tiklash' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ha' }).click();
  const temp = (await page.getByTestId('temp-password-value').textContent())!.trim();
  expect(temp).toMatch(/^[a-z2-9]{3}-[a-z2-9]{3}-[a-z2-9]{3}$/);
  await page.getByTestId('temp-password').getByRole('button', { name: 'Tayyor' }).click();

  // the master was signed out; logs in with the temporary password and must choose a new one
  await m.ctx.clearCookies();
  await loginAs(m.page, phone, temp);
  const gate = m.page.getByTestId('password-gate');
  await expect(gate).toBeVisible();
  await gate.getByLabel('Vaqtinchalik parol').fill(temp);
  await gate.getByLabel(/^Yangi parol\s*\(/).fill('yangi-parol-77');
  await gate.getByLabel('Yangi parolni takrorlang').fill('yangi-parol-77');
  await gate.getByRole('button', { name: 'Saqlash' }).click();
  await expect(gate).toHaveCount(0);
  await m.ctx.clearCookies();
  await loginAs(m.page, phone, 'yangi-parol-77');
  await expect(m.page).toHaveURL(/\/projects\/$/);
  await m.ctx.close();
});

test('a master is not an admin: no admin entry, the admin page shows nothing', async ({ page }) => {
  test.skip(!(await apiUp(page)), 'API / database not available');
  await register(page, `usta-${Date.now()}@e2e.uz`, 'Oddiy usta');
  await page.goto('/login/');
  await expect(page.getByTestId('account-plan')).toContainText('Bepul');
  await expect(page.getByTestId('account-admin')).toHaveCount(0);
  await page.goto('/admin/');
  await expect(page.getByTestId('master-card')).toHaveCount(0);
});
