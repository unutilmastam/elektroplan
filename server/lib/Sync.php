<?php
declare(strict_types=1);

/**
 * Revision-based sync (ARCHITECTURE §4.7). The device pushes its whole project with the revision it is based on.
 * Same revision as the server -> stored in one transaction, revision + 1, change logged in project_history.
 * Different -> 409 with the server version; the device merges (src/domain/merge.ts) and pushes again.
 */
final class Sync
{
    public static function push(array $user, array $b): array
    {
        $project = $b['project'] ?? null;
        $base = $b['baseRevision'] ?? null;
        if (!is_array($project) || !is_int($base) || $base < 0) {
            throw new ApiError(400, 'bad_request');
        }
        ProjectRepo::validate($project);
        $ops = $b['ops'] ?? [];
        $conflicts = $b['conflicts'] ?? [];
        if (!is_array($ops) || !is_array($conflicts)) {
            throw new ApiError(400, 'bad_request');
        }
        $pdo = Db::pdo();
        $pdo->beginTransaction();
        try {
            $row = Db::one('SELECT owner_id, revision FROM projects WHERE id = ? FOR UPDATE', [$project['id']]);
            if ($row && $row['owner_id'] !== $user['id']) {
                throw new ApiError(403, 'forbidden');
            }
            $current = $row ? (int) $row['revision'] : 0;
            if ($row && $current !== $base) {
                $pdo->rollBack();
                return [409, ['error' => 'conflict', 'project' => ProjectRepo::load($project['id'])]];
            }
            $revision = $current + 1;
            ProjectRepo::write($project, $user['id'], $revision);
            $log = 'INSERT INTO project_history (id, project_id, user_id, revision, ops, kind) VALUES (?, ?, ?, ?, ?, ?)';
            if ($conflicts) {
                Db::run($log, [Db::uuid(), $project['id'], $user['id'], $revision, json_encode($conflicts, JSON_UNESCAPED_UNICODE), 'conflict']);
            }
            Db::run($log, [Db::uuid(), $project['id'], $user['id'], $revision, json_encode($ops ?: [['op' => 'snapshot']], JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION), 'change']);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
        return [200, ['revision' => $revision, 'ownerId' => $user['id']]];
    }

    /** Every project of the user that is newer on the server than the device's copy (`have`: id -> revision). */
    public static function pull(array $user, array $b): array
    {
        $have = $b['have'] ?? [];
        if (!is_array($have)) {
            throw new ApiError(400, 'bad_request');
        }
        $rows = Db::all('SELECT id, revision FROM projects WHERE owner_id = ? ORDER BY updated_at', [$user['id']]);
        $projects = [];
        $revisions = [];
        foreach ($rows as $r) {
            $revisions[$r['id']] = (int) $r['revision'];
            $known = $have[$r['id']] ?? -1;
            if (!is_int($known) || $known < (int) $r['revision']) {
                $projects[] = ProjectRepo::load($r['id']);
            }
        }
        return ['projects' => $projects, 'revisions' => (object) $revisions];
    }
}
