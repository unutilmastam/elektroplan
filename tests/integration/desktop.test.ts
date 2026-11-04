// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { available, startApi, type PhpApi } from './helpers/phpApi';

/** PHASE 17: the Windows app (Tauri, origin http://tauri.localhost) talks to the API cross-origin with a token. */
const ok = available();
let api: PhpApi;
const ORIGIN = 'http://tauri.localhost';

async function call(
  method: string,
  path: string,
  { body, token, headers = {} }: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
) {
  const r = await fetch(`${api.url}${path}`, {
    method,
    headers: {
      Origin: ORIGIN,
      'X-Elektroplan-Client': 'desktop',
      ...(method === 'POST' ? { 'Content-Type': 'application/json', 'X-Elektroplan': '1' } : {}),
      ...(token ? { 'X-Elektroplan-Auth': token } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  return { status: r.status, headers: r.headers, body: (text ? JSON.parse(text) : null) as Record<string, unknown> };
}

describe.skipIf(!ok)('Windows app: CORS + token sessions', () => {
  beforeAll(async () => {
    api = await startApi();
  }, 60_000);
  afterAll(async () => api && (await api.stop()));

  it('preflight is allowed only for the app origin', async () => {
    const pre = await fetch(`${api.url}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-elektroplan,x-elektroplan-auth',
      },
    });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(pre.headers.get('access-control-allow-headers')).toMatch(/X-Elektroplan-Auth/);
    const evil = await fetch(`${api.url}/auth/me`, { headers: { Origin: 'https://evil.example' } });
    expect(evil.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('register/login return a token; the header authenticates; logout revokes it', async () => {
    const reg = await call('POST', '/auth/register', {
      body: { name: 'Usta', login: 'win@test.uz', password: 'maxfiy-parol' },
    });
    expect(reg.status).toBe(201);
    expect(reg.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const token = reg.body.token as string;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect((await call('GET', '/auth/me', { token })).body.user).toMatchObject({ email: 'win@test.uz' });
    expect((await call('GET', '/auth/me')).status).toBe(401);
    expect((await call('GET', '/auth/me', { token: 'f'.repeat(64) })).status).toBe(401);

    const login = await call('POST', '/auth/login', { body: { login: 'win@test.uz', password: 'maxfiy-parol' } });
    const second = login.body.token as string;
    expect(second).toMatch(/^[a-f0-9]{64}$/);
    expect(second).not.toBe(token);
    const pull = await call('POST', '/pull', { body: { have: {} }, token: second });
    expect(pull.status).toBe(200);

    await call('POST', '/auth/logout', { body: {}, token: second });
    expect((await call('GET', '/auth/me', { token: second })).status).toBe(401);
    expect((await call('GET', '/auth/me', { token })).status).toBe(200);
  });

  it('the web client (no desktop header) never sees the token in JSON', async () => {
    const r = await call('POST', '/auth/login', {
      body: { login: 'win@test.uz', password: 'maxfiy-parol' },
      headers: { 'X-Elektroplan-Client': 'web' },
    });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeUndefined();
  });

  it('a state change without X-Elektroplan is still refused', async () => {
    const r = await call('POST', '/auth/login', {
      body: { login: 'win@test.uz', password: 'maxfiy-parol' },
      headers: { 'X-Elektroplan': '' },
    });
    expect(r.status).toBe(403);
  });
});
