import { describe, expect, it } from 'vitest';
import { isNavActive, NAV_ITEMS } from '@/components/layout/navigation';

describe('navigation', () => {
  it('has the 6 reference sections plus Elektr sxemalar (PHASE 21); the phone bar keeps 6', () => {
    expect(NAV_ITEMS.map((n) => n.key)).toEqual([
      'dashboard',
      'projects',
      'editor',
      'install',
      'materials',
      'wiring',
      'settings',
    ]);
    expect(NAV_ITEMS.filter((n) => n.mobile !== false)).toHaveLength(6);
  });
  it('matches routes with or without trailing slash', () => {
    expect(isNavActive('/', '/')).toBe(true);
    expect(isNavActive('/projects', '/')).toBe(false);
    expect(isNavActive('/projects', '/projects/')).toBe(true);
    expect(isNavActive('/editor/', '/projects/')).toBe(false);
  });
});
