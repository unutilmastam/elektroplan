'use client';

import { Crown, Folder, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NextPhase } from '@/components/common/Hint';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';

export function StatsCard() {
  const count = useProjectStore((s) => s.projectCount);
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

export function ProCard() {
  return (
    <div className="glass rounded-[14px] px-4 pt-4 pb-4">
      <div className="flex items-center gap-2.5">
        <Crown size={26} className="text-pro-gold" fill="currentColor" strokeWidth={1.4} aria-hidden />
        <span className="text-[16px] font-medium text-text">{uz.sidebar.proTitle}</span>
      </div>
      <div className="mt-2.5 text-[16px] text-pro-gold">{uz.sidebar.proText}</div>
      <NextPhase className="mt-3 flex w-full">
        <Button variant="gold" size="md" disabled className="w-full">
          {uz.sidebar.upgrade}
        </Button>
      </NextPhase>
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

export function UserCard() {
  return (
    <div className="flex items-center gap-3 px-1">
      <UserAvatar />
      <div className="min-w-0">
        <div className="truncate text-[16px] font-medium">{uz.sidebar.userName}</div>
        <div className="truncate text-[13px] text-text-muted">{uz.sidebar.userRole}</div>
      </div>
    </div>
  );
}
