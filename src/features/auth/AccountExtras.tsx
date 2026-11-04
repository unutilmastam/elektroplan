'use client';

import { ChevronRight, Crown, KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { isPro, proDaysLeft } from '@/domain/plan';
import { uz } from '@/i18n/uz';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { ChangePasswordForm } from './ChangePasswordForm';

const row =
  'flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3 hover:border-white/20';

/** Account page: plan (Pro / free), admin panel entry for the admin, own password change. */
export function AccountExtras() {
  const user = useAuthStore((s) => s.user);
  const [pwd, setPwd] = useState(false);
  if (!user) return null;
  const pro = isPro(user);
  const plan =
    user.role === 'admin'
      ? uz.pro.activeAdmin
      : pro && user.proUntil
        ? `${uz.pro.active.replace('{date}', formatDate(user.proUntil))} · ${uz.pro.daysLeft.replace('{n}', String(proDaysLeft(user)))}`
        : uz.pro.free;
  return (
    <div className="flex flex-col gap-2.5">
      <Link href="/pro/" className={row} data-testid="account-plan">
        <Crown
          size={22}
          className="shrink-0 text-pro-gold"
          fill={pro ? 'currentColor' : 'none'}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium">{uz.pro.title}</div>
          <div className={pro ? 'text-[14px] text-pro-gold' : 'text-[14px] text-text-muted'}>{plan}</div>
        </div>
        <ChevronRight size={18} className="text-text-muted" aria-hidden />
      </Link>
      {user.role === 'admin' ? (
        <Link href="/admin/" className={row} data-testid="account-admin">
          <ShieldCheck size={22} className="shrink-0 text-primary-hi" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-medium">{uz.admin.open}</div>
            <div className="text-[14px] text-text-muted">{uz.admin.openHint}</div>
          </div>
          <ChevronRight size={18} className="text-text-muted" aria-hidden />
        </Link>
      ) : null}
      <div className="rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3">
        <button
          type="button"
          aria-expanded={pwd}
          onClick={() => setPwd((x) => !x)}
          className="flex w-full items-center gap-3 text-left"
        >
          <KeyRound size={22} className="shrink-0 text-primary-hi" aria-hidden />
          <span className="flex-1 text-[15px] font-medium">{uz.password.show}</span>
          <ChevronRight
            size={18}
            className={pwd ? 'rotate-90 text-text-muted' : 'text-text-muted'}
            aria-hidden
          />
        </button>
        {pwd ? (
          <div className="mt-3">
            <ChangePasswordForm onDone={() => setPwd(false)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
