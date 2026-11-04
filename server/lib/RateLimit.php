<?php
declare(strict_types=1);

/** Fixed-window counter in MySQL (shared hosting: no Redis / APCu guarantee). */
final class RateLimit
{
    public static function hit(string $key, int $max, int $windowSec): void
    {
        // only the local e2e server turns it off (EP_RATE_LIMIT=0); production always counts
        if ((string) (Db::config()['rate_limit'] ?? '1') === '0') {
            return;
        }
        $k = substr(hash('sha256', $key), 0, 64);
        $now = Db::now();
        $row = Db::one('SELECT hits, window_start FROM rate_limits WHERE k = ?', [$k]);
        $start = $row ? strtotime($row['window_start'] . ' UTC') : 0;
        if (!$row || time() - $start >= $windowSec) {
            Db::run('REPLACE INTO rate_limits (k, hits, window_start) VALUES (?, 1, ?)', [$k, $now]);
            return;
        }
        if ((int) $row['hits'] >= $max) {
            $retry = max(1, $windowSec - (time() - $start));
            header('Retry-After: ' . $retry);
            throw new ApiError(429, 'too_many_attempts', '', ['retryAfter' => $retry]);
        }
        Db::run('UPDATE rate_limits SET hits = hits + 1 WHERE k = ?', [$k]);
    }

    public static function clear(string $key): void
    {
        Db::run('DELETE FROM rate_limits WHERE k = ?', [substr(hash('sha256', $key), 0, 64)]);
    }
}
