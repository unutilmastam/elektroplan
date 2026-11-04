import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (desktop: boolean) => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_DESKTOP', desktop ? '1' : '');
  vi.stubEnv('NEXT_PUBLIC_API_BASE', desktop ? 'https://eplan.itcode.uz/api' : '');
  return import('@/infra/desktop/desktop');
};
const T = 'a'.repeat(64);

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('Windows app session token', () => {
  it('web build: relative API, no token is ever stored or sent', async () => {
    const d = await load(false);
    expect(d.IS_DESKTOP).toBe(false);
    expect(d.API_BASE).toBe('/api');
    d.setDesktopToken(T);
    expect(localStorage.length).toBe(0);
    expect(d.desktopHeaders()).toEqual({});
  });

  it('desktop build: absolute API, token kept and sent, cleared on logout', async () => {
    const d = await load(true);
    expect(d.API_BASE).toBe('https://eplan.itcode.uz/api');
    expect(d.desktopHeaders()).toEqual({ 'X-Elektroplan-Client': 'desktop' });
    d.setDesktopToken(T);
    expect(d.desktopHeaders()).toEqual({ 'X-Elektroplan-Client': 'desktop', 'X-Elektroplan-Auth': T });
    d.setDesktopToken('not-a-token');
    expect(d.desktopToken()).toBeNull();
    localStorage.setItem('elektroplan:token', 'junk');
    expect(d.desktopToken()).toBeNull();
  });

  it('login stores the token from the answer; logout drops it', async () => {
    await load(true);
    const user = { id: 'u1', name: 'Usta', phone: null, email: 'a@b.uz', role: 'electrician' };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user, token: T }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { api } = await import('@/infra/api/client');
    expect((await api.login('a@b.uz', 'parol1234')).name).toBe('Usta');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://eplan.itcode.uz/api/auth/login');
    expect(init.credentials).toBe('omit');
    expect(localStorage.getItem('elektroplan:token')).toBe(T);
    await api.logout();
    expect((fetchMock.mock.calls[1]![1] as RequestInit).headers).toMatchObject({ 'X-Elektroplan-Auth': T });
    expect(localStorage.getItem('elektroplan:token')).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe('Windows app external links', () => {
  it('new-window links navigate (the native side opens the browser); web build leaves them alone', async () => {
    const make = () => {
      const a = document.createElement('a');
      a.href = 'https://t.me/elektroplan';
      a.target = '_blank';
      document.body.append(a);
      return a;
    };
    const web = await load(false);
    const offWeb = web.routeExternalLinks();
    const a1 = make();
    const e1 = new MouseEvent('click', { bubbles: true, cancelable: true });
    a1.dispatchEvent(e1);
    expect(e1.defaultPrevented).toBe(false);
    offWeb();

    const d = await load(true);
    const loc = { origin: 'http://tauri.localhost', href: 'http://tauri.localhost/pro/' };
    const fakeDoc = Object.assign(document.createDocumentFragment(), { location: loc }) as unknown as Document;
    const off = d.routeExternalLinks(fakeDoc);
    const a2 = make();
    fakeDoc.append(a2);
    const e2 = new MouseEvent('click', { bubbles: true, cancelable: true });
    a2.dispatchEvent(e2);
    expect(e2.defaultPrevented).toBe(true);
    expect(loc.href).toBe('https://t.me/elektroplan');
    off();
  });
});
