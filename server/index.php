<?php
declare(strict_types=1);

// Placeholder API entry point. The real router, auth and sync endpoints arrive in Phase 12.
header('Content-Type: application/json; charset=utf-8');
http_response_code(503);
echo json_encode(['error' => 'not_implemented', 'message' => 'Server API keyingi bosqichda'], JSON_UNESCAPED_UNICODE);
