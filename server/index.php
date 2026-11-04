<?php
declare(strict_types=1);

/**
 * ELEKTROPLAN API (public_html/api). JSON in, JSON out.
 *   GET  /api/health              POST /api/auth/register   POST /api/auth/login
 *   POST /api/auth/logout         GET  /api/auth/me
 *   POST /api/auth/password       POST /api/sync            POST /api/pull
 *   GET  /api/admin/users?q=      POST /api/admin/users/{id}/reset-password   POST /api/admin/users/{id}/pro
 *   GET  /api/migrate?token=…
 * State-changing requests must carry `X-Elektroplan: 1` (with SameSite=Lax cookies this blocks CSRF).
 * The Windows app (Tauri, origin tauri.localhost) is allowed by CORS and authenticates with the
 * `X-Elektroplan-Auth` header; login/register return its token when `X-Elektroplan-Client: desktop`.
 */
ini_set('display_errors', '0');
ini_set('serialize_precision', '-1');
require __DIR__ . '/lib/Http.php';
require __DIR__ . '/lib/Db.php';
require __DIR__ . '/lib/RateLimit.php';
require __DIR__ . '/lib/Auth.php';
require __DIR__ . '/lib/ProjectRepo.php';
require __DIR__ . '/lib/Plan.php';
require __DIR__ . '/lib/Sync.php';
require __DIR__ . '/lib/Admin.php';
require __DIR__ . '/lib/Migrator.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$path = '/' . trim((string) preg_replace('#^.*?/api(?=/|$)#', '', $path), '/');

const DESKTOP_ORIGINS = ['http://tauri.localhost', 'https://tauri.localhost', 'tauri://localhost'];
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if (in_array($origin, DESKTOP_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, X-Elektroplan, X-Elektroplan-Auth, X-Elektroplan-Client');
    header('Access-Control-Max-Age: 86400');
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
/** Login answer; the desktop app also gets its session token (it has no cookie jar for our domain). */
function userAnswer(array $user): array
{
    $desktop = ($_SERVER['HTTP_X_ELEKTROPLAN_CLIENT'] ?? '') === 'desktop';
    return ['user' => $user] + ($desktop && Auth::$issuedToken ? ['token' => Auth::$issuedToken] : []);
}

try {
    if ($method === 'POST' && ($_SERVER['HTTP_X_ELEKTROPLAN'] ?? '') !== '1') {
        throw new ApiError(403, 'csrf');
    }
    $route = "$method $path";
    switch ($route) {
        case 'GET /ping': // no database: the PHP side is up
            Http::json(200, ['ok' => true]);
        case 'GET /health':
            Db::pdo()->query('SELECT 1');
            Http::json(200, ['ok' => true]);
        case 'POST /auth/register':
            Http::json(201, userAnswer(Auth::register(Http::body())));
        case 'POST /auth/login':
            Http::json(200, userAnswer(Auth::login(Http::body())));
        case 'POST /auth/logout':
            Auth::logout();
            Http::json(200, ['ok' => true]);
        case 'GET /auth/me':
            $u = Auth::current();
            $u ? Http::json(200, ['user' => Auth::publicUser($u)]) : Http::json(401, ['error' => 'unauthorized']);
        case 'POST /auth/password':
            Http::json(200, ['user' => Auth::changePassword(Auth::require(), Http::body())]);
        case 'GET /admin/users':
            Admin::require();
            Http::json(200, ['users' => Admin::users((string) ($_GET['q'] ?? ''))]);
        case 'POST /sync':
            [$status, $body] = Sync::push(Auth::require(), Http::body());
            Http::json($status, $body);
        case 'POST /pull':
            Http::json(200, Sync::pull(Auth::require(), Http::body()));
        case 'GET /migrate':
            $token = (string) (Db::config()['migrate_token'] ?? '');
            if ($token === '' || !hash_equals($token, (string) ($_GET['token'] ?? ''))) {
                throw new ApiError(404, 'not_found');
            }
            Http::json(200, ['applied' => Migrator::run(Db::pdo())]);
        default:
            if ($method === 'POST' && preg_match('#^/admin/users/([0-9a-f-]{36})/(reset-password|pro)$#', $path, $m)) {
                $admin = Admin::require();
                Http::json(200, $m[2] === 'pro' ? Admin::setPro($admin, $m[1], Http::body()) : Admin::resetPassword($admin, $m[1]));
            }
            throw new ApiError(404, 'not_found');
    }
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->errorCode] + ($e->getMessage() !== $e->errorCode ? ['message' => $e->getMessage()] : []) + $e->extra);
} catch (Throwable $e) {
    error_log('elektroplan api: ' . $e);
    Http::json(500, ['error' => 'server_error']);
}
