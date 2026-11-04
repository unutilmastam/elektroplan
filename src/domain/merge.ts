import { reconcile, type ReconcileOptions } from './topology';
import type {
  ElectricalPoint,
  InstallationTask,
  Opening,
  PointStatus,
  Project,
  ProjectSettings,
  Room,
  Wall,
} from './types';

/**
 * Sync conflict resolution (ARCHITECTURE §4.7). Pure three-way merge of two versions of one project:
 * `base` = the version both sides last agreed on (null when unknown, e.g. first sync), `local` = this device,
 * `remote` = the server.
 *
 * Rules
 * - Only one side changed something -> that change is taken (field by field, so edits to different fields of
 *   the same room / point by two devices are both kept).
 * - Both changed the same field differently -> last writer wins by the entity's `updatedAt` (tie -> server).
 * - Installation status never goes backwards in a conflict: completed > in_progress > pending.
 * - Deletion vs edit: the newer one wins (a deletion older than the other side's edit is undone).
 * - The installation log is append-only: union of both logs.
 * - Openings (no timestamps): removed on one side and untouched on the other -> removed.
 * - Every both-sides-changed field is reported as a conflict (server logs it in project_history).
 */

export type ConflictEntity = 'project' | 'settings' | 'room' | 'wall' | 'point' | 'opening';
export interface Conflict {
  entity: ConflictEntity;
  id: string;
  fields: string[];
}
export interface MergeResult {
  project: Project;
  conflicts: Conflict[];
}

const STATUS_RANK: Record<PointStatus, number> = { pending: 0, in_progress: 1, completed: 2 };

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
const maxIso = (a: string, b: string) => (a >= b ? a : b);
const minIso = (a: string, b: string) => (a <= b ? a : b);

type Stamped = { id: string; updatedAt: string; deletedAt: string | null; createdAt: string };

/**
 * Field-level three-way merge of one timestamped entity. `special` resolves chosen fields itself
 * (status) when both sides changed them.
 */
function mergeFields<T extends Stamped>(
  base: T | undefined,
  local: T,
  remote: T,
  entity: ConflictEntity,
  conflicts: Conflict[],
  special?: (field: keyof T, l: T, r: T) => Partial<T> | null,
): T {
  if (same(local, remote)) return local;
  const localWins = local.updatedAt > remote.updatedAt; // tie -> server
  const out = { ...remote } as T;
  const fields: string[] = [];
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)] as Array<keyof T>);
  keys.delete('updatedAt');
  keys.delete('createdAt');
  keys.delete('deletedAt');
  let specialPatch: Partial<T> = {};
  for (const k of keys) {
    const l = local[k];
    const r = remote[k];
    if (same(l, r)) continue;
    if (base && same(l, base[k])) out[k] = r;
    else if (base && same(r, base[k])) out[k] = l;
    else {
      fields.push(String(k));
      const s = special?.(k, local, remote);
      if (s) specialPatch = { ...specialPatch, ...s };
      else out[k] = localWins ? l : r;
    }
  }
  Object.assign(out, specialPatch);
  out.createdAt = minIso(local.createdAt, remote.createdAt);
  out.updatedAt = maxIso(local.updatedAt, remote.updatedAt);
  out.deletedAt = mergeDeletion(base, local, remote);
  if (fields.length) conflicts.push({ entity, id: local.id, fields });
  return out;
}

/** Newer deletion wins; an edit made after the other side's deletion brings the entity back. */
function mergeDeletion<T extends Stamped>(base: T | undefined, local: T, remote: T): string | null {
  const l = local.deletedAt;
  const r = remote.deletedAt;
  if (l === r) return l;
  if (l && r) return minIso(l, r);
  const [del, other] = l ? [local, remote] : [remote, local];
  const deletedAt = (l ?? r)!;
  // the other side did not touch it since the common version -> deletion stands
  if (base && same({ ...other, deletedAt: null }, { ...base, deletedAt: null })) return deletedAt;
  if (!base && other.updatedAt <= del.createdAt) return deletedAt;
  return other.updatedAt > deletedAt ? null : deletedAt;
}

const pointSpecial = (field: keyof ElectricalPoint, l: ElectricalPoint, r: ElectricalPoint) => {
  if (field !== 'status' && field !== 'statusChangedAt') return null;
  const rl = STATUS_RANK[l.status];
  const rr = STATUS_RANK[r.status];
  const win = rl > rr ? l : rr > rl ? r : (l.statusChangedAt ?? '') > (r.statusChangedAt ?? '') ? l : r;
  return { status: win.status, statusChangedAt: win.statusChangedAt };
};

function mergeList<T extends Stamped>(
  base: readonly T[] | null,
  local: readonly T[],
  remote: readonly T[],
  entity: ConflictEntity,
  conflicts: Conflict[],
  special?: (field: keyof T, l: T, r: T) => Partial<T> | null,
): T[] {
  const b = new Map((base ?? []).map((x) => [x.id, x]));
  const l = new Map(local.map((x) => [x.id, x]));
  const r = new Map(remote.map((x) => [x.id, x]));
  const out: T[] = [];
  // remote order first (server is the shared order), then local-only additions
  for (const [id, rv] of r) {
    const lv = l.get(id);
    out.push(lv ? mergeFields(b.get(id), lv, rv, entity, conflicts, special) : rv);
  }
  for (const [id, lv] of l) if (!r.has(id)) out.push(lv);
  return out;
}

/** Openings have no timestamps: three-way by presence and value; the newer project edit wins a tie. */
function mergeOpenings(
  base: readonly Opening[] | null,
  local: readonly Opening[],
  remote: readonly Opening[],
  localNewer: boolean,
  conflicts: Conflict[],
): Opening[] {
  const b = new Map((base ?? []).map((x) => [x.id, x]));
  const l = new Map(local.map((x) => [x.id, x]));
  const r = new Map(remote.map((x) => [x.id, x]));
  const ids = [...new Set([...r.keys(), ...l.keys(), ...b.keys()])];
  const out: Opening[] = [];
  for (const id of ids) {
    const bv = b.get(id);
    const lv = l.get(id);
    const rv = r.get(id);
    if (lv && rv) {
      if (same(lv, rv) || (bv && same(lv, bv))) out.push(rv);
      else if (bv && same(rv, bv)) out.push(lv);
      else {
        conflicts.push({
          entity: 'opening',
          id,
          fields: ['t', 'width', 'kind', 'swing'].filter(
            (k) => !same(lv[k as keyof Opening], rv[k as keyof Opening]),
          ),
        });
        out.push(localNewer ? lv : rv);
      }
    } else if (lv || rv) {
      const kept = (lv ?? rv)!;
      if (!bv)
        out.push(kept); // added on one side
      else if (!same(kept, bv)) out.push(kept); // removed on one side but changed on the other: keep the change
      // else removed on one side, untouched on the other -> removed
    }
  }
  return out;
}

function mergeLog(
  local: readonly InstallationTask[],
  remote: readonly InstallationTask[],
): InstallationTask[] {
  const byId = new Map<string, InstallationTask>();
  for (const t of [...remote, ...local]) if (!byId.has(t.id)) byId.set(t.id, t);
  return [...byId.values()].sort((a, b) =>
    a.createdAt === b.createdAt ? (a.id < b.id ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1,
  );
}

function mergeSettings(
  base: ProjectSettings | null,
  local: ProjectSettings,
  remote: ProjectSettings,
  localNewer: boolean,
  projectId: string,
  conflicts: Conflict[],
): ProjectSettings {
  const out = { ...remote };
  const fields: string[] = [];
  for (const k of Object.keys(remote) as Array<keyof ProjectSettings>) {
    if (same(local[k], remote[k])) continue;
    if (base && same(local[k], base[k])) continue;
    if (base && same(remote[k], base[k])) (out as Record<string, unknown>)[k] = local[k];
    else {
      fields.push(k);
      if (localNewer) (out as Record<string, unknown>)[k] = local[k];
    }
  }
  if (fields.length) conflicts.push({ entity: 'settings', id: projectId, fields });
  return out;
}

export interface MergeOptions {
  /** ids / time for walls rebuilt when both sides changed the plan geometry */
  topology: Pick<ReconcileOptions, 'makeId' | 'now'>;
}

export function mergeProjects(
  base: Project | null,
  local: Project,
  remote: Project,
  opts: MergeOptions,
): MergeResult {
  const conflicts: Conflict[] = [];
  if (same({ ...local, revision: 0 }, { ...remote, revision: 0 }))
    return {
      project: { ...local, revision: remote.revision, ownerId: remote.ownerId ?? local.ownerId },
      conflicts,
    };
  const localNewer = local.updatedAt > remote.updatedAt;

  // project-level scalars (field by field, LWW by project updatedAt)
  const head = mergeFields(
    base ? { ...pickHead(base) } : undefined,
    pickHead(local),
    pickHead(remote),
    'project',
    conflicts,
  );

  const rooms = mergeList(base?.rooms ?? null, local.rooms, remote.rooms, 'room', conflicts);
  const walls = mergeList(base?.walls ?? null, local.walls, remote.walls, 'wall', conflicts);
  const points = mergeList<ElectricalPoint>(
    base?.points ?? null,
    local.points,
    remote.points,
    'point',
    conflicts,
    pointSpecial,
  );
  const openings = mergeOpenings(
    base?.openings ?? null,
    local.openings,
    remote.openings,
    localNewer,
    conflicts,
  );

  let plan: Pick<Project, 'rooms' | 'walls' | 'points' | 'openings'> = { rooms, walls, points, openings };
  // both devices changed the plan: rebuild walls from the merged rooms so the topology stays consistent
  const geo = (p: Project) => ({ rooms: p.rooms, walls: p.walls });
  const localGeo = !base || !same(geo(base), geo(local));
  const remoteGeo = !base || !same(geo(base), geo(remote));
  if (localGeo && remoteGeo && !same(geo(local), geo(remote))) {
    plan = reconcile(plan, { makeId: opts.topology.makeId, now: opts.topology.now });
  }

  const project: Project = {
    ...remote,
    ...head,
    ownerId: remote.ownerId ?? local.ownerId,
    revision: remote.revision,
    rooms: plan.rooms as Room[],
    walls: plan.walls as Wall[],
    points: plan.points,
    openings: plan.openings,
    installLog: mergeLog(local.installLog, remote.installLog),
    settings: mergeSettings(
      base?.settings ?? null,
      local.settings,
      remote.settings,
      localNewer,
      local.id,
      conflicts,
    ),
  };
  return { project, conflicts };
}

type Head = Pick<
  Project,
  'id' | 'name' | 'customerName' | 'address' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;
const pickHead = (p: Project): Head => ({
  id: p.id,
  name: p.name,
  customerName: p.customerName,
  address: p.address,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  deletedAt: p.deletedAt,
});
