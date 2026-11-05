// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildDemoProject } from '@/features/dashboard/demoProject';
import { ProjectSchema } from '@/domain/schemas';
import type { Project } from '@/domain/types';
import { available, Device, startApi, type PhpApi } from './helpers/phpApi';

const ok = available();
let api: PhpApi;

describe.skipIf(!ok)('PHP API + MySQL', () => {
  beforeAll(async () => {
    api = await startApi();
  }, 60_000);
  afterAll(async () => api && (await api.stop()));

  const register = async (login: string, name = 'Usta') => {
    const d = new Device(api.url);
    const r = await d.call('POST', '/auth/register', { name, login, password: 'maxfiy-parol' });
    expect(r.status).toBe(201);
    return { d, user: r.body.user as { id: string } };
  };

  it('register: phone normalised, httpOnly SameSite=Lax cookie, password stored as bcrypt', async () => {
    const d = new Device(api.url);
    const r = await d.call('POST', '/auth/register', {
      name: 'Aziz',
      login: '90 111 22 33',
      password: 'parol1234',
    });
    expect(r.status).toBe(201);
    expect(r.body.user).toMatchObject({ name: 'Aziz', phone: '+998901112233', email: null });
    expect(r.setCookie[0]).toMatch(/ep_session=[a-f0-9]{64}.*HttpOnly/i);
    expect(r.setCookie[0]).toMatch(/SameSite=Lax/i);
    expect(api.sql("SELECT password_hash FROM users WHERE phone='+998901112233'")).toMatch(/^\$2y\$/);
    expect((await d.call('GET', '/auth/me')).body.user).toMatchObject({ name: 'Aziz' });
    // the same login cannot register twice
    const again = await new Device(api.url).call('POST', '/auth/register', {
      name: 'X',
      login: '+998 90 111-22-33',
      password: 'parol1234',
    });
    expect(again.status).toBe(409);
  });

  it('validation errors, login by email, logout ends the session', async () => {
    const bad = await new Device(api.url).call('POST', '/auth/register', {
      name: '',
      login: 'abc',
      password: '1',
    });
    expect(bad.status).toBe(422);
    expect(bad.body.fields).toEqual({
      name: 'name_required',
      login: 'login_invalid',
      password: 'password_short',
    });
    await register('Usta@Example.uz');
    const d = new Device(api.url);
    expect(
      (await d.call('POST', '/auth/login', { login: 'usta@example.uz', password: 'nope-nope' })).status,
    ).toBe(401);
    expect(
      (await d.call('POST', '/auth/login', { login: 'usta@example.uz', password: 'maxfiy-parol' })).status,
    ).toBe(200);
    expect((await d.call('GET', '/auth/me')).status).toBe(200);
    await d.call('POST', '/auth/logout');
    expect((await d.call('GET', '/auth/me')).status).toBe(401);
  });

  it('rate limit: 10 wrong passwords for one login -> 429 with Retry-After', async () => {
    await register('rate@example.uz');
    const d = new Device(api.url);
    const codes: number[] = [];
    for (let i = 0; i < 11; i++)
      codes.push(
        (await d.call('POST', '/auth/login', { login: 'rate@example.uz', password: `wrong-${i}` })).status,
      );
    expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
    expect(codes[10]).toBe(429);
  });

  it('CSRF: a POST without the X-Elektroplan header is refused; non-JSON body refused', async () => {
    const r = await fetch(`${api.url}/api/auth/login`, { method: 'POST', body: 'login=a&password=b' });
    expect(r.status).toBe(403);
    const d = new Device(api.url);
    expect((await d.call('POST', '/auth/login', undefined, { 'Content-Type': 'text/plain' })).status).toBe(
      415,
    );
  });

  it('sync needs a session', async () => {
    const r = await new Device(api.url).call('POST', '/sync', {
      project: buildDemoProject(),
      baseRevision: 0,
    });
    expect(r.status).toBe(401);
  });

  it('push a whole project, read it back identical (all tables, order, numbers, Uzbek text, dates)', async () => {
    const { d, user } = await register('sync@example.uz');
    const p: Project = {
      ...buildDemoProject(),
      id: '0190aaaa-0000-7000-8000-000000000001',
      name: 'O‘g‘il xonadoni',
    };
    p.points[0]!.description = 'Ko‘cha tomondan, 3×2.5 kabel';
    p.points[0]!.mountHeightCm = 112.5;
    p.points[1]!.status = 'completed';
    p.points[1]!.statusChangedAt = '2026-11-04T09:15:30.123Z';
    p.installLog.push({
      id: 'task-1',
      pointId: p.points[1]!.id,
      userId: user.id,
      fromStatus: 'pending',
      toStatus: 'completed',
      createdAt: '2026-11-04T09:15:30.123Z',
    });
    p.openings.push({
      id: 'op-1',
      wallId: p.walls[0]!.id,
      kind: 'door',
      t: 0.3333333333333333,
      width: 90,
      swing: -1,
    });
    const push = await d.call('POST', '/sync', {
      project: p,
      baseRevision: 0,
      ops: [{ op: 'replace', path: [], value: 1 }],
    });
    expect(push.status).toBe(200);
    expect(push.body).toEqual({ revision: 1, ownerId: user.id });

    const pull = await d.call('POST', '/pull', { have: {} });
    const back = (pull.body.projects as Project[])[0]!;
    expect(ProjectSchema.safeParse(back).success).toBe(true);
    expect(back).toEqual({ ...p, ownerId: user.id, revision: 1 });
    // nothing new when the device already has revision 1
    expect((await d.call('POST', '/pull', { have: { [p.id]: 1 } })).body.projects).toEqual([]);
    expect(api.sql(`SELECT kind, revision FROM project_history WHERE project_id='${p.id}'`).trim()).toBe(
      'change\t1',
    );
  });

  it('stale revision -> 409 with the server version; nothing is written', async () => {
    const { d } = await register('conflict@example.uz');
    const p: Project = { ...buildDemoProject(), id: '0190aaaa-0000-7000-8000-000000000002' };
    await d.call('POST', '/sync', { project: p, baseRevision: 0 });
    await d.call('POST', '/sync', { project: { ...p, name: 'v2' }, baseRevision: 1 });
    const stale = await d.call('POST', '/sync', { project: { ...p, name: 'stale' }, baseRevision: 1 });
    expect(stale.status).toBe(409);
    expect(stale.body.error).toBe('conflict');
    expect((stale.body.project as Project).name).toBe('v2');
    expect((stale.body.project as Project).revision).toBe(2);
    // merged push with conflicts is logged
    const merged = await d.call('POST', '/sync', {
      project: { ...p, name: 'merged' },
      baseRevision: 2,
      conflicts: [{ entity: 'project', id: p.id, fields: ['name'] }],
    });
    expect(merged.body.revision).toBe(3);
    expect(
      api.sql(`SELECT kind FROM project_history WHERE project_id='${p.id}' AND revision=3 ORDER BY kind`),
    ).toBe('change\nconflict\n');
  });

  it("another user's project can be neither read nor overwritten", async () => {
    const a = await register('a@example.uz');
    const b = await register('b@example.uz');
    const p: Project = { ...buildDemoProject(), id: '0190aaaa-0000-7000-8000-000000000003' };
    expect((await a.d.call('POST', '/sync', { project: p, baseRevision: 0 })).status).toBe(200);
    expect((await b.d.call('POST', '/sync', { project: p, baseRevision: 1 })).status).toBe(403);
    expect((await b.d.call('POST', '/pull', { have: {} })).body.projects).toEqual([]);
  });

  it('rejects broken projects (422) instead of storing half of them', async () => {
    const { d } = await register('broken@example.uz');
    const p = { ...buildDemoProject(), id: '0190aaaa-0000-7000-8000-000000000004' };
    const bad = structuredClone(p);
    bad.points[0]!.roomId = 'no-such-room';
    const r = await d.call('POST', '/sync', { project: bad, baseRevision: 0 });
    expect(r.status).toBe(422);
    expect(r.body.message).toContain('points[0].roomId');
    expect(api.sql(`SELECT COUNT(*) FROM projects WHERE id='${p.id}'`).trim()).toBe('0');
  });

  it('migrate endpoint needs the token and is idempotent', async () => {
    const d = new Device(api.url);
    expect((await d.call('GET', '/migrate?token=wrong')).status).toBe(404);
    expect((await d.call('GET', '/migrate?token=test-token')).body).toEqual({ applied: [] });
    expect(api.sql('SELECT COUNT(*) FROM symbols WHERE is_system=1').trim()).toBe('12');
  });
});
