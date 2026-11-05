// PHASE 15 layout audit: every screen on many real device sizes. Usage: node scripts/audit-layout.mjs <outDir>
// Needs the static server on :4173 (scripts/serve-out.mjs) and, for /admin, the API (scripts/e2e-api.mjs).
import { chromium, devices } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const base = 'http://127.0.0.1:4173';
const out = process.argv[2] ?? 'audit';
mkdirSync(out, { recursive: true });
const seed = JSON.parse(readFileSync(process.env.SEED_JSON ?? '/tmp/claude-0/seed.json', 'utf8'));

const D = (name, d, extra = {}) => [name, { ...d, ...extra }];
const DEVICES = [
  D('iphone-se-320', devices['iPhone SE']),
  D('iphone-se3-375', devices['iPhone SE'], { viewport: { width: 375, height: 667 } }),
  D('iphone-14-390', devices['iPhone 14']),
  D('iphone-15pm-430', devices['iPhone 15 Pro Max']),
  D('iphone-14-land', devices['iPhone 14 landscape']),
  D('galaxy-s24-360', devices['Galaxy S24']),
  D('galaxy-a55-480', devices['Galaxy A55']),
  D('galaxy-tab-640', devices['Galaxy Tab S9']),
  D('ipad-mini-768', devices['iPad Mini']),
  D('ipad-mini-land', devices['iPad Mini landscape']),
  D('ipad-air-820', devices['iPad Pro 11'], { viewport: { width: 820, height: 1180 } }),
  D('ipad-air-land', devices['iPad Pro 11 landscape'], { viewport: { width: 1180, height: 820 } }),
  D('ipad-pro13-land', devices['iPad Pro 11 landscape'], { viewport: { width: 1366, height: 1024 } }),
  D('laptop-1366', devices['Desktop Chrome'], { viewport: { width: 1366, height: 768 } }),
  D('desktop-1920', devices['Desktop Chrome'], { viewport: { width: 1920, height: 1080 } }),
];
const SCREENS = [
  ['home', '/'],
  ['projects', '/projects/'],
  ['editor', `/editor/?id=${seed.id}`],
  ['install', `/install/?id=${seed.id}`],
  ['settings', '/settings/'],
  ['wiring', '/wiring/'],
  ['symbols', '/settings/symbols/'],
  ['login', '/login/'],
  ['pro', '/pro/'],
];

function audit(touch) {
  const vw = innerWidth;
  const vh = innerHeight;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0;
  };
  const clippedX = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o !== 'visible') return true;
    }
    return false;
  };
  const label = (el) =>
    (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.tagName).trim().slice(0, 40);
  const issues = [];
  if (document.documentElement.scrollWidth > vw + 1) issues.push({ kind: 'page-hscroll', px: document.documentElement.scrollWidth - vw });
  if (document.documentElement.scrollHeight > vh + 1) issues.push({ kind: 'page-vscroll', px: document.documentElement.scrollHeight - vh });
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !clippedX(el) && getComputedStyle(el).position !== 'fixed')
      issues.push({ kind: 'offscreen', el: label(el), right: Math.round(r.right), left: Math.round(r.left) });
  }
  const sel = 'button, a[href], input:not([type=hidden]), select, [role=button], [role=tab], [role=switch], [role=radio], [role=menuitem], [role=menuitemradio]';
  if (touch)
    for (const el of document.querySelectorAll(sel)) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      // a switch draws 52×32 but its ::after tap area is 68×48 and its whole row toggles it
      if (el.getAttribute('role') === 'switch') continue;
      if (Math.min(r.width, r.height) < 36) issues.push({ kind: 'small-target', el: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11) issues.push({ kind: 'tiny-text', el: label(el), fs });
    // text cut by ellipsis is fine; text overflowing its box without clipping is not
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow === 'visible' && getComputedStyle(el).whiteSpace === 'nowrap')
      issues.push({ kind: 'text-overflow', el: label(el) });
  }
  return issues;
}

const browser = await chromium.launch();
const report = {};
for (const [dname, dev] of DEVICES) {
  const ctx = await browser.newContext({
    ...dev,
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: base,
          localStorage: [
            { name: 'elektroplan:iosInstallHintShown', value: '1' },
            { name: 'elektroplan:lang', value: process.env.AUDIT_LANG ?? 'uz' }, // PHASE 16: AUDIT_LANG=ru
          ],
        },
      ],
    },
  });
  const page = await ctx.newPage();
  await page.goto(base + '/projects/');
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.evaluate(async (p) => {
    const db = await new Promise((res) => { const r = indexedDB.open('elektroplan'); r.onsuccess = () => res(r.result); });
    await new Promise((res) => { const tx = db.transaction(['projects', 'meta'], 'readwrite'); tx.objectStore('projects').put(p, p.id); tx.objectStore('meta').put(p.id, 'lastOpenedProjectId'); tx.oncomplete = res; });
    db.close();
  }, seed);
  for (const [sname, url] of SCREENS) {
    await page.goto(base + url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    const touch = !!dev.hasTouch;
    const issues = await page.evaluate(audit, touch);
    // de-duplicate by kind + element
    const seen = new Set();
    report[`${dname}/${sname}`] = issues.filter((i) => {
      const k = `${i.kind}|${i.el ?? ''}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    await page.screenshot({ path: `${out}/${dname}--${sname}.png` });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
const counts = {};
for (const v of Object.values(report)) for (const i of v) counts[i.kind] = (counts[i.kind] ?? 0) + 1;
console.log('issues by kind', counts);
