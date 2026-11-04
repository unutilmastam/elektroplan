import type { User } from './auth';
import type { Project } from './types';

/**
 * Free vs Pro (PHASE 14; server/lib/Plan.php does the same check on the server).
 * Free: one project with everything in it. Pro (99 000 so‘m / month, turned on by the admin): unlimited.
 * Projects made before the limit existed are kept and stay editable; only creating more needs Pro.
 */
export const FREE_PROJECTS = 1;
export const PRO_PRICE_UZS = 99_000;

export function isPro(user: User | null, now: Date = new Date()): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.proUntil !== null && new Date(user.proUntil).getTime() > now.getTime();
}

/** Live projects that count for this account on this device (another account's projects do not). */
export function countedProjects(projects: readonly Project[], user: User | null): number {
  return projects.filter((p) => p.deletedAt === null && (p.ownerId === null || p.ownerId === user?.id))
    .length;
}

export function canAddProjects(
  projects: readonly Project[],
  user: User | null,
  adding = 1,
  now = new Date(),
): boolean {
  return isPro(user, now) || countedProjects(projects, user) + adding <= FREE_PROJECTS;
}

/** Whole days of Pro left (0 when not Pro / admin). */
export function proDaysLeft(user: User | null, now: Date = new Date()): number {
  if (!user?.proUntil || user.role === 'admin') return 0;
  return Math.max(0, Math.ceil((new Date(user.proUntil).getTime() - now.getTime()) / 86_400_000));
}

/** "99 000" — Uzbek thousands separator (narrow no-break space). */
export function formatSum(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
