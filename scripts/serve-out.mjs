// Minimal static server for the exported `out/` folder (mirrors cPanel/Apache behaviour for e2e tests).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'out');
const port = Number(process.argv[2] ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, safe);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    return { file, missing: false };
  } catch {
    return { file: join(root, '404.html'), missing: true };
  }
}

createServer(async (req, res) => {
  const { file, missing } = await resolveFile(new URL(req.url ?? '/', 'http://x').pathname);
  try {
    let body = await readFile(file);
    // e2e hook: a context with this cookie sees a "new build" of the service worker (offline.spec.ts)
    if (file.endsWith('sw.js') && /(?:^|;\s*)e2e-sw-build=([\w-]+)/.test(req.headers.cookie ?? ''))
      body = Buffer.concat([body, Buffer.from(`\n// build ${RegExp.$1}\n`)]);
    res.writeHead(missing ? 404 : 200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`serving out/ on http://127.0.0.1:${port}`));
