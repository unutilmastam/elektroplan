import { backupFileName, buildBackup, parseBackup, planImport, type BackupError } from '@/domain/backup';
import type { Project } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { saveFile } from '@/lib/saveFile';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';

const notify = (t: string) => useUiStore.getState().notify(t);

/** Saves one project (`id`) or every project as `.elektroplan.json` (share sheet on touch devices). */
export async function exportBackup(id?: string): Promise<void> {
  const store = useProjectStore.getState();
  try {
    await store.flush();
    const all = useProjectStore.getState().projects.filter((p) => p.deletedAt === null);
    const list: Project[] = id ? all.filter((p) => p.id === id) : all;
    if (!list.length) return notify(uz.backup.nothing);
    const now = new Date().toISOString();
    const base = id ? list[0]!.name : `${uz.app.name}-${uz.backup.title}`;
    const blob = new Blob([JSON.stringify(buildBackup(list, now))], { type: 'application/json' });
    const r = await saveFile(blob, backupFileName(base, now), base);
    if (r !== 'cancelled') notify(uz.backup.exported);
  } catch {
    notify(uz.backup.failed);
  }
}

/** Reads a backup file, validates it (zod) and adds / updates projects without overwriting newer local work. */
export async function importBackup(file: File): Promise<void> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return notify(uz.backup.errors.read_failed);
  }
  const parsed = parseBackup(text);
  if (!parsed.ok) return notify(uz.backup.errors[parsed.error satisfies BackupError]);
  const store = useProjectStore.getState();
  const plan = planImport(store.projects, parsed.file.projects);
  try {
    await store.importProjects(plan.write);
    notify(
      uz.backup.imported
        .replace('{added}', String(plan.added))
        .replace('{updated}', String(plan.updated))
        .replace('{skipped}', String(plan.skipped)),
    );
  } catch {
    notify(uz.backup.failed);
  }
}
