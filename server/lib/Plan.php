<?php
declare(strict_types=1);

/** Free vs Pro (PHASE 14). Mirrors src/domain/plan.ts. The admin is always Pro. */
final class Plan
{
    public const FREE_PROJECTS = 1;

    public static function isPro(array $u): bool
    {
        if (($u['role'] ?? '') === 'admin') {
            return true;
        }
        $until = $u['pro_until'] ?? null;
        return $until !== null && strtotime($until . ' UTC') > time();
    }

    /** Live (not deleted) projects the user owns on the server. */
    public static function liveProjects(string $userId): int
    {
        return (int) (Db::one('SELECT COUNT(*) AS n FROM projects WHERE owner_id = ? AND deleted_at IS NULL', [$userId])['n'] ?? 0);
    }
}
