<?php
declare(strict_types=1);

/**
 * Accounts and sessions: login = phone (+998…) or email, bcrypt password, random 256-bit token in an
 * httpOnly SameSite=Lax cookie; only its sha256 is stored (sessions.id).
 */
final class Auth
{
    public const COOKIE = 'ep_session';
    private const TTL_DAYS = 60;

    /** Token of the session started by this request (handed to the desktop app, which cannot use cookies). */
    public static ?string $issuedToken = null;

    /** Session token: the cookie (web) or the `X-Elektroplan-Auth` header (Windows app, cross-origin). */
    public static function token(): string
    {
        $header = $_SERVER['HTTP_X_ELEKTROPLAN_AUTH'] ?? '';
        if (is_string($header) && $header !== '') {
            return $header;
        }
        $cookie = $_COOKIE[self::COOKIE] ?? '';
        return is_string($cookie) ? $cookie : '';
    }

    /** "+998 90 123-45-67", "901234567" -> "+998901234567"; emails lower-cased. Null when invalid. */
    public static function normalizeLogin(string $login): ?array
    {
        $login = trim($login);
        if (str_contains($login, '@')) {
            $email = mb_strtolower($login);
            return filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($email) <= 190 ? ['email', $email] : null;
        }
        $digits = preg_replace('/\D+/', '', $login) ?? '';
        if (strlen($digits) === 9) {
            $digits = '998' . $digits;
        }
        return strlen($digits) >= 10 && strlen($digits) <= 15 ? ['phone', '+' . $digits] : null;
    }

    public static function register(array $b): array
    {
        $name = trim((string) ($b['name'] ?? ''));
        $password = (string) ($b['password'] ?? '');
        $login = self::normalizeLogin((string) ($b['login'] ?? ''));
        $errors = [];
        if ($name === '' || mb_strlen($name) > 120) {
            $errors['name'] = 'name_required';
        }
        if (!$login) {
            $errors['login'] = 'login_invalid';
        }
        if (strlen($password) < 8 || strlen($password) > 200) {
            $errors['password'] = 'password_short';
        }
        if ($errors) {
            throw new ApiError(422, 'validation', '', ['fields' => $errors]);
        }
        RateLimit::hit('reg:' . Http::clientIp(), 10, 3600);
        [$kind, $value] = $login;
        if (Db::one("SELECT id FROM users WHERE $kind = ?", [$value])) {
            throw new ApiError(409, 'login_taken', '', ['fields' => ['login' => 'login_taken']]);
        }
        $id = Db::uuid();
        Db::run(
            "INSERT INTO users (id, name, $kind, password_hash) VALUES (?, ?, ?, ?)",
            [$id, $name, $value, password_hash($password, PASSWORD_BCRYPT)],
        );
        Db::run('UPDATE users SET last_login_at = ? WHERE id = ?', [Db::now(), $id]);
        self::startSession($id);
        return self::publicUser(self::withRole(Db::one('SELECT * FROM users WHERE id = ?', [$id])));
    }

    public static function login(array $b): array
    {
        $password = (string) ($b['password'] ?? '');
        $login = self::normalizeLogin((string) ($b['login'] ?? ''));
        $ip = Http::clientIp();
        RateLimit::hit('ip:' . $ip, 50, 900);
        RateLimit::hit('login:' . $ip . ':' . ($login[1] ?? '?'), 10, 900);
        $user = $login ? Db::one("SELECT * FROM users WHERE {$login[0]} = ?", [$login[1]]) : null;
        // same work whether the user exists or not
        $hash = $user['password_hash'] ?? '$2y$10$WCv1d4JtXJZiJISiKxn4DOM5lIM8/V7OFGSu.R9NWe5ynYN0A1kuW';
        if (!password_verify($password, $hash) || !$user) {
            throw new ApiError(401, 'bad_credentials');
        }
        if (password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT)) {
            Db::run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_BCRYPT), $user['id']]);
        }
        RateLimit::clear('login:' . $ip . ':' . $login[1]);
        Db::run('UPDATE users SET last_login_at = ? WHERE id = ?', [Db::now(), $user['id']]);
        self::startSession($user['id']);
        return self::publicUser(self::withRole($user));
    }

    public static function logout(): void
    {
        $token = self::token();
        if ($token !== '') {
            Db::run('DELETE FROM sessions WHERE id = ?', [hash('sha256', $token)]);
        }
        self::setCookie('', time() - 3600);
    }

    /** The logged-in user or null; refreshes a session that is more than halfway to expiry. */
    public static function current(): ?array
    {
        static $user = false;
        if ($user !== false) {
            return $user;
        }
        $token = self::token();
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            return $user = null;
        }
        $row = Db::one(
            'SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?',
            [hash('sha256', $token), Db::now()],
        );
        if (!$row) {
            return $user = null;
        }
        $row = self::withRole($row);
        $left = strtotime($row['expires_at'] . ' UTC') - time();
        if ($left < self::TTL_DAYS * 86400 / 2) {
            $exp = time() + self::TTL_DAYS * 86400;
            Db::run('UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE id = ?', [gmdate('Y-m-d H:i:s', $exp), Db::now(), hash('sha256', $token)]);
            self::setCookie($token, $exp);
        }
        return $user = $row;
    }

    public static function require(): array
    {
        $u = self::current();
        if (!$u) {
            throw new ApiError(401, 'unauthorized');
        }
        return $u;
    }

    public static function publicUser(array $u): array
    {
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'phone' => $u['phone'],
            'email' => $u['email'],
            'role' => $u['role'],
            'proUntil' => Db::toIso($u['pro_until'] ?? null),
            'isPro' => Plan::isPro($u),
            'mustChangePassword' => (bool) ($u['must_change_password'] ?? false),
        ];
    }

    /** The account whose login equals ADMIN_LOGIN (config / EP_ADMIN_LOGIN) is the admin. */
    private static function withRole(array $u): array
    {
        $admin = self::normalizeLogin((string) (Db::config()['admin_login'] ?? ''));
        $isAdmin = $admin !== null && ($u[$admin[0]] ?? null) === $admin[1];
        $role = $isAdmin ? 'admin' : ($u['role'] === 'admin' ? 'electrician' : $u['role']);
        if ($role !== $u['role']) {
            Db::run('UPDATE users SET role = ? WHERE id = ?', [$role, $u['id']]);
            $u['role'] = $role;
        }
        return $u;
    }

    /** Own password change; required after an admin reset. Other sessions are signed out. */
    public static function changePassword(array $u, array $b): array
    {
        $current = (string) ($b['current'] ?? '');
        $next = (string) ($b['password'] ?? '');
        if (strlen($next) < 8 || strlen($next) > 200) {
            throw new ApiError(422, 'validation', '', ['fields' => ['password' => 'password_short']]);
        }
        RateLimit::hit('pwd:' . $u['id'], 10, 900);
        if (!password_verify($current, $u['password_hash'])) {
            throw new ApiError(422, 'validation', '', ['fields' => ['current' => 'bad_credentials']]);
        }
        Db::run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [password_hash($next, PASSWORD_BCRYPT), $u['id']]);
        $token = self::token();
        Db::run('DELETE FROM sessions WHERE user_id = ? AND id <> ?', [$u['id'], hash('sha256', $token)]);
        return self::publicUser(Db::one('SELECT * FROM users WHERE id = ?', [$u['id']]));
    }

    private static function startSession(string $userId): void
    {
        $token = bin2hex(random_bytes(32));
        $exp = time() + self::TTL_DAYS * 86400;
        Db::run(
            'INSERT INTO sessions (id, user_id, user_agent, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)',
            [hash('sha256', $token), $userId, substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255), gmdate('Y-m-d H:i:s', $exp), Db::now()],
        );
        Db::run('DELETE FROM sessions WHERE expires_at < ?', [Db::now()]);
        self::$issuedToken = $token;
        self::setCookie($token, $exp);
    }

    private static function setCookie(string $value, int $expires): void
    {
        setcookie(self::COOKIE, $value, [
            'expires' => $expires,
            'path' => '/',
            'secure' => Http::isHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}
