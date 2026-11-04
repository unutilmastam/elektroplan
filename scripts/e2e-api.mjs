// e2e: fresh MySQL/MariaDB database + PHP built-in server for /api (proxied by serve-out.mjs).
// DB from EP_DB_HOST/PORT/USER/PASS (default 127.0.0.1:3307 root — scripts/test-db.sh). Without a database
// the server still starts and answers 503; specs that need the API skip themselves.
import { execFileSync, spawn } from 'node:child_process';

const port = Number(process.argv[2] ?? 4175);
const env = {
  ...process.env,
  EP_DB_HOST: process.env.EP_DB_HOST ?? '127.0.0.1',
  EP_DB_PORT: process.env.EP_DB_PORT ?? '3307',
  EP_DB_USER: process.env.EP_DB_USER ?? 'root',
  EP_DB_PASS: process.env.EP_DB_PASS ?? '',
  EP_DB_NAME: process.env.EP_DB_NAME ?? 'ep_e2e',
  EP_MIGRATE_TOKEN: 'e2e',
  EP_RATE_LIMIT: '0',
};
try {
  execFileSync(
    'php',
    [
      '-r',
      `$p = new PDO('mysql:host='.getenv('EP_DB_HOST').';port='.getenv('EP_DB_PORT'), getenv('EP_DB_USER'), getenv('EP_DB_PASS'));
       $n = getenv('EP_DB_NAME'); $p->exec("DROP DATABASE IF EXISTS \`$n\`"); $p->exec("CREATE DATABASE \`$n\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");`,
    ],
    { env, stdio: 'inherit' },
  );
  execFileSync('php', ['server/migrate.php'], { env, stdio: 'inherit' });
} catch {
  console.warn('e2e-api: no database — API answers 503, API specs will be skipped');
}
const php = spawn('php', ['-S', `127.0.0.1:${port}`, 'server/index.php'], { env, stdio: ['ignore', 'ignore', 'ignore'] });
const stop = () => php.kill();
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
php.on('exit', (c) => process.exit(c ?? 0));
