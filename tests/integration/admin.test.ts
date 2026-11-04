// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildDemoProject } from '@/features/dashboard/demoProject';
import type { Project } from '@/domain/types';
import { available, Device, startApi, type PhpApi } from './helpers/phpApi';

/** PHASE 14: admin panel API, Pro plan (activated by the admin), password reset, free-plan limit. */
let api: PhpApi;
const PASS = 'maxfiy-parol';

describe.skipIf(!available())('admin + Pro (PHP API + MySQL)', () => {
  beforeAll(async () => {
    api = await startApi();
  }, 60_000);
  afterAll(async () => api && (await api.stop()));

  const account = async (login: string, name = 'Usta') => {
    const d = new Device(api.url);
    const r = await d.call('POST', '/auth/register', { name, login, password: PASS });
    expect(r.status).toBe(201);
    return { d, user: r.body.user as { id: string; role: string; isPro: boolean; proUntil: string | null } };
  };
  const project = (n: number): Project => ({
    ...buildDemoProject(),
    id: `0190cccc-0000-7000-8000-${String(n).padStart(12, '0')}`,
    ownerId: null,
  });

  it('the ADMIN_LOGIN account is admin and always Pro; others are electricians on the free plan', async () => {
    const admin = await account('Admin@Test.uz', 'Bosh admin');
    expect(admin.user).toMatchObject({ role: 'admin', isPro: true });
    const usta = await account('+998 90 700 00 01');
    expect(usta.user).toMatchObject({
      role: 'electrician',
      isPro: false,
      proUntil: null,
      mustChangePassword: false,
    });
  });

  it('only the admin can open the admin API', async () => {
    const usta = await account('+998 90 700 00 02');
    expect((await usta.d.call('GET', '/admin/users')).status).toBe(403);
    expect((await new Device(api.url).call('GET', '/admin/users')).status).toBe(401);
    const r = await usta.d.call('POST', `/admin/users/${usta.user.id}/pro`, { months: 12 });
    expect(r.status).toBe(403);
  });

  it('free plan: one project syncs, the second is refused with pro_required; Pro lifts the limit', async () => {
    const admin = new Device(api.url);
    await admin.call('POST', '/auth/login', { login: 'admin@test.uz', password: PASS });
    const usta = await account('+998 90 700 00 03');
    expect((await usta.d.call('POST', '/sync', { project: project(1), baseRevision: 0 })).status).toBe(200);
    const second = await usta.d.call('POST', '/sync', { project: project(2), baseRevision: 0 });
    expect(second.status).toBe(402);
    expect(second.body.error).toBe('pro_required');
    // the first project keeps syncing
    expect(
      (await usta.d.call('POST', '/sync', { project: { ...project(1), name: 'v2' }, baseRevision: 1 }))
        .status,
    ).toBe(200);

    const on = await admin.call('POST', `/admin/users/${usta.user.id}/pro`, { months: 1 });
    expect(on.status).toBe(200);
    const until1 = (on.body.user as { proUntil: string }).proUntil;
    expect(new Date(until1).getTime() - Date.now()).toBeGreaterThan(27 * 86400_000);
    expect((await usta.d.call('GET', '/auth/me')).body.user).toMatchObject({ isPro: true });
    expect((await usta.d.call('POST', '/sync', { project: project(2), baseRevision: 0 })).status).toBe(200);

    // extending adds to the current end; cancelling ends it
    const more = await admin.call('POST', `/admin/users/${usta.user.id}/pro`, { months: 2 });
    expect(new Date((more.body.user as { proUntil: string }).proUntil).getTime()).toBeGreaterThan(
      new Date(until1).getTime() + 55 * 86400_000,
    );
    expect((await admin.call('POST', `/admin/users/${usta.user.id}/pro`, { months: 0 })).status).toBe(422);
    const off = await admin.call('POST', `/admin/users/${usta.user.id}/pro`, { cancel: true });
    expect(off.body.user).toMatchObject({ isPro: false, proUntil: null });
    expect(
      api.sql(`SELECT action FROM admin_actions WHERE user_id='${usta.user.id}' ORDER BY created_at`),
    ).toBe('pro_extend\npro_extend\npro_cancel\n');
  });

  it('masters list: search, counts of projects / points / done, last login', async () => {
    const admin = new Device(api.url);
    await admin.call('POST', '/auth/login', { login: 'admin@test.uz', password: PASS });
    const usta = await account('+998 90 700 00 04', 'Jasur usta');
    const p = project(4);
    p.points[0]!.status = 'completed';
    await usta.d.call('POST', '/sync', { project: p, baseRevision: 0 });
    const r = await admin.call('GET', '/admin/users?q=Jasur');
    const list = r.body.users as Array<Record<string, unknown>>;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      name: 'Jasur usta',
      phone: '+998907000004',
      projects: 1,
      points: p.points.length,
      done: p.points.filter((x) => x.status === 'completed' && x.deletedAt === null).length,
      isPro: false,
    });
    expect(list[0]!.lastLoginAt).toBeTruthy();
    expect(((await admin.call('GET', '/admin/users')).body.users as unknown[]).length).toBeGreaterThanOrEqual(
      5,
    );
  });

  it('password reset: temporary password works once, all old sessions end, the master must set a new one', async () => {
    const admin = new Device(api.url);
    await admin.call('POST', '/auth/login', { login: 'admin@test.uz', password: PASS });
    const usta = await account('+998 90 700 00 05');
    const reset = await admin.call('POST', `/admin/users/${usta.user.id}/reset-password`);
    const temp = reset.body.password as string;
    expect(temp).toMatch(/^[a-z2-9]{3}-[a-z2-9]{3}-[a-z2-9]{3}$/);
    expect((await usta.d.call('GET', '/auth/me')).status).toBe(401); // signed out
    const phone = new Device(api.url);
    expect((await phone.call('POST', '/auth/login', { login: '907000005', password: PASS })).status).toBe(
      401,
    );
    const login = await phone.call('POST', '/auth/login', { login: '907000005', password: temp });
    expect(login.body.user).toMatchObject({ mustChangePassword: true });
    const bad = await phone.call('POST', '/auth/password', {
      current: 'wrong-one',
      password: 'yangi-parol-1',
    });
    expect(bad.status).toBe(422);
    const ok = await phone.call('POST', '/auth/password', { current: temp, password: 'yangi-parol-1' });
    expect(ok.body.user).toMatchObject({ mustChangePassword: false });
    expect((await phone.call('GET', '/auth/me')).status).toBe(200); // this session stays
    expect(
      (
        await new Device(api.url).call('POST', '/auth/login', {
          login: '907000005',
          password: 'yangi-parol-1',
        })
      ).status,
    ).toBe(200);
    expect(api.sql(`SELECT action FROM admin_actions WHERE user_id='${usta.user.id}'`).trim()).toBe(
      'reset_password',
    );
  });
});
