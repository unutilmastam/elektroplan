import { Cable, Drill, FolderOpen, House, Package, PencilRuler, Settings, type LucideIcon } from 'lucide-react';
import { uz } from '@/i18n/uz';

export type NavKey = keyof typeof uz.nav & keyof typeof uz.navShort;

export interface NavItem {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  /** shown in the phone bottom bar (6 places) */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/', icon: House },
  { key: 'projects', href: '/projects/', icon: FolderOpen },
  { key: 'editor', href: '/editor/', icon: PencilRuler },
  { key: 'install', href: '/install/', icon: Drill },
  { key: 'materials', href: '/materials/', icon: Package, mobile: false },
  { key: 'wiring', href: '/wiring/', icon: Cable },
  { key: 'settings', href: '/settings/', icon: Settings },
];

/** Active when the pathname matches the item (trailingSlash-insensitive). */
export function isNavActive(pathname: string, href: string): boolean {
  const norm = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  return href === '/' ? norm(pathname) === '/' : norm(pathname).startsWith(href);
}
