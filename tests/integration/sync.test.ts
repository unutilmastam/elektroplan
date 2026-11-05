// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Conflict } from '@/domain/merge';
import { ProjectSchema } from '@/domain/schemas';
import type { ElectricalPoint, Project } from '@/domain/types';
import { buildDemoProject } from '@/features/dashboard/demoProject';
import { syncOnce, type SyncDeps } from '@/infra/sync/syncEngine';
import type { SyncResult } from '@/infra/api/client';
import { available, Device, startApi, type PhpApi } from './helpers/phpApi';

/**
 * PHASE 12 acceptance: the same project is edited OFFLINE on an iPad and a phone; when both reconnect
 * nothing is lost. Runs against an in-memory server with the same protocol and against the real
 * PHP API + MySQL (when available — always in CI).
 */
type ServerApi = SyncDeps['api'];

let clock = Date.parse('2026-11-04T08:00:00.000Z');
const tick = () => new Date((clock += 1000)).toISOString();
let ids = 0;

/** One device: projects in "IndexedDB", agreed versions, outbox. */
class MemDevice {
  projects: Project[] = [];
  synced = new Map<string, Project>();
  outbox: Array<{ key: number; projectId: string; ops: unknown[] }> = [];
  private key = 0;
  constructor(
    public name: string,
    public userId: string,
    private api: ServerApi,
  ) {}
  create(p: Project) {
    this.projects.push(structuredClone(p));
    this.outbox.push({ key: ++this.key, projectId: p.id, ops: [{ op: 'replace', path: [], value: p.id }] });
  }
  edit(id: string, f: (p: Project, now: string) => void) {
    const i = this.projects.findIndex((p) => p.id === id);
    const d = structuredClone(this.projects[i]!);
    const now = tick();
    f(d, now);
    d.updatedAt = now;
    this.projects[i] = d;
    this.outbox.push({ key: ++this.key, projectId: id, ops: [{ op: 'edit', at: now }] });
  }
  get(id: string) {
    return this.projects.find((p) => p.id === id)!;
  }
  sync() {
    const deps: SyncDeps = {
      userId: this.userId,
      api: this.api,
      projects: () => this.projects,
      saveLocal: async (p, needsPush) => {
        const i = this.projects.findIndex((x) => x.id === p.id);
        if (i >= 0) this.projects[i] = structuredClone(p);
        else this.projects.push(structuredClone(p));
        if (needsPush) this.outbox.push({ key: ++this.key, projectId: p.id, ops: [{ op: 'merge' }] });
        return true;
      },
      markPushed: async (id, revision, ownerId) => {
        const p = this.get(id);
        p.revision = revision;
        p.ownerId = ownerId;
      },
      synced: {
        get: async (id) => structuredClone(this.synced.get(id) ?? null),
        put: async (p) => void this.synced.set(p.id, structuredClone(p)),
        revisions: async () => Object.fromEntries([...this.synced].map(([k, v]) => [k, v.revision])),
      },
      outbox: {
        pending: async (id) => {
          const rows = this.outbox.filter((r) => r.projectId === id);
          return { keys: rows.map((r) => r.key), ops: rows.flatMap((r) => r.ops) };
        },
        remove: async (keys) => void (this.outbox = this.outbox.filter((r) => !keys.includes(r.key))),
      },
      makeId: () => `gen-${++ids}`,
      now: tick,
    };
    return syncOnce(deps);
  }
}

/** In-memory server with the PHP protocol (revision check, 409 + server version, owner check). */
function memServer(): { as: (userId: string) => ServerApi; stored: Map<string, Project> } {
  const stored = new Map<string, Project>();
  return {
    stored,
    as: (userId) => ({
      pull: async (have) => ({
        projects: [...stored.values()]
          .filter((p) => p.ownerId === userId && (have[p.id] ?? -1) < p.revision)
          .map((p) => structuredClone(p)),
      }),
      sync: async ({ project, baseRevision }): Promise<SyncResult> => {
        const cur = stored.get(project.id);
        if (cur && cur.ownerId !== userId) throw new Error('forbidden');
        if (cur && cur.revision !== baseRevision) return { kind: 'conflict', project: structuredClone(cur) };
        const revision = (cur?.revision ?? 0) + 1;
        stored.set(project.id, { ...structuredClone(project), revision, ownerId: userId });
        return { kind: 'ok', revision, ownerId: userId };
      },
    }),
  };
}

/** Adapter: SyncDeps api on top of the real PHP API (cookie session per device). */
function phpServerApi(d: Device): ServerApi {
  return {
    pull: async (have) => {
      const r = await d.call('POST', '/pull', { have });
      if (r.status !== 200) throw new Error(`pull ${r.status}`);
      return { projects: (r.body.projects as unknown[]).map((p) => ProjectSchema.parse(p)) };
    },
    sync: async (b: { project: Project; baseRevision: number; ops: unknown[]; conflicts: Conflict[] }) => {
      const r = await d.call('POST', '/sync', b);
      if (r.status === 409) return { kind: 'conflict', project: ProjectSchema.parse(r.body.project) };
      if (r.status !== 200) throw new Error(`sync ${r.status} ${JSON.stringify(r.body)}`);
      return { kind: 'ok', revision: r.body.revision as number, ownerId: r.body.ownerId as string };
    },
  };
}

const noRev = (p: Project) => ({ ...p, revision: 0 });
const pt = (p: Project, id: string) => p.points.find((x) => x.id === id)!;
const live = <T extends { deletedAt: string | null }>(xs: T[]) => xs.filter((x) => x.deletedAt === null);
const newPoint = (id: string, roomId: string, now: string): ElectricalPoint => ({
  id,
  symbolId: 'socket-quad', // PHASE 20: the new symbol goes through the server (migration 004)
  roomId,
  wallId: null,
  t: null,
  side: 1,
  x: 10,
  y: 10,
  mountHeightCm: 30,
  distanceFromCornerCm: null,
  description: 'telefonda qo‘shildi',
  color: '#3b8bff',
  label: null,
  status: 'pending',
  statusChangedAt: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
});

/** The scenario, run against any server. */
async function offlineScenario(ipadApi: ServerApi, phoneApi: ServerApi, userId: string, projectId: string) {
  const ipad = new MemDevice('ipad', userId, ipadApi);
  const phone = new MemDevice('phone', userId, phoneApi);
  const demo = { ...buildDemoProject(), id: projectId, ownerId: null, revision: 0 };
  const [p1, p2, p3] = demo.points.map((p) => p.id);
  const roomId = demo.rooms[0]!.id;

  // created on the iPad (no account yet) -> attached to the account on first sync
  ipad.create(demo);
  const first = await ipad.sync();
  expect(first).toMatchObject({ pushed: 1, attached: 1 });
  // the phone logs in: downloads every project of the account
  expect(await phone.sync()).toMatchObject({ pulled: 1 });
  expect(phone.get(projectId).name).toBe(demo.name);

  // ---- both go offline and work on the same project ----
  ipad.edit(projectId, (p, now) => {
    p.name = 'Chilonzor, 5-uy';
    Object.assign(pt(p, p1!), { mountHeightCm: 110, description: 'TV ostida', updatedAt: now });
    Object.assign(pt(p, p2!), { status: 'in_progress', statusChangedAt: now, updatedAt: now });
    p.installLog.push({
      id: 'ipad-t1',
      pointId: p2!,
      userId,
      fromStatus: 'pending',
      toStatus: 'in_progress',
      createdAt: now,
    });
    p.rooms[0]!.name = 'Katta mehmonxona';
    p.rooms[0]!.updatedAt = now;
  });
  phone.edit(projectId, (p, now) => {
    p.address = 'Toshkent, Chilonzor 5';
    Object.assign(pt(p, p2!), { status: 'completed', statusChangedAt: now, updatedAt: now });
    p.installLog.push({
      id: 'phone-t1',
      pointId: p2!,
      userId,
      fromStatus: 'pending',
      toStatus: 'completed',
      createdAt: now,
    });
    Object.assign(pt(p, p3!), { deletedAt: now, updatedAt: now });
    p.points.push(newPoint('phone-new-point', roomId, now));
    Object.assign(pt(p, p1!), { color: '#16a34a', updatedAt: now });
  });

  // ---- back online: the phone first, then the iPad (which gets a 409 and merges) ----
  await phone.sync();
  const ipadReport = await ipad.sync();
  expect(ipadReport.merged).toBeGreaterThanOrEqual(1);
  await phone.sync(); // picks up the merged version

  for (const dev of [ipad, phone]) {
    const p = dev.get(projectId);
    expect(p.name).toBe('Chilonzor, 5-uy'); // iPad
    expect(p.address).toBe('Toshkent, Chilonzor 5'); // phone
    expect(p.rooms[0]!.name).toBe('Katta mehmonxona'); // iPad
    expect(pt(p, p1!)).toMatchObject({ mountHeightCm: 110, description: 'TV ostida', color: '#16a34a' }); // both
    expect(pt(p, p2!).status).toBe('completed'); // never backwards
    expect(pt(p, p3!).deletedAt).not.toBeNull(); // phone deletion
    expect(pt(p, 'phone-new-point').description).toBe('telefonda qo‘shildi');
    expect(p.installLog.map((t) => t.id).sort()).toEqual(['ipad-t1', 'phone-t1']);
    expect(ProjectSchema.safeParse(p).success).toBe(true);
    expect(dev.outbox).toEqual([]); // everything reached the server
  }
  const a = noRev(ipad.get(projectId));
  const b = noRev(phone.get(projectId));
  expect(a).toEqual(b); // both devices hold the same project
  expect(live(ipad.get(projectId).points)).toHaveLength(demo.points.length); // +1 new, -1 deleted
  return { ipad, phone };
}

describe('sync: two devices edit offline, reconnect, nothing lost (in-memory server)', () => {
  it('iPad + phone scenario', async () => {
    const server = memServer();
    const { ipad } = await offlineScenario(server.as('u1'), server.as('u1'), 'u1', 'proj-mem-1');
    const stored = server.stored.get('proj-mem-1')!;
    const s = noRev(stored);
    const l = noRev(ipad.get('proj-mem-1'));
    expect(s).toEqual(l);
  });

  it('a project of another account on the device is never pushed; deleted-before-sync is never sent', async () => {
    const server = memServer();
    const dev = new MemDevice('ipad', 'u1', server.as('u1'));
    dev.create({ ...buildDemoProject(), id: 'foreign', ownerId: 'u2' });
    dev.create({ ...buildDemoProject(), id: 'gone', ownerId: null, deletedAt: tick() });
    expect(await dev.sync()).toMatchObject({ pushed: 0 });
    expect(server.stored.size).toBe(0);
  });

  it('a device that was offline for a long time and edited nothing just downloads', async () => {
    const server = memServer();
    const a = new MemDevice('a', 'u1', server.as('u1'));
    const b = new MemDevice('b', 'u1', server.as('u1'));
    a.create({ ...buildDemoProject(), id: 'p', ownerId: null });
    await a.sync();
    await b.sync();
    for (let i = 0; i < 3; i++) {
      a.edit('p', (p) => (p.name = `v${i}`));
      await a.sync();
    }
    expect(await b.sync()).toMatchObject({ pulled: 1, merged: 0, pushed: 0 });
    expect(b.get('p').name).toBe('v2');
  });
});

describe.skipIf(!available())('sync: two devices against the real PHP API + MySQL', () => {
  let api: PhpApi;
  beforeAll(async () => {
    api = await startApi();
  }, 60_000);
  afterAll(async () => api && (await api.stop()));

  it('iPad + phone edit the same project offline, reconnect: server and both devices hold every change', async () => {
    const ipadHttp = new Device(api.url);
    const reg = await ipadHttp.call('POST', '/auth/register', {
      name: 'Usta',
      login: '+998 93 000 11 22',
      password: 'maxfiy-parol',
    });
    const userId = (reg.body.user as { id: string }).id;
    const phoneHttp = new Device(api.url);
    expect(
      (await phoneHttp.call('POST', '/auth/login', { login: '930001122', password: 'maxfiy-parol' })).status,
    ).toBe(200);
    const id = '0190bbbb-0000-7000-8000-000000000001';
    const { ipad } = await offlineScenario(phpServerApi(ipadHttp), phpServerApi(phoneHttp), userId, id);
    // what MySQL holds is exactly what the devices hold
    const pulled = new Device(api.url);
    await pulled.call('POST', '/auth/login', { login: '930001122', password: 'maxfiy-parol' });
    const server = (await pulled.call('POST', '/pull', { have: {} })).body.projects as Project[];
    const s = noRev(server[0]!);
    const l = noRev(ipad.get(id));
    expect(s).toEqual(l);
    expect(
      Number(api.sql(`SELECT COUNT(*) FROM project_history WHERE project_id='${id}' AND kind='conflict'`)),
    ).toBeGreaterThan(0);
  }, 60_000);
});
