import { expect, test, type Page } from '@playwright/test';
import { openSeededProject } from './fixtures/seed';

/** PHASE 21: electrical schemes — distribution board and junction box, with a live simulation. */
async function addLine(page: Page, name: string) {
  await page.getByTestId('wiring-add-line').click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/wiring/');
  await expect(page.getByRole('heading', { level: 1, name: 'Elektr sxemalar' })).toBeVisible();
});

test('board: circuits get breakers, cables and RCDs; materials list; protections trip in the simulation', async ({ page }) => {
  await addLine(page, 'Rozetkalar');
  await addLine(page, 'Konditsioner');
  await addLine(page, 'Kir yuvish mashinasi');
  const summaries = page.getByTestId('wiring-line-summary');
  await expect(summaries.nth(0)).toContainText('C16 · 2,5 mm² · UZO orqali');
  await expect(summaries.nth(1)).toContainText('C16 · 2,5 mm² · Avtomat');
  await expect(summaries.nth(2)).toContainText('Difavtomat');

  // switching a consumer on makes current flow
  await page.getByTestId('board-load').first().click();
  await expect(page.getByTestId('board-load').first()).toContainText('11,4A');

  // a leak on the socket circuit trips the RCD; a short trips the AC breaker
  const faults = page.getByTestId('sim-fault');
  await faults.nth(0).selectOption({ label: 'Tok sizishi' });
  await expect(page.getByTestId('sim-log')).toContainText('UZO 1 o‘chdi');
  await expect(page.getByTestId('board-rcd').first()).toHaveAttribute('data-on', 'false');
  await faults.nth(1).selectOption({ label: 'Qisqa tutashuv' });
  await expect(page.getByTestId('sim-log')).toContainText('qisqa tutashuv — avtomat bir zumda o‘chdi');

  await page.getByRole('tab', { name: 'Materiallar' }).click();
  await expect(page.getByTestId('panel-bom')).toContainText('UZO 2P');
  await expect(page.getByTestId('panel-bom')).toContainText('Difavtomat C16 30 mA');
  await expect(page.getByTestId('panel-bom')).toContainText('Kabel VVGng 3×2,5 mm²');

  // kept on the device
  await page.reload();
  await expect(page.getByTestId('wiring-line-summary')).toHaveCount(3);
});

test('junction box: keys light their lamps; build-it-yourself is checked', async ({ page }) => {
  await page.getByRole('tab', { name: 'Tarqatish qutisi' }).click();
  await expect(page.getByTestId('box-lamp')).toHaveCount(3); // 2-key switch + 1-key switch
  await expect(page.locator('[data-testid="box-lamp"][data-lit="true"]')).toHaveCount(0);
  await page.getByTestId('box-key').first().click();
  await expect(page.locator('[data-testid="box-lamp"][data-lit="true"]')).toHaveCount(1);
  await expect(page.getByTestId('box-steps')).toContainText('Faza (L, jigarrang)');

  await page.getByRole('tab', { name: 'O‘zim ulayman' }).click();
  await page.getByTestId('box-check').click();
  await expect(page.getByTestId('box-issues')).toContainText('Ulanmagan sim');
  // join supply phase and the first switch's common in a new clamp by tapping
  await page.locator('[data-core="in:L"]').click();
  await page.getByTestId('box-new-clamp').click();
  await page.locator('[data-core="sw-a:C"]').click();
  await page.getByTestId('box-clamp').first().click();
  await expect(page.getByTestId('box-clamp')).toHaveCount(1);
  await page.getByTestId('box-answer').click();
  await page.getByTestId('box-check').click();
  await expect(page.getByTestId('box-ok')).toBeVisible();
});

test('circuits from the open project', async ({ page }) => {
  await openSeededProject(page);
  await page.goto('/wiring/');
  await page.getByTestId('wiring-from-project').click();
  await expect(page.getByTestId('wiring-line-summary').first()).toBeVisible();
  await expect(page.getByTestId('wiring-lines')).toContainText('Rozetkalar');
});
