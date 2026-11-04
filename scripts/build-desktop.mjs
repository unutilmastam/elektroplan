// Static export for the Windows app (src-tauri): no service worker, API on the live server.
// Cross-platform (Windows CI runs it through `tauri build`). API base can be overridden: EP_DESKTOP_API.
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

rmSync('public/sw.js', { force: true }); // a web build's worker must not ship inside the app
const r = spawnSync('pnpm', ['exec', 'next', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    NEXT_PUBLIC_DESKTOP: '1',
    NEXT_PUBLIC_API_BASE: process.env.EP_DESKTOP_API || 'https://eplan.itcode.uz/api',
  },
});
process.exit(r.status ?? 1);
