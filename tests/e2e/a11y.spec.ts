import { expect, test, type Page } from '@playwright/test';
import { openSeededProject, SEED_ID } from './fixtures/seed';

/**
 * PHASE 13 accessibility checks on every screen and device profile:
 * every control has a name, every field a label, one h1, lang="uz", and keyboard focus is always visible.
 */
async function audit(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const name = (el: Element) => {
      const h = el as HTMLElement;
      const by = h.getAttribute('aria-labelledby');
      const labelled = by
        ? by
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent ?? '')
            .join(' ')
        : '';
      const labels = (h as HTMLInputElement).labels
        ? [...(h as HTMLInputElement).labels!].map((l) => l.textContent).join(' ')
        : '';
      return (
        (h.getAttribute('aria-label') ?? '') +
        labelled +
        labels +
        (h.innerText ?? '') +
        (h.getAttribute('title') ?? '')
      );
    };
    const sel =
      'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], [role=radio], [role=menuitem], [role=menuitemradio]';
    const unnamed = [...document.querySelectorAll(sel)]
      .filter((el) => visible(el) && !name(el).trim())
      .map((el) => el.outerHTML.slice(0, 120));
    const h1 = [...document.querySelectorAll('h1')].filter(visible).length;
    return { unnamed, h1, lang: document.documentElement.lang };
  });
}

const pages = (id: string): Array<[string, string]> => [
  ['/', 'Bosh sahifa'],
  ['/projects/', 'Loyihalar'],
  [`/editor/?id=${id}`, 'Chizma'],
  [`/install/?id=${id}`, 'Montaj'],
  ['/settings/', 'Sozlamalar'],
  ['/settings/symbols/', 'Belgilar'],
  ['/login/', 'Akkaunt'],
];

test('every screen: named controls, labelled fields, one h1, lang="uz"', async ({ page }) => {
  await openSeededProject(page);
  for (const [url, label] of pages(SEED_ID)) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const r = await audit(page);
    expect(r.unnamed, `${label}: controls without an accessible name`).toEqual([]);
    expect(r.h1, `${label}: exactly one visible h1`).toBe(1);
    expect(r.lang).toBe('uz');
  }
});

test('keyboard: Tab reaches the main actions and focus is always visible', async ({ page }, info) => {
  test.skip(/iphone|android/.test(info.project.name), 'phones have no hardware keyboard by default');
  await openSeededProject(page);
  await page.goto('/projects/');
  await page.getByTestId('project-card').waitFor();
  const seen: string[] = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
      return { label: el.getAttribute('aria-label') ?? el.innerText.trim().slice(0, 30), ring };
    });
    if (!f) continue;
    expect(f.ring, `focus ring on "${f.label}"`).toBe(true);
    seen.push(f.label);
  }
  for (const must of ['Yangi loyiha', 'Ochish'])
    expect(
      seen.some((s) => s.includes(must)),
      must,
    ).toBe(true);
  // Enter on a focused control does its action: open the create dialog, Escape closes it
  await page.getByRole('button', { name: 'Yangi loyiha' }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByLabel('Loyiha nomi')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
