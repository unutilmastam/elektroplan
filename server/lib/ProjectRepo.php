<?php
declare(strict_types=1);

/**
 * Project document <-> normalized MySQL tables (server/migrations). The document shape is the client's
 * `Project` (src/domain/types.ts); reading back returns exactly what was written (same order, same values).
 */
final class ProjectRepo
{
    private const SYMBOLS = ['socket-single', 'socket-double', 'socket-triple', 'switch-single', 'switch-double', 'internet', 'tv', 'ceiling-light', 'led', 'ac', 'custom'];
    private const STATUS = ['pending', 'in_progress', 'completed'];

    // ---------- validation (mirrors ProjectSchema in src/domain/schemas.ts + column limits) ----------

    private static function fail(string $path, string $why = 'invalid'): never
    {
        throw new ApiError(422, 'invalid_project', "$path: $why");
    }

    private static function str(array $o, string $k, string $path, int $max, bool $null = false, bool $nonEmpty = false): ?string
    {
        if (!array_key_exists($k, $o)) {
            self::fail("$path.$k", 'missing');
        }
        $v = $o[$k];
        if ($v === null && $null) {
            return null;
        }
        if (!is_string($v) || mb_strlen($v) > $max || ($nonEmpty && $v === '')) {
            self::fail("$path.$k");
        }
        return $v;
    }

    private static function num(array $o, string $k, string $path, bool $null = false): ?float
    {
        $v = $o[$k] ?? null;
        if ($v === null && $null && array_key_exists($k, $o)) {
            return null;
        }
        if (!is_int($v) && !is_float($v)) {
            self::fail("$path.$k");
        }
        return (float) $v;
    }

    private static function id(array $o, string $k, string $path, bool $null = false): ?string
    {
        $v = self::str($o, $k, $path, 36, $null, true);
        return $v;
    }

    private static function vec($v, string $path): array
    {
        if (!is_array($v) || !(is_int($v['x'] ?? null) || is_float($v['x'] ?? null)) || !(is_int($v['y'] ?? null) || is_float($v['y'] ?? null))) {
            self::fail($path);
        }
        return ['x' => $v['x'], 'y' => $v['y']];
    }

    private static function list(array $o, string $k, string $path): array
    {
        $v = $o[$k] ?? [];
        if (!is_array($v) || !array_is_list($v)) {
            self::fail("$path.$k");
        }
        return $v;
    }

    private static function stamps(array $o, string $path): void
    {
        self::str($o, 'createdAt', $path, 40, false, true);
        self::str($o, 'updatedAt', $path, 40, false, true);
        self::str($o, 'deletedAt', $path, 40, true, true);
    }

    /** Throws 422 on anything the tables cannot store faithfully. Returns the project (unchanged). */
    public static function validate(array $p): array
    {
        self::id($p, 'id', 'project');
        self::str($p, 'name', 'project', 200);
        self::str($p, 'customerName', 'project', 200);
        self::str($p, 'address', 'project', 300);
        self::stamps($p, 'project');
        $s = $p['settings'] ?? null;
        if (!is_array($s) || !is_bool($s['snapToGrid'] ?? null)) {
            self::fail('project.settings');
        }
        foreach (['gridSize', 'defaultSocketHeightCm', 'defaultSwitchHeightCm', 'wallDisplayHeightCm'] as $k) {
            self::num($s, $k, 'settings');
        }
        $roomIds = [];
        foreach (self::list($p, 'rooms', 'project') as $i => $r) {
            $path = "rooms[$i]";
            if (!is_array($r)) {
                self::fail($path);
            }
            $roomIds[self::id($r, 'id', $path)] = true;
            self::str($r, 'name', $path, 200);
            self::str($r, 'color', $path, 9);
            if (!in_array($r['shape'] ?? null, ['rect', 'square', 'polygon'], true) || !is_int($r['order'] ?? null)) {
                self::fail($path);
            }
            foreach (self::list($r, 'vertices', $path) as $j => $v) {
                self::vec($v, "$path.vertices[$j]");
            }
            self::vec($r['labelOffset'] ?? null, "$path.labelOffset");
            self::stamps($r, $path);
        }
        $wallIds = [];
        foreach (self::list($p, 'walls', 'project') as $i => $w) {
            $path = "walls[$i]";
            if (!is_array($w)) {
                self::fail($path);
            }
            $wallIds[self::id($w, 'id', $path)] = true;
            self::vec($w['a'] ?? null, "$path.a");
            self::vec($w['b'] ?? null, "$path.b");
            self::num($w, 'thickness', $path);
            self::str($w, 'name', $path, 200, true);
            $rids = self::list($w, 'roomIds', $path);
            if (count($rids) > 2) {
                self::fail("$path.roomIds");
            }
            foreach ($rids as $rid) {
                if (!is_string($rid) || !isset($roomIds[$rid])) {
                    self::fail("$path.roomIds", 'unknown room');
                }
            }
            self::stamps($w, $path);
        }
        foreach (self::list($p, 'openings', 'project') as $i => $o) {
            $path = "openings[$i]";
            if (!is_array($o) || !in_array($o['kind'] ?? null, ['door', 'window'], true) || !in_array($o['swing'] ?? null, [1, -1], true)) {
                self::fail($path);
            }
            self::id($o, 'id', $path);
            self::id($o, 'wallId', $path);
            self::num($o, 't', $path);
            self::num($o, 'width', $path);
        }
        $pointIds = [];
        foreach (self::list($p, 'points', 'project') as $i => $pt) {
            $path = "points[$i]";
            if (!is_array($pt) || !in_array($pt['symbolId'] ?? null, self::SYMBOLS, true) || !in_array($pt['status'] ?? null, self::STATUS, true) || !in_array($pt['side'] ?? null, [1, -1], true)) {
                self::fail($path);
            }
            $pointIds[self::id($pt, 'id', $path)] = true;
            if (!isset($roomIds[self::id($pt, 'roomId', $path)])) {
                self::fail("$path.roomId", 'unknown room');
            }
            self::id($pt, 'wallId', $path, true);
            self::num($pt, 't', $path, true);
            self::num($pt, 'x', $path);
            self::num($pt, 'y', $path);
            self::num($pt, 'mountHeightCm', $path, true);
            self::num($pt, 'distanceFromCornerCm', $path, true);
            self::str($pt, 'description', $path, 20000);
            self::str($pt, 'color', $path, 9);
            self::str($pt, 'label', $path, 120, true);
            self::str($pt, 'statusChangedAt', $path, 40, true, true);
            self::stamps($pt, $path);
        }
        foreach (self::list($p, 'installLog', 'project') as $i => $t) {
            $path = "installLog[$i]";
            if (!is_array($t) || !in_array($t['fromStatus'] ?? null, self::STATUS, true) || !in_array($t['toStatus'] ?? null, self::STATUS, true)) {
                self::fail($path);
            }
            self::id($t, 'id', $path);
            if (!isset($pointIds[self::id($t, 'pointId', $path)])) {
                self::fail("$path.pointId", 'unknown point');
            }
            self::id($t, 'userId', $path, true);
            self::str($t, 'createdAt', $path, 40, false, true);
        }
        return $p;
    }

    // ---------- write ----------

    /** Replaces the stored project (inside the caller's transaction). */
    public static function write(array $p, string $ownerId, int $revision): void
    {
        $id = $p['id'];
        $d = fn (?string $iso) => Db::toDb($iso);
        Db::run(
            'INSERT INTO projects (id, owner_id, name, customer_name, address, revision, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), customer_name = VALUES(customer_name), address = VALUES(address),
               revision = VALUES(revision), created_at = VALUES(created_at), updated_at = VALUES(updated_at), deleted_at = VALUES(deleted_at)',
            [$id, $ownerId, $p['name'], $p['customerName'], $p['address'], $revision, $d($p['createdAt']), $d($p['updatedAt']), $d($p['deletedAt'])],
        );
        $s = $p['settings'];
        Db::run(
            'REPLACE INTO project_settings (project_id, grid_size, snap_to_grid, default_socket_height_cm, default_switch_height_cm, wall_display_height_cm)
             VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $s['gridSize'], $s['snapToGrid'] ? 1 : 0, $s['defaultSocketHeightCm'], $s['defaultSwitchHeightCm'], $s['wallDisplayHeightCm']],
        );
        // children: delete and re-insert (a project is a few hundred rows at most)
        foreach (['installation_tasks', 'openings', 'electrical_points'] as $t) {
            Db::run("DELETE FROM $t WHERE project_id = ?", [$id]);
        }
        foreach (['wall_rooms', 'walls', 'rooms'] as $t) {
            Db::run("DELETE FROM $t WHERE project_id = ?", [$id]);
        }

        $j = fn ($v) => json_encode($v, JSON_PRESERVE_ZERO_FRACTION);
        self::insertMany('rooms', ['id', 'project_id', 'name', 'color', 'shape', 'vertices', 'label_offset', 'sort_order', 'seq', 'created_at', 'updated_at', 'deleted_at'],
            array_map(fn ($r, $i) => [$r['id'], $id, $r['name'], $r['color'], $r['shape'], $j($r['vertices']), $j($r['labelOffset']), $r['order'], $i, $d($r['createdAt']), $d($r['updatedAt']), $d($r['deletedAt'])], $p['rooms'], array_keys($p['rooms'])));
        self::insertMany('walls', ['id', 'project_id', 'a_x', 'a_y', 'b_x', 'b_y', 'thickness', 'seq', 'name', 'created_at', 'updated_at', 'deleted_at'],
            array_map(fn ($w, $i) => [$w['id'], $id, $w['a']['x'], $w['a']['y'], $w['b']['x'], $w['b']['y'], $w['thickness'], $i, $w['name'], $d($w['createdAt']), $d($w['updatedAt']), $d($w['deletedAt'])], $p['walls'], array_keys($p['walls'])));
        $wr = [];
        foreach ($p['walls'] as $w) {
            foreach ($w['roomIds'] as $k => $rid) {
                $wr[] = [$id, $w['id'], $rid, $k];
            }
        }
        self::insertMany('wall_rooms', ['project_id', 'wall_id', 'room_id', 'seq'], $wr);
        self::insertMany('openings', ['id', 'project_id', 'wall_id', 'kind', 't', 'width', 'swing', 'seq'],
            array_map(fn ($o, $i) => [$o['id'], $id, $o['wallId'], $o['kind'], $o['t'], $o['width'], $o['swing'], $i], $p['openings'] ?? [], array_keys($p['openings'] ?? [])));
        // a wallId of a wall that is not in the project is stored as null (same as the old FK rule)
        $wallIds = array_flip(array_column($p['walls'], 'id'));
        self::insertMany('electrical_points', ['id', 'project_id', 'room_id', 'wall_id', 'symbol_id', 't', 'side', 'seq', 'x', 'y', 'mount_height_cm', 'distance_from_corner_cm', 'description', 'color', 'label', 'status', 'status_changed_at', 'created_at', 'updated_at', 'deleted_at'],
            array_map(fn ($pt, $i) => [$pt['id'], $id, $pt['roomId'], isset($wallIds[$pt['wallId'] ?? '']) ? $pt['wallId'] : null, $pt['symbolId'], $pt['t'], $pt['side'], $i, $pt['x'], $pt['y'], $pt['mountHeightCm'], $pt['distanceFromCornerCm'], $pt['description'], $pt['color'], $pt['label'], $pt['status'], $d($pt['statusChangedAt']), $d($pt['createdAt']), $d($pt['updatedAt']), $d($pt['deletedAt'])], $p['points'], array_keys($p['points'])));
        // log rows keep the author only when the account exists (FK); otherwise null
        $userIds = [];
        foreach ($p['installLog'] ?? [] as $t) {
            if ($t['userId'] !== null) {
                $userIds[$t['userId']] = true;
            }
        }
        $known = [];
        if ($userIds) {
            $in = implode(',', array_fill(0, count($userIds), '?'));
            $known = array_flip(array_column(Db::all("SELECT id FROM users WHERE id IN ($in)", array_keys($userIds)), 'id'));
        }
        self::insertMany('installation_tasks', ['id', 'project_id', 'point_id', 'user_id', 'from_status', 'to_status', 'seq', 'created_at'],
            array_map(fn ($t, $i) => [$t['id'], $id, $t['pointId'], isset($known[$t['userId'] ?? '']) ? $t['userId'] : null, $t['fromStatus'], $t['toStatus'], $i, $d($t['createdAt'])], $p['installLog'] ?? [], array_keys($p['installLog'] ?? [])));
    }

    private static function insertMany(string $table, array $cols, array $rows): void
    {
        foreach (array_chunk($rows, 200) as $chunk) {
            $ph = '(' . implode(',', array_fill(0, count($cols), '?')) . ')';
            $sql = "INSERT INTO $table (" . implode(',', $cols) . ') VALUES ' . implode(',', array_fill(0, count($chunk), $ph));
            Db::run($sql, array_merge(...$chunk));
        }
    }

    // ---------- read ----------

    public static function load(string $id): ?array
    {
        $p = Db::one('SELECT * FROM projects WHERE id = ?', [$id]);
        if (!$p) {
            return null;
        }
        $i = fn ($v) => Db::toIso($v);
        $s = Db::one('SELECT * FROM project_settings WHERE project_id = ?', [$id]) ?? [];
        $rooms = array_map(fn ($r) => [
            'id' => $r['id'], 'name' => $r['name'], 'color' => $r['color'], 'shape' => $r['shape'],
            'vertices' => json_decode($r['vertices'], true), 'labelOffset' => json_decode($r['label_offset'], true),
            'order' => (int) $r['sort_order'],
            'createdAt' => $i($r['created_at']), 'updatedAt' => $i($r['updated_at']), 'deletedAt' => $i($r['deleted_at']),
        ], Db::all('SELECT * FROM rooms WHERE project_id = ? ORDER BY seq', [$id]));
        $links = [];
        foreach (Db::all('SELECT * FROM wall_rooms WHERE project_id = ? ORDER BY seq', [$id]) as $l) {
            $links[$l['wall_id']][] = $l['room_id'];
        }
        $walls = array_map(fn ($w) => [
            'id' => $w['id'], 'a' => ['x' => self::n($w['a_x']), 'y' => self::n($w['a_y'])], 'b' => ['x' => self::n($w['b_x']), 'y' => self::n($w['b_y'])],
            'thickness' => self::n($w['thickness']), 'roomIds' => $links[$w['id']] ?? [], 'name' => $w['name'],
            'createdAt' => $i($w['created_at']), 'updatedAt' => $i($w['updated_at']), 'deletedAt' => $i($w['deleted_at']),
        ], Db::all('SELECT * FROM walls WHERE project_id = ? ORDER BY seq', [$id]));
        $openings = array_map(fn ($o) => [
            'id' => $o['id'], 'wallId' => $o['wall_id'], 'kind' => $o['kind'], 't' => self::n($o['t']), 'width' => self::n($o['width']), 'swing' => (int) $o['swing'],
        ], Db::all('SELECT * FROM openings WHERE project_id = ? ORDER BY seq', [$id]));
        $points = array_map(fn ($q) => [
            'id' => $q['id'], 'symbolId' => $q['symbol_id'], 'roomId' => $q['room_id'], 'wallId' => $q['wall_id'],
            't' => self::n($q['t']), 'side' => (int) $q['side'], 'x' => self::n($q['x']), 'y' => self::n($q['y']),
            'mountHeightCm' => self::n($q['mount_height_cm']), 'distanceFromCornerCm' => self::n($q['distance_from_corner_cm']),
            'description' => $q['description'], 'color' => $q['color'], 'label' => $q['label'], 'status' => $q['status'],
            'statusChangedAt' => $i($q['status_changed_at']),
            'createdAt' => $i($q['created_at']), 'updatedAt' => $i($q['updated_at']), 'deletedAt' => $i($q['deleted_at']),
        ], Db::all('SELECT * FROM electrical_points WHERE project_id = ? ORDER BY seq', [$id]));
        $log = array_map(fn ($t) => [
            'id' => $t['id'], 'pointId' => $t['point_id'], 'userId' => $t['user_id'],
            'fromStatus' => $t['from_status'], 'toStatus' => $t['to_status'], 'createdAt' => $i($t['created_at']),
        ], Db::all('SELECT * FROM installation_tasks WHERE project_id = ? ORDER BY seq', [$id]));
        return [
            'id' => $p['id'], 'ownerId' => $p['owner_id'], 'name' => $p['name'], 'customerName' => $p['customer_name'],
            'address' => $p['address'], 'revision' => (int) $p['revision'],
            'rooms' => $rooms, 'walls' => $walls, 'points' => $points, 'openings' => $openings, 'installLog' => $log,
            'settings' => [
                'gridSize' => self::n($s['grid_size'] ?? 20), 'snapToGrid' => (bool) ($s['snap_to_grid'] ?? true),
                'defaultSocketHeightCm' => self::n($s['default_socket_height_cm'] ?? 30),
                'defaultSwitchHeightCm' => self::n($s['default_switch_height_cm'] ?? 90),
                'wallDisplayHeightCm' => self::n($s['wall_display_height_cm'] ?? 270),
            ],
            'createdAt' => $i($p['created_at']), 'updatedAt' => $i($p['updated_at']), 'deletedAt' => $i($p['deleted_at']),
        ];
    }

    /** DOUBLE column -> JSON number that equals what the client sent (30 stays an integer, 0.1 stays 0.1). */
    private static function n($v): int|float|null
    {
        if ($v === null) {
            return null;
        }
        $f = (float) $v;
        return (floor($f) === $f && abs($f) < 2 ** 53) ? (int) $f : $f;
    }
}
