import { z } from 'zod';
import { ProjectSchema } from './schemas';
import type { Project } from './types';

/**
 * "Zaxira nusxa" file (`.elektroplan.json`): one or all projects, independent of browser storage
 * (ARCHITECTURE §4.6.5). Pure helpers: build, parse (zod), plan an import against local projects.
 */
export const BACKUP_FORMAT = 'elektroplan-backup';
export const BACKUP_VERSION = 1;
export const BACKUP_EXT = '.elektroplan.json';

export const BackupFileSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  projects: z.array(ProjectSchema).min(1),
});
export type BackupFile = z.infer<typeof BackupFileSchema>;

export function buildBackup(projects: readonly Project[], now: string): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now,
    projects: projects.filter((p) => p.deletedAt === null),
  };
}

/** Safe file name: "Uy-Chilonzor-2026-11-04.elektroplan.json" (letters incl. o‘ g‘ kept, rest -> '-'). */
export function backupFileName(base: string, date: string): string {
  const slug = base
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'ElektroPlan'}-${date.slice(0, 10)}${BACKUP_EXT}`;
}

export type BackupError = 'invalid_json' | 'invalid_file' | 'empty';

export function parseBackup(
  text: string,
): { ok: true; file: BackupFile } | { ok: false; error: BackupError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }
  const r = BackupFileSchema.safeParse(raw);
  if (r.success) return { ok: true, file: r.data };
  const empty =
    typeof raw === 'object' && raw !== null && Array.isArray((raw as { projects?: unknown }).projects)
      ? (raw as { projects: unknown[] }).projects.length === 0
      : false;
  return { ok: false, error: empty ? 'empty' : 'invalid_file' };
}

export interface ImportPlan {
  /** projects to write (new, or newer than the local copy) */
  write: Project[];
  added: number;
  updated: number;
  /** already on this device in the same or a newer version: never overwritten */
  skipped: number;
}

/**
 * Never loses local work: a backup project replaces the local one only when it is newer.
 * A project deleted on this device comes back when the backup holds it.
 */
export function planImport(local: readonly Project[], incoming: readonly Project[]): ImportPlan {
  const byId = new Map(local.map((p) => [p.id, p]));
  const plan: ImportPlan = { write: [], added: 0, updated: 0, skipped: 0 };
  const seen = new Set<string>();
  for (const p of incoming) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const cur = byId.get(p.id);
    if (!cur) {
      plan.write.push(p);
      plan.added++;
    } else if (cur.deletedAt !== null || p.updatedAt > cur.updatedAt) {
      plan.write.push({ ...p, revision: Math.max(p.revision, cur.revision) });
      if (cur.deletedAt !== null) plan.added++;
      else plan.updated++;
    } else plan.skipped++;
  }
  return plan;
}
