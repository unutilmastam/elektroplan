import { describe, expect, it } from 'vitest';
import type { User } from '@/domain/auth';
import { createEmptyProject } from '@/domain/project';
import { canAddProjects, countedProjects, formatSum, isPro, proDaysLeft } from '@/domain/plan';

const NOW = new Date('2026-11-04T12:00:00.000Z');
const user = (patch: Partial<User> = {}): User => ({
  id: 'u1',
  name: 'Usta',
  phone: '+998901234567',
  email: null,
  role: 'electrician',
  proUntil: null,
  isPro: false,
  mustChangePassword: false,
  ...patch,
});
const proj = (id: string, ownerId: string | null = null, deleted = false) => ({
  ...createEmptyProject(id, id, '2026-11-01T00:00:00.000Z'),
  ownerId,
  deletedAt: deleted ? '2026-11-02T00:00:00.000Z' : null,
});

describe('plan: free vs Pro', () => {
  it('Pro until a future date; expired = free; admin always Pro; no account = free', () => {
    expect(isPro(user({ proUntil: '2026-12-04T12:00:00.000Z' }), NOW)).toBe(true);
    expect(isPro(user({ proUntil: '2026-11-04T11:59:59.000Z' }), NOW)).toBe(false);
    expect(isPro(user({ role: 'admin' }), NOW)).toBe(true);
    expect(isPro(null, NOW)).toBe(false);
  });

  it('free plan: one project; deleted and other accounts’ projects do not count', () => {
    const u = user();
    expect(canAddProjects([], u, 1, NOW)).toBe(true);
    expect(canAddProjects([proj('a', 'u1')], u, 1, NOW)).toBe(false);
    expect(canAddProjects([proj('a', null, true), proj('b', 'other')], u, 1, NOW)).toBe(true);
    expect(countedProjects([proj('a', 'u1'), proj('b', null), proj('c', 'other')], u)).toBe(2);
    // without an account every local project counts
    expect(canAddProjects([proj('a')], null, 1, NOW)).toBe(false);
    // restoring 2 projects from a backup on an empty device
    expect(canAddProjects([], u, 2, NOW)).toBe(false);
  });

  it('Pro: unlimited', () => {
    const many = Array.from({ length: 30 }, (_, i) => proj(`p${i}`, 'u1'));
    expect(canAddProjects(many, user({ proUntil: '2027-01-01T00:00:00.000Z' }), 5, NOW)).toBe(true);
  });

  it('days left and price formatting', () => {
    expect(proDaysLeft(user({ proUntil: '2026-11-14T12:00:00.000Z' }), NOW)).toBe(10);
    expect(proDaysLeft(user({ proUntil: '2026-11-01T00:00:00.000Z' }), NOW)).toBe(0);
    expect(proDaysLeft(user({ role: 'admin' }), NOW)).toBe(0);
    expect(formatSum(99000)).toBe('99 000');
  });
});
