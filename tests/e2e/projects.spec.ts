import { expect, test, type Page } from '@playwright/test';
import { seedProjects } from './fixtures/seed';

async function createProject(page: Page, name: string, customer = '', address = '') {
  await page.goto('/projects/');
  await page.getByRole('button', { name: 'Yangi loyiha' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loyiha nomi').fill(name);
  if (customer) await dialog.getByLabel(/Buyurtmachi/).fill(customer);
  if (address) await dialog.getByLabel(/Manzil/).fill(address);
  await dialog.getByRole('button', { name: 'Yaratish' }).click();
  await expect(page).toHaveURL(/\/editor\/\?id=/);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

const cards = (page: Page) => page.getByTestId('project-card');

test('empty name shows an Uzbek validation error', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.getByText('Hali loyiha yo‘q')).toBeVisible();
  await page.getByRole('button', { name: 'Yangi loyiha' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loyiha nomi').fill('   ');
  await dialog.getByRole('button', { name: 'Yaratish' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Loyiha nomini kiriting');
  await expect(dialog.getByLabel('Loyiha nomi')).toHaveAttribute('aria-invalid', 'true');
});

test('created project survives a reload and opens from home', async ({ page }) => {
  await createProject(page, 'Chilonzor kvartira', 'Aliyev Aziz', 'Toshkent');
  await expect(page.getByText('Aliyev Aziz')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Chilonzor kvartira' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Chilonzor kvartira' })).toBeVisible();
  await page.goto('/projects/');
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByText('1 ta loyiha')).toBeVisible();
});

test('edit and delete (with confirmation) persist; duplicating needs Pro on the free plan', async ({
  page,
}) => {
  await createProject(page, 'Yunusobod uy');
  await page.goto('/projects/');
  const card = cards(page).first();
  await card.getByRole('button', { name: 'Tahrirlash' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Loyiha nomi')).toHaveValue('Yunusobod uy');
  await dialog.getByLabel('Loyiha nomi').fill('Yunusobod hovli');
  await dialog.getByRole('button', { name: 'Saqlash' }).click();
  await expect(cards(page).first()).toContainText('Yunusobod hovli');

  // free plan (1 project): a copy would be a second project
  await cards(page).first().getByRole('button', { name: 'Nusxa olish' }).click();
  await expect(page.getByTestId('pro-limit')).toBeVisible();
  await page.getByTestId('pro-limit').getByRole('button', { name: 'Keyinroq' }).click();
  await expect(cards(page)).toHaveCount(1);

  await cards(page).first().getByRole('button', { name: 'O‘chirish' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('Yunusobod hovli');
  await confirm.getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(cards(page)).toHaveCount(1);
  await cards(page).first().getByRole('button', { name: 'O‘chirish' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ha, o‘chirish' }).click();
  await expect(cards(page)).toHaveCount(0);

  await page.reload();
  await expect(cards(page)).toHaveCount(0);
  // the slot is free again
  await createProject(page, 'Yangi uy');
});

test('search and sort the project list', async ({ page }) => {
  await seedProjects(page, [
    { id: 'p-chilonzor', name: 'Chilonzor', customerName: 'Karimov' },
    { id: 'p-sergeli', name: 'Sergeli', customerName: 'Aliyev' },
  ]);
  await expect(cards(page).first()).toContainText('Sergeli');
  await page.getByLabel('Saralash').selectOption('name');
  await expect(cards(page).first()).toContainText('Chilonzor');
  await expect(cards(page).last()).toContainText('Sergeli');
  await page.getByLabel('Loyihalarni qidirish').fill('karim');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('Chilonzor');
  await page.getByLabel('Loyihalarni qidirish').fill('yo‘q narsa');
  await expect(page.getByText('Hech narsa topilmadi')).toBeVisible();
});

test('header: edit pencil and recent projects menu', async ({ page, viewport }) => {
  await seedProjects(page, [
    { id: 'p-birinchi', name: 'Birinchi' },
    { id: 'p-ikkinchi', name: 'Ikkinchi' },
  ]);
  await page.goto('/editor/?id=p-ikkinchi');
  await expect(page.getByRole('heading', { level: 1, name: 'Ikkinchi' })).toBeVisible();
  await page.getByRole('button', { name: 'Loyihani almashtirish' }).click();
  const menu = page.getByRole('menu', { name: 'So‘nggi loyihalar' });
  await menu.getByRole('menuitem', { name: /Birinchi/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Birinchi' })).toBeVisible();
  await expect(page.locator('aside').getByText('2', { exact: true }).first()).toBeAttached();

  test.skip((viewport?.width ?? 0) < 600, 'pencil is hidden on phones (edit from the projects list)');
  await page.getByRole('button', { name: 'Loyihani tahrirlash' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Manzil/).fill('Samarqand');
  await dialog.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.locator('header').getByText('Samarqand')).toBeVisible();
});

test('unknown project id shows "Loyiha topilmadi"', async ({ page }) => {
  await page.goto('/editor/?id=does-not-exist');
  await expect(page.getByText('Loyiha topilmadi')).toBeVisible();
});
