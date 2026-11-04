import { mergeProjects, type Conflict } from '@/domain/merge';
import type { Project } from '@/domain/types';
import { ApiFailure, type SyncResult } from '@/infra/api/client';

/**
 * One sync round (ARCHITECTURE §4.7), I/O injected so it is testable without a browser:
 *  1. pull: every server project newer than this device's agreed version
 *     - not on the device / no local changes -> taken as is
 *     - local changes too -> three-way merge (domain/merge.ts) and pushed in step 2
 *  2. push: every project of this account (or not yet attached to any) with unsent changes,
 *     based on the revision it was built on; 409 -> merge with the server version and retry.
 * Nothing local is ever dropped: a project only leaves the outbox after the server stored it.
 */
export interface SyncDeps {
  userId: string;
  api: {
    pull: (have: Record<string, number>) => Promise<{ projects: Project[] }>;
    sync: (b: {
      project: Project;
      baseRevision: number;
      ops: unknown[];
      conflicts: Conflict[];
    }) => Promise<SyncResult>;
  };
  /** local projects (all, incl. soft-deleted) — read fresh, edits may happen while syncing */
  projects: () => Project[];
  /**
   * write a version that came from / was merged with the server; `needsPush` adds an outbox marker.
   * false = the local copy changed meanwhile (`expectedUpdatedAt` no longer current): skipped this round.
   */
  saveLocal: (p: Project, needsPush: boolean, expectedUpdatedAt: string | null) => Promise<boolean>;
  /** the server stored `sent`: record its revision/owner on the local copy without touching content */
  markPushed: (id: string, revision: number, ownerId: string) => Promise<void>;
  synced: {
    get: (id: string) => Promise<Project | null>;
    put: (p: Project) => Promise<void>;
    revisions: () => Promise<Record<string, number>>;
  };
  outbox: {
    pending: (id: string) => Promise<{ keys: number[]; ops: unknown[] }>;
    remove: (keys: readonly number[]) => Promise<void>;
  };
  makeId: () => string;
  now: () => string;
}

export interface SyncReport {
  pulled: number;
  pushed: number;
  merged: number;
  /** projects attached to the account for the first time */
  attached: number;
  conflicts: Conflict[];
  /** projects the server refused (validation / other owner) */
  rejected: Array<{ id: string; code: string }>;
}

const MAX_RETRIES = 3;

export async function syncOnce(d: SyncDeps): Promise<SyncReport> {
  const report: SyncReport = { pulled: 0, pushed: 0, merged: 0, attached: 0, conflicts: [], rejected: [] };
  const find = (id: string) => d.projects().find((p) => p.id === id) ?? null;
  const opts = () => ({ topology: { makeId: d.makeId, now: d.now() } });
  const pendingConflicts = new Map<string, Conflict[]>();

  // 1. pull
  const { projects: remote } = await d.api.pull(await d.synced.revisions());
  for (const r of remote) {
    const local = find(r.id);
    const base = await d.synced.get(r.id);
    const { keys } = await d.outbox.pending(r.id);
    if (!local || keys.length === 0) {
      if (!(await d.saveLocal(r, false, local?.updatedAt ?? null))) continue;
      await d.synced.put(r);
      report.pulled++;
      continue;
    }
    const m = mergeProjects(base, local, r, opts());
    if (!(await d.saveLocal(m.project, true, local.updatedAt))) continue;
    await d.synced.put(r);
    pendingConflicts.set(r.id, m.conflicts);
    report.conflicts.push(...m.conflicts);
    report.merged++;
  }

  // 2. push
  for (const candidate of d.projects()) {
    if (candidate.ownerId !== null && candidate.ownerId !== d.userId) continue; // another account's project
    let { keys, ops } = await d.outbox.pending(candidate.id);
    const base = await d.synced.get(candidate.id);
    const neverSent = base === null;
    if (keys.length === 0 && !neverSent) continue;
    if (neverSent && candidate.deletedAt !== null && candidate.revision === 0) continue; // deleted before it ever synced
    let conflicts = pendingConflicts.get(candidate.id) ?? [];
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const project = find(candidate.id)!;
      let res: SyncResult;
      try {
        res = await d.api.sync({
          project,
          baseRevision: (await d.synced.get(project.id))?.revision ?? project.revision,
          ops,
          conflicts,
        });
      } catch (e) {
        // refused for this project only (invalid data / another account's id): keep it local, go on
        if (e instanceof ApiFailure && (e.status === 403 || e.status === 422)) {
          report.rejected.push({ id: project.id, code: e.code });
          break;
        }
        throw e; // offline / logged out / server down: the whole round stops and is retried later
      }
      if (res.kind === 'ok') {
        const attached = project.ownerId === null;
        await d.markPushed(project.id, res.revision, res.ownerId);
        await d.synced.put({ ...structuredClone(project), revision: res.revision, ownerId: res.ownerId });
        await d.outbox.remove(keys);
        report.pushed++;
        if (attached) report.attached++;
        break;
      }
      // someone else saved first: merge with their version and try again
      const agreed = await d.synced.get(project.id);
      const now = find(project.id)!;
      const m = mergeProjects(agreed, now, res.project, opts());
      if (!(await d.saveLocal(m.project, true, now.updatedAt))) break; // edited meanwhile: next round
      await d.synced.put(res.project);
      conflicts = m.conflicts;
      report.conflicts.push(...m.conflicts);
      report.merged++;
      ({ keys, ops } = await d.outbox.pending(candidate.id));
    }
  }
  return report;
}
