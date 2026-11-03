'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProCard, StatsCard, UserAvatar, UserCard } from '@/features/dashboard/SidebarCards';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { NAV_ITEMS, isNavActive } from './navigation';

/**
 * Left sidebar. ≥1280: full 230px (reference). 600–1279: 72px icon rail. <600: hidden (MobileNav instead).
 */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden h-full w-[72px] shrink-0 flex-col border-r border-white/[0.06] bg-bg-elevated/80 sm:flex lg:w-[230px]"
      style={{ paddingLeft: 'var(--safe-left)' }}
    >
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-2 lg:px-3.5">
        <Link href="/" className="pt-5 pb-5 lg:pt-6 lg:pb-8" aria-label={uz.app.name}>
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <span className="hidden lg:block">
            <Logo />
          </span>
        </Link>
        <nav aria-label={uz.nav.menu} className="flex flex-col gap-[6px] lg:gap-[5px]">
          {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={key}
                href={href}
                title={uz.nav[key]}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-[56px] items-center justify-center gap-3.5 rounded-[12px] text-[17px] transition-colors duration-150 lg:h-[58px] lg:justify-start lg:px-4',
                  active ? 'nav-active text-white' : 'text-text hover:bg-white/[0.05]',
                )}
              >
                <Icon
                  size={26}
                  strokeWidth={1.8}
                  className={active ? 'text-white' : 'text-[#aab6cc]'}
                  aria-hidden
                />
                <span className="sr-only lg:not-sr-only">{uz.nav[key]}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden flex-col gap-5 pt-6 pb-4 lg:flex">
          <StatsCard />
          <ProCard />
        </div>
      </div>
      <div
        className="flex justify-center border-t border-white/[0.07] px-3 py-4 lg:block lg:px-4 lg:py-5"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
      >
        <span className="lg:hidden">
          <UserAvatar size={42} />
        </span>
        <span className="hidden lg:block">
          <UserCard />
        </span>
      </div>
    </aside>
  );
}
