'use client';

import { Crown, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminUser } from '@/domain/auth';
import { uz } from '@/i18n/uz';
import { formatDate, formatDateTime } from '@/lib/format';

export type MasterAction = { kind: 'pro'; months: number } | { kind: 'cancel' } | { kind: 'reset' };

/** One master in the admin list: who, activity, Pro status and the admin actions. */
export function MasterCard({
  u,
  busy,
  onAction,
}: {
  u: AdminUser;
  busy: boolean;
  onAction: (a: MasterAction) => void;
}) {
  const percent = u.points ? Math.round((u.done / u.points) * 100) : 0;
  const status =
    u.role === 'admin'
      ? uz.admin.admin
      : u.isPro && u.proUntil
        ? uz.admin.proUntil.replace('{date}', formatDate(u.proUntil))
        : uz.admin.free;
  return (
    <li className="glass flex flex-col gap-3 p-4" data-testid="master-card">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold">{u.name}</div>
          <div className="truncate text-[15px] text-text-muted select-all">{u.phone ?? u.email}</div>
        </div>
        <span
          data-testid="master-plan"
          className={
            u.isPro
              ? 'inline-flex shrink-0 items-center gap-1 rounded-full border border-pro-gold/45 bg-pro-gold/12 px-2.5 py-1 text-[13px] font-medium text-pro-gold'
              : 'inline-flex shrink-0 items-center rounded-full border border-white/15 px-2.5 py-1 text-[13px] text-text-muted'
          }
        >
          {u.role === 'admin' ? (
            <ShieldCheck size={14} aria-hidden />
          ) : u.isPro ? (
            <Crown size={14} aria-hidden />
          ) : null}
          {status}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px] sm:grid-cols-4">
        <div>
          <dt className="text-text-dim">{uz.admin.registered}</dt>
          <dd className="tabular">{u.createdAt ? formatDate(u.createdAt) : uz.admin.never}</dd>
        </div>
        <div>
          <dt className="text-text-dim">{uz.admin.lastLogin}</dt>
          <dd className="tabular">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : uz.admin.never}</dd>
        </div>
        <div>
          <dt className="text-text-dim">{uz.admin.projects}</dt>
          <dd className="tabular">
            {u.projects} · {u.points} {uz.admin.points}
          </dd>
        </div>
        <div>
          <dt className="text-text-dim">{uz.admin.progress}</dt>
          <dd className="tabular">{percent}%</dd>
        </div>
      </dl>
      {u.role === 'admin' ? null : (
        <div className="flex flex-wrap gap-2">
          {[1, 3, 12].map((n) => (
            <Button
              key={n}
              size="sm"
              variant="gold"
              disabled={busy}
              onClick={() => onAction({ kind: 'pro', months: n })}
            >
              {uz.admin.addMonths.replace('{n}', String(n))}
            </Button>
          ))}
          {u.isPro ? (
            <Button size="sm" variant="danger" disabled={busy} onClick={() => onAction({ kind: 'cancel' })}>
              {uz.admin.cancelPro}
            </Button>
          ) : null}
          <Button size="sm" disabled={busy} onClick={() => onAction({ kind: 'reset' })}>
            <KeyRound size={16} aria-hidden />
            {uz.admin.resetPassword}
          </Button>
        </div>
      )}
    </li>
  );
}
