import { defineConfig, devices } from '@playwright/test';

/**
 * Device matrix from docs/DEVICES.md §7.
 * iPad/iPhone run on WebKit when E2E_WEBKIT=1 (CI installs it); otherwise Chromium with the same
 * viewport, touch and user agent so the suite still runs where only Chromium is available.
 */
const appleEngine = process.env.E2E_WEBKIT === '1' ? 'webkit' : 'chromium';
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    // the service worker is exercised in offline.spec.ts; other specs test the app itself
    serviceWorkers: 'block',
    // iOS "Bosh ekranga qo‘shing" hint already seen (offline.spec.ts checks it on a clean device)
    storageState: {
      cookies: [],
      origins: [
        {
          origin: `http://127.0.0.1:${port}`,
          localStorage: [{ name: 'elektroplan:iosInstallHintShown', value: '1' }],
        },
      ],
    },
  },
  webServer: {
    command: `node scripts/serve-out.mjs ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'ipad-landscape',
      use: {
        ...devices['iPad Pro 11 landscape'],
        viewport: { width: 1180, height: 820 },
        browserName: appleEngine,
      },
    },
    {
      name: 'ipad-portrait',
      use: { ...devices['iPad Pro 11'], viewport: { width: 820, height: 1180 }, browserName: appleEngine },
    },
    {
      name: 'ipad-pro-13',
      use: {
        ...devices['iPad Pro 11 landscape'],
        viewport: { width: 1366, height: 1024 },
        browserName: appleEngine,
      },
    },
    { name: 'iphone', use: { ...devices['iPhone 14'], browserName: appleEngine } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    {
      name: 'desktop-windows',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
