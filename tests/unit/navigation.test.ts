import { describe, expect, it } from 'vitest';
import { isNavActive, NAV_ITEMS } from '@/components/layout/navigation';

describe('navigation', () => {
  it('has the 6 reference sections', () => {
    expect(NAV_ITEMS.map((n) => n.key)).toEqual([
      'dashboard',
      'projects',
      'editor',
      'install',
      'materials',
      'settings',
    ]);
  });
  it('matches routes with or without trailing slash', () => {
    expect(isNavActive('/', '/')).toBe(true);
    expect(isNavActive('/projects', '/')).toBe(false);
    expect(isNavActive('/projects', '/projects/')).toBe(true);
    expect(isNavActive('/editor/', '/projects/')).toBe(false);
  });
});
