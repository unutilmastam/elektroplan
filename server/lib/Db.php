<?php
declare(strict_types=1);

// floats are bound as text: keep the shortest exact form (0.46794871794871795, not 0.46794871794872)
ini_set('precision', '-1');
ini_set('serialize_precision', '-1');

final class Db
{
    private static ?PDO $pdo = null;

    /** Config from api/config.php; EP_DB_* environment variables override it (tests, local dev). */
    public static function config(): array
    {
        $file = __DIR__ . '/../config.php';
        $c = is_file($file) ? (require $file) : [];
        foreach (['db_host', 'db_port', 'db_name', 'db_user', 'db_pass', 'migrate_token', 'rate_limit'] as $k) {
            $env = getenv('EP_' . strtoupper($k));
            if ($env !== false) {
                $c[$k] = $env;
            }
        }
        return $c;
    }

    public static function pdo(): PDO
    {
        if (self::$pdo) {
            return self::$pdo;
        }
        $c = self::config();
        if (empty($c['db_name'])) {
            throw new ApiError(503, 'not_configured', 'Server sozlanmagan');
        }
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'] ?? 'localhost', (int) ($c['db_port'] ?? 3306), $c['db_name']);
        try {
            self::$pdo = new PDO($dsn, (string) ($c['db_user'] ?? ''), (string) ($c['db_pass'] ?? ''), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            ]);
        } catch (PDOException) {
            throw new ApiError(503, 'db_unavailable', 'Ma’lumotlar bazasiga ulanib bo‘lmadi');
        }
        self::$pdo->exec("SET time_zone = '+00:00', NAMES utf8mb4");
        return self::$pdo;
    }

    public static function one(string $sql, array $args = []): ?array
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($args);
        $row = $st->fetch();
        return $row === false ? null : $row;
    }

    public static function all(string $sql, array $args = []): array
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($args);
        return $st->fetchAll();
    }

    public static function run(string $sql, array $args = []): int
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($args);
        return $st->rowCount();
    }

    /** ISO 8601 from the client ("2026-11-04T10:00:00.000Z") -> DATETIME(3) in UTC. */
    public static function toDb(?string $iso): ?string
    {
        if ($iso === null) {
            return null;
        }
        try {
            $d = new DateTimeImmutable($iso);
        } catch (Exception) {
            throw new ApiError(422, 'invalid_date', $iso);
        }
        return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
    }

    /** DATETIME(3) -> ISO 8601 exactly like JavaScript Date.toISOString(). */
    public static function toIso(?string $db): ?string
    {
        if ($db === null) {
            return null;
        }
        $d = DateTimeImmutable::createFromFormat('Y-m-d H:i:s.v', $db, new DateTimeZone('UTC'))
            ?: new DateTimeImmutable($db, new DateTimeZone('UTC'));
        return $d->format('Y-m-d\TH:i:s.v\Z');
    }

    public static function now(): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
    }

    public static function uuid(): string
    {
        // uuid v7: 48-bit ms timestamp + random
        $ms = (int) floor(microtime(true) * 1000);
        $b = random_bytes(16);
        $b[0] = chr(($ms >> 40) & 0xff);
        $b[1] = chr(($ms >> 32) & 0xff);
        $b[2] = chr(($ms >> 24) & 0xff);
        $b[3] = chr(($ms >> 16) & 0xff);
        $b[4] = chr(($ms >> 8) & 0xff);
        $b[5] = chr($ms & 0xff);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x70);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h, 0, 8), substr($h, 8, 4), substr($h, 12, 4), substr($h, 16, 4), substr($h, 20));
    }
}
