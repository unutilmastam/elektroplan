'use client';

import { Crown, Folder, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import Link from 'next/link';
import { isPro } from '@/domain/plan';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

export function StatsCard() {
  const count = useProjectStore(
    (s) => s.demoProjectCount ?? s.projects.filter((p) => p.deletedAt === null).length,
  );
  return (
    <div className="glass flex items-center justify-between rounded-[14px] px-4 py-3.5">
      <div>
        <div className="text-[14px] text-text">{uz.sidebar.totalProjects}</div>
        <div className="tabular mt-1 text-[24px] leading-none font-semibold">{count}</div>
      </div>
      <Folder size={34} className="text-primary-hi" fill="currentColor" strokeWidth={1.4} aria-hidden />
    </div>
  );
}

/** Sidebar Pro card: plan status and the way to Pro (PHASE 14). */
export function ProCard() {
  const user = useAuthStore((st) => st.user);
  const pro = isPro(user);
  return (
    <div className="glass rounded-[14px] px-4 pt-4 pb-4">
      <div className="flex items-center gap-2.5">
        <Crown size={26} className="text-pro-gold" fill="currentColor" strokeWidth={1.4} aria-hidden />
        <span className="text-[16px] font-medium text-text">{uz.sidebar.proTitle}</span>
      </div>
      <div className="mt-2.5 text-[16px] text-pro-gold">
        {pro && user?.proUntil
          ? uz.pro.active.replace('{date}', formatDate(user.proUntil))
          : uz.sidebar.proText}
      </div>
      {pro ? null : (
        <Button asChild variant="gold" size="md" className="mt-3 w-full">
          <Link href="/pro/">{uz.sidebar.upgrade}</Link>
        </Button>
      )}
    </div>
  );
}

export function UserAvatar({ size = 50 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="flex h-full w-full items-end justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#c7d0de] to-[#8d99ad]">
        <UserRound
          size={size * 0.86}
          className="translate-y-[12%] text-[#2a3448]"
          fill="#2a3448"
          strokeWidth={1}
          aria-hidden
        />
      </div>
      <span
        className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a1120] bg-success"
        aria-label={uz.sidebar.online}
        role="img"
      />
    </div>
  );
}

/** Account at the bottom of the sidebar: the signed-in user, or "Mehmon · Kirish". Opens /login. */
export function UserCard() {
  const user = useAuthStore((st) => st.user);
  return (
    <Link
      href="/login/"
      data-testid="user-card"
      className="-mx-1 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.05]"
    >
      <UserAvatar />
      <div className="min-w-0">
        <div className="truncate text-[16px] font-medium">{user ? user.name : uz.auth.guest}</div>
        <div className="truncate text-[13px] text-text-muted">
          {user ? uz.sidebar.userRole : uz.auth.guestHint}
        </div>
      </div>
    </Link>
  );
}
