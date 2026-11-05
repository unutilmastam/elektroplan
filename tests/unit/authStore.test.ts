import { describe, expect, it, vi } from 'vitest';
import type { User } from '@/domain/auth';

const me = vi.fn();
vi.mock('@/infra/api', () => ({ api: { me: () => me() } }));
vi.mock('@/infra/idb/projectRepo', () => ({
  getMeta: vi.fn(async () => null),
  setMeta: vi.fn(async () => undefined),
}));
vi.mock('@/infra/idb/syncRepo', () => ({ clearSynced: vi.fn(async () => undefined) }));

const user = (mustChangePassword: boolean): User => ({
  id: 'u1',
  name: 'Usta',
  phone: '+998901112233',
  email: null,
  role: 'electrician',
  proUntil: null,
  isPro: false,
  mustChangePassword,
});

describe('authStore', () => {
  it('a background me() that started before a password change does not bring the gate back', async () => {
    const { useAuthStore } = await import('@/store/authStore');
    let answer!: (u: User) => void;
    me.mockReturnValueOnce(new Promise<User>((r) => (answer = r)));
    const loading = useAuthStore.getState().load();
    await new Promise((r) => setTimeout(r, 0));
    await useAuthStore.getState().setUser(user(false)); // the password was just changed
    answer(user(true)); // the old answer arrives late
    await loading;
    expect(useAuthStore.getState().user?.mustChangePassword).toBe(false);
  });

  it('a fresh me() still updates the account', async () => {
    const { useAuthStore } = await import('@/store/authStore');
    me.mockResolvedValueOnce({ ...user(false), isPro: true });
    await useAuthStore.getState().load();
    expect(useAuthStore.getState().user?.isPro).toBe(true);
  });
});
