// Generates PWA icons from the logo mark (run once: node scripts/make-icons.mjs). Uses the preinstalled Chromium.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const mark = (scale) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#14254a"/><stop offset="100%" stop-color="#05080f"/>
    </radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 262) scale(${scale}) translate(-44 -36)">
    <path d="M10 34 L44 6 L78 34 M18 28 V66 H70 V28 M62 12 V22" fill="none" stroke="url(#g)"
      stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M48 24 L33 46 H44 L40 62 L56 38 H45 Z" fill="url(#g)"/>
  </g>
</svg>`;

const out = [
  ['icon-192.png', 192, 4.4],
  ['icon-512.png', 512, 4.4],
  ['icon-maskable-512.png', 512, 3.3], // logo inside the 80% safe zone
  ['apple-touch-icon.png', 180, 4.0],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, scale] of out) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0"><div style="width:${size}px;height:${size}px">${mark(scale).replace(
      'width="512" height="512"',
      `width="${size}" height="${size}"`,
    )}</div></body></html>`,
  );
  await writeFile(
    `public/icons/${name}`,
    await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } }),
  );
}
await writeFile('public/icons/icon.svg', mark(4.4).trim() + '\n');
await browser.close();
console.log('icons written');
