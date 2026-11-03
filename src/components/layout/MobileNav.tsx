'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, isNavActive } from './navigation';

/** Phone (<600px) bottom navigation. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={uz.nav.menu}
      className="grid shrink-0 grid-cols-6 border-t border-white/[0.08] bg-bg-elevated/95 backdrop-blur sm:hidden"
      style={{
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
      }}
    >
      {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? 'page' : undefined}
            aria-label={uz.nav[key]}
            className={cn(
              'flex h-[58px] flex-col items-center justify-center gap-1 text-[10.5px]',
              active ? 'text-primary-hi' : 'text-text-muted',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-11 items-center justify-center rounded-full',
                active && 'bg-primary/20',
              )}
            >
              <Icon size={21} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="leading-none">{uz.navShort[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
