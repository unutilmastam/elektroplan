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

test('junction box (real view): keys light their lamps, current path explained; wire it yourself by tap or drag', async ({ page }) => {
  await page.getByRole('tab', { name: 'Tarqatish qutisi' }).click();
  const lamps = page.getByTestId('real-lamp');
  await expect(lamps).toHaveCount(3); // 2-key switch + 1-key switch
  await expect(page.locator('[data-testid="real-lamp"][data-lit="true"]')).toHaveCount(0);
  await expect(page.getByTestId('flow-steps')).toContainText('Klavishni bosing');
  await page.getByTestId('real-key').first().click();
  await expect(page.locator('[data-testid="real-lamp"][data-lit="true"]')).toHaveCount(1);
  await expect(page.getByTestId('flow-steps')).toContainText('Shitdan faza (jigarrang) qutiga kiradi');
  await expect(page.getByTestId('box-steps')).toContainText('Faza (L, jigarrang)');

  await page.getByRole('tab', { name: 'O‘zim ulayman' }).click();
  await page.getByTestId('box-check').click();
  await expect(page.getByTestId('box-issues')).toContainText('Ulanmagan sim');
  await page.getByTestId('add-wago-3').click();
  await expect(page.getByTestId('real-wago')).toHaveCount(1);
  // tap the copper end, then a free opening
  await page.locator('[data-core="in:L"]').click();
  await page.getByTestId('wago-entry').first().click();
  await expect(page.getByTestId('wago-entry')).toHaveCount(2);
  // drag the next one in with the finger / mouse
  const tip = (await page.locator('[data-core="sw-a:C"]').boundingBox())!;
  const hole = (await page.getByTestId('wago-entry').first().boundingBox())!;
  await page.mouse.move(tip.x + tip.width / 2, tip.y + tip.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(
      tip.x + tip.width / 2 + ((hole.x + hole.width / 2 - tip.x - tip.width / 2) * i) / 10,
      tip.y + tip.height / 2 + ((hole.y + hole.height / 2 - tip.y - tip.height / 2) * i) / 10,
    );
  await page.mouse.up();
  await expect(page.getByTestId('wago-entry')).toHaveCount(1);
  // the full answer passes the test
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

test('parts catalogue: every part with a picture and what it is for; search', async ({ page }) => {
  await page.getByRole('tab', { name: 'Detallar' }).click();
  await expect(page.getByTestId('part-card')).toHaveCount(48);
  await page.getByRole('textbox', { name: /Qidirish/ }).fill('Wago 221');
  await expect(page.getByTestId('part-card')).toHaveCount(3);
  await expect(page.getByTestId('part-card').first()).toContainText('richagli klemma');
  await page.getByRole('textbox', { name: /Qidirish/ }).fill('');
  await page.getByRole('tab', { name: 'Kabel va montaj' }).click();
  await expect(page.getByTestId('part-card')).toHaveCount(11);
});
