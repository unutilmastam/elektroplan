'use client';

import { ChevronRight, UserRound } from 'lucide-react';
import Link from 'next/link';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { uz } from '@/i18n/uz';
import { useAuthStore } from '@/store/authStore';

/** Settings entry to the account page (phones have no sidebar). */
export function AccountRow() {
  const user = useAuthStore((s) => s.user);
  return (
    <GlassPanel className="flex flex-col gap-1 p-2">
      <h2 className="px-3 pt-2 pb-1 text-[13px] font-medium tracking-wide text-text-dim uppercase">
        {uz.auth.title}
      </h2>
      <Link
        href="/login/"
        className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-white/[0.04]"
        data-testid="settings-account"
      >
        <UserRound size={24} className="shrink-0 text-primary-hi" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-medium">{user ? user.name : uz.auth.login}</div>
          <p className="mt-1 text-[14px] text-text-muted">
            {user ? (user.phone ?? user.email) : uz.sync.anonHint}
          </p>
        </div>
        <ChevronRight size={20} className="text-text-muted" aria-hidden />
      </Link>
    </GlassPanel>
  );
}
