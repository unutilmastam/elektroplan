<?php
declare(strict_types=1);

/**
 * Admin panel API (PHASE 14): masters list, password reset, Pro on / off. Only role = admin
 * (the account whose phone / email equals ADMIN_LOGIN in config). Every change is logged in admin_actions.
 */
final class Admin
{
    public static function require(): array
    {
        $u = Auth::require();
        if (($u['role'] ?? '') !== 'admin') {
            throw new ApiError(403, 'forbidden');
        }
        return $u;
    }

    public static function users(string $q): array
    {
        $where = '';
        $args = [];
        $q = trim($q);
        if ($q !== '') {
            $where = 'WHERE u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?';
            $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
            $args = [$like, $like, $like];
        }
        $rows = Db::all(
            "SELECT u.*,
               (SELECT COUNT(*) FROM projects p WHERE p.owner_id = u.id AND p.deleted_at IS NULL) AS projects,
               (SELECT COUNT(*) FROM electrical_points e JOIN projects p ON p.id = e.project_id
                  WHERE p.owner_id = u.id AND p.deleted_at IS NULL AND e.deleted_at IS NULL) AS points,
               (SELECT COUNT(*) FROM electrical_points e JOIN projects p ON p.id = e.project_id
                  WHERE p.owner_id = u.id AND p.deleted_at IS NULL AND e.deleted_at IS NULL AND e.status = 'completed') AS done
             FROM users u $where ORDER BY u.created_at DESC LIMIT 500",
            $args,
        );
        return array_map(fn ($u) => Auth::publicUser($u) + [
            'createdAt' => Db::toIso($u['created_at']),
            'lastLoginAt' => Db::toIso($u['last_login_at']),
            'projects' => (int) $u['projects'],
            'points' => (int) $u['points'],
            'done' => (int) $u['done'],
        ], $rows);
    }

    /** New temporary password (shown to the admin once); the user must set their own at next login. */
    public static function resetPassword(array $admin, string $userId): array
    {
        $user = self::target($userId);
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/o, 1/l/i
        $parts = [];
        for ($p = 0; $p < 3; $p++) {
            $s = '';
            for ($i = 0; $i < 3; $i++) {
                $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $parts[] = $s;
        }
        $temp = implode('-', $parts);
        $pdo = Db::pdo();
        $pdo->beginTransaction();
        Db::run('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', [password_hash($temp, PASSWORD_BCRYPT), $user['id']]);
        Db::run('DELETE FROM sessions WHERE user_id = ?', [$user['id']]); // signed out everywhere
        self::log($admin, $user['id'], 'reset_password', null);
        $pdo->commit();
        return ['password' => $temp];
    }

    /** {months: 1..24} adds months to the current Pro end (or from now); {cancel: true} ends Pro now. */
    public static function setPro(array $admin, string $userId, array $b): array
    {
        $user = self::target($userId);
        if (!empty($b['cancel'])) {
            Db::run('UPDATE users SET pro_until = NULL WHERE id = ?', [$user['id']]);
            self::log($admin, $user['id'], 'pro_cancel', null);
        } else {
            $months = $b['months'] ?? null;
            if (!is_int($months) || $months < 1 || $months > 24) {
                throw new ApiError(422, 'invalid_months');
            }
            $from = Plan::isPro($user) && $user['pro_until'] !== null
                ? new DateTimeImmutable($user['pro_until'], new DateTimeZone('UTC'))
                : new DateTimeImmutable('now', new DateTimeZone('UTC'));
            $until = $from->modify("+$months months")->format('Y-m-d H:i:s.v');
            Db::run('UPDATE users SET pro_until = ? WHERE id = ?', [$until, $user['id']]);
            self::log($admin, $user['id'], 'pro_extend', ['months' => $months, 'until' => Db::toIso($until)]);
        }
        return ['user' => Auth::publicUser(Db::one('SELECT * FROM users WHERE id = ?', [$user['id']]))];
    }

    private static function target(string $userId): array
    {
        $u = Db::one('SELECT * FROM users WHERE id = ?', [$userId]);
        if (!$u) {
            throw new ApiError(404, 'not_found');
        }
        return $u;
    }

    private static function log(array $admin, string $userId, string $action, ?array $detail): void
    {
        Db::run(
            'INSERT INTO admin_actions (id, admin_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)',
            [Db::uuid(), $admin['id'], $userId, $action, $detail === null ? null : json_encode($detail)],
        );
    }
}
