<?php
declare(strict_types=1);

/** JSON in / out and API errors. Every error is `{ "error": code, "message"?: text }`. */
final class ApiError extends RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message = '', public readonly array $extra = [])
    {
        parent::__construct($message !== '' ? $message : $errorCode);
    }
}

final class Http
{
    public static function json(int $status, array $body): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
        exit;
    }

    /** Request body as an array (JSON only, max 8 MB). */
    public static function body(): array
    {
        $type = $_SERVER['CONTENT_TYPE'] ?? '';
        if (!str_starts_with(strtolower($type), 'application/json')) {
            throw new ApiError(415, 'json_required');
        }
        $raw = file_get_contents('php://input', false, null, 0, 8 * 1024 * 1024 + 1);
        if ($raw === false || strlen($raw) > 8 * 1024 * 1024) {
            throw new ApiError(413, 'too_large');
        }
        try {
            $data = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new ApiError(400, 'invalid_json');
        }
        if (!is_array($data)) {
            throw new ApiError(400, 'invalid_json');
        }
        return $data;
    }

    public static function clientIp(): string
    {
        return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
    }

    public static function isHttps(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    }
}
