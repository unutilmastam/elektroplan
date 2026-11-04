import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';

/**
 * Real PHP API + MariaDB/MySQL for integration tests. Uses EP_DB_HOST/PORT/USER/PASS
 * (default: 127.0.0.1:3307 root, see scripts/test-db.sh). A fresh database per test file.
 * `available()` is false when PHP or the database is missing — suites are skipped then (CI always has both).
 */
const env = {
  EP_DB_HOST: process.env.EP_DB_HOST ?? '127.0.0.1',
  EP_DB_PORT: process.env.EP_DB_PORT ?? '3307',
  EP_DB_USER: process.env.EP_DB_USER ?? 'root',
  EP_DB_PASS: process.env.EP_DB_PASS ?? '',
};

const php = (code: string, extra: Record<string, string> = {}) =>
  execFileSync('php', ['-r', code], {
    env: { ...process.env, ...env, ...extra },
    encoding: 'utf8',
    timeout: 20_000,
  });

const pdo = `$p = new PDO('mysql:host='.getenv('EP_DB_HOST').';port='.getenv('EP_DB_PORT'), getenv('EP_DB_USER'), getenv('EP_DB_PASS'));`;

export function available(): boolean {
  try {
    php(`${pdo} echo 'ok';`);
    return true;
  } catch {
    return false;
  }
}

const freePort = () =>
  new Promise<number>((res) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as { port: number }).port;
      s.close(() => res(port));
    });
  });

export interface PhpApi {
  url: string;
  dbName: string;
  env: Record<string, string>;
  stop: () => Promise<void>;
  sql: (q: string) => string;
}

export async function startApi(): Promise<PhpApi> {
  const dbName = `ep_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  php(`${pdo} $p->exec('CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');`);
  const full = { ...env, EP_DB_NAME: dbName, EP_MIGRATE_TOKEN: 'test-token' };
  execFileSync('php', ['server/migrate.php'], { env: { ...process.env, ...full }, encoding: 'utf8' });
  const port = await freePort();
  const proc: ChildProcess = spawn('php', ['-S', `127.0.0.1:${port}`, 'server/index.php'], {
    env: { ...process.env, ...full },
    stdio: 'ignore',
  });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${url}/api/health`)).ok) break;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    url,
    dbName,
    env: full,
    sql: (q) =>
      php(
        `${pdo} $p->exec('USE ${dbName}'); foreach ($p->query(${JSON.stringify(q)}, PDO::FETCH_NUM) as $r) echo implode("\\t", $r), "\\n";`,
      ),
    stop: async () => {
      proc.kill();
      php(`${pdo} $p->exec('DROP DATABASE IF EXISTS ${dbName}');`);
    },
  };
}

/** Minimal client with a cookie jar (one "device"). */
export class Device {
  private cookie = '';
  constructor(private readonly url: string) {}
  async call(method: 'GET' | 'POST', path: string, body?: unknown, headers: Record<string, string> = {}) {
    const r = await fetch(`${this.url}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method === 'POST' ? { 'X-Elektroplan': '1' } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = r.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(';');
      if (pair!.startsWith('ep_session=')) this.cookie = pair!.endsWith('=') ? '' : pair!;
    }
    const text = await r.text();
    return {
      status: r.status,
      body: (text ? JSON.parse(text) : null) as Record<string, unknown>,
      setCookie: set,
    };
  }
}
