<?php
declare(strict_types=1);

// CLI: php server/migrate.php   (or https://<site>/api/migrate?token=<MIGRATE_TOKEN> after deploy)
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/lib/Http.php';
require __DIR__ . '/lib/Db.php';
require __DIR__ . '/lib/Migrator.php';
$applied = Migrator::run(Db::pdo());
echo $applied ? 'applied: ' . implode(', ', $applied) . PHP_EOL : 'up to date' . PHP_EOL;
