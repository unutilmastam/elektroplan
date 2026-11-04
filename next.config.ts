import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import { createHash, randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Static pages of the export (query params carry the data: /editor/?id=…). */
const PAGES = [
  '/',
  '/projects/',
  '/editor/',
  '/install/',
  '/materials/',
  '/settings/',
  '/settings/symbols/',
  '/login/',
];
// HTML is not hashed: a new revision per build makes the service worker fetch fresh pages on update
const revision = process.env.GITHUB_SHA ?? randomUUID();

/** Every file in public/ (fonts for the PDF, icons…) with a content hash; the SW output itself is skipped. */
const publicFiles = (
  readdirSync('public', { recursive: true, withFileTypes: true }) as import('node:fs').Dirent[]
)
  .filter((d) => d.isFile())
  .map((d) => join(d.parentPath, d.name))
  .filter((f) => !/(^|[/\\])(sw\.js(\.map)?|swe-worker-.*\.js|\.htaccess)$/.test(f))
  .map((f) => ({
    url: '/' + f.replace(/\\/g, '/').replace(/^public\//, ''),
    revision: createHash('md5').update(readFileSync(f)).digest('hex'),
  }));

const withSerwist = withSerwistInit({
  swSrc: 'src/sw/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: false, // never reload while the electrician is drawing
  register: false, // src/infra/pwa/registerSw.ts (update waits for "Yangilash")
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [
    ...PAGES.map((url) => ({ url, revision })),
    // RSC payloads used by client-side navigation (next/link)
    ...PAGES.map((url) => ({ url: `${url}index.txt`, revision })),
    { url: '/404.html', revision },
    { url: '/manifest.webmanifest', revision },
    ...publicFiles,
  ],
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
});

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
};

export default withSerwist(nextConfig);
