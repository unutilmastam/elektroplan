import { create } from 'zustand';
import { UserSchema, type User } from '@/domain/auth';
import { api } from '@/infra/api';
import { getMeta, setMeta } from '@/infra/idb/projectRepo';
import { clearSynced } from '@/infra/idb/syncRepo';

/** Account state. The user is cached in IndexedDB so the app knows who is logged in while offline. */
export const META_ACCOUNT = 'account';

interface AuthState {
  status: 'unknown' | 'anon' | 'user';
  user: User | null;
  load: () => Promise<void>;
  login: (login: string, password: string) => Promise<User>;
  register: (name: string, login: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** the server said the session is gone (401) */
  expired: () => Promise<void>;
}

const parseUser = (v: unknown) => {
  const r = UserSchema.safeParse(v);
  return r.success ? r.data : null;
};

export const useAuthStore = create<AuthState>()((set, get) => {
  const signedIn = async (user: User) => {
    const prev = await getMeta(META_ACCOUNT, parseUser).catch(() => null);
    // agreed versions belong to one account: another account starts from scratch
    if (prev && prev.id !== user.id) await clearSynced().catch(() => undefined);
    await setMeta(META_ACCOUNT, user).catch(() => undefined);
    set({ status: 'user', user });
    return user;
  };
  const signedOut = async () => {
    set({ status: 'anon', user: null });
    await setMeta(META_ACCOUNT, null).catch(() => undefined);
  };
  return {
    status: 'unknown',
    user: null,
    load: async () => {
      const cached = await getMeta(META_ACCOUNT, parseUser).catch(() => null);
      set({ status: cached ? 'user' : 'anon', user: cached });
      try {
        const me = await api.me();
        if (me) await signedIn(me);
        else if (get().user) await signedOut();
      } catch {
        // offline, or the API is not reachable: keep the cached account
      }
    },
    login: async (login, password) => signedIn(await api.login(login, password)),
    register: async (name, login, password) => signedIn(await api.register(name, login, password)),
    logout: async () => {
      await api.logout().catch(() => undefined);
      await clearSynced().catch(() => undefined);
      await signedOut();
    },
    expired: signedOut,
  };
});
