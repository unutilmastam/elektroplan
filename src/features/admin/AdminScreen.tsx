'use client';

import { Search, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import type { AdminUser } from '@/domain/auth';
import { uz } from '@/i18n/uz';
import { api } from '@/infra/api';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { usePwaStore } from '@/store/pwaStore';
import { useUiStore } from '@/store/uiStore';
import { ConfirmDialog, TempPasswordDialog } from './AdminDialogs';
import { MasterCard, type MasterAction } from './MasterCard';

type Pending = { user: AdminUser; action: MasterAction } | null;

/** /admin: masters list with search, Pro +1/+3/+12 months or off, password reset. Online only. */
export function AdminScreen() {
  const me = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const online = usePwaStore((s) => s.online);
  const notify = useUiStore((s) => s.notify);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [temp, setTemp] = useState<{ name: string; password: string } | null>(null);
  const isAdmin = me?.role === 'admin';

  const load = useCallback(async (query: string) => {
    try {
      setUsers(await api.admin.users(query));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    if (!isAdmin || !online) return;
    const t = setTimeout(() => void load(q), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, isAdmin, online, load]);

  const run = async () => {
    if (!pending) return;
    const { user, action } = pending;
    setPending(null);
    setBusy(true);
    try {
      if (action.kind === 'reset') {
        setTemp({ name: user.name, password: await api.admin.resetPassword(user.id) });
      } else {
        const u = await api.admin.setPro(
          user.id,
          action.kind === 'pro' ? { months: action.months } : { cancel: true },
        );
        const status =
          u.isPro && u.proUntil ? uz.admin.proUntil.replace('{date}', formatDate(u.proUntil)) : uz.admin.free;
        notify(uz.admin.proSaved.replace('{name}', user.name).replace('{status}', status));
      }
      await load(q);
    } catch {
      notify(uz.admin.failed);
    } finally {
      setBusy(false);
    }
  };

  const confirmText = !pending
    ? null
    : pending.action.kind === 'reset'
      ? uz.admin.confirmReset.replace('{name}', pending.user.name)
      : pending.action.kind === 'cancel'
        ? uz.admin.confirmCancel.replace('{name}', pending.user.name)
        : uz.admin.confirmPro
            .replace('{name}', pending.user.name)
            .replace('{n}', String(pending.action.months));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-5 py-4">
        <ShieldCheck size={26} className="text-primary-hi" aria-hidden />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold lg:text-[26px]">{uz.admin.title}</h1>
          {users ? (
            <p className="tabular text-[14px] text-text-muted">
              {uz.admin.count.replace('{n}', String(users.length))}
            </p>
          ) : null}
        </div>
      </GlassPanel>
      {authStatus === 'unknown' ? null : !isAdmin ? (
        <p className="py-10 text-center text-text-muted">{uz.pages.notFoundText}</p>
      ) : !online ? (
        <p className="py-10 text-center text-[#fcd27b]">{uz.admin.offline}</p>
      ) : (
        <>
          <label className="glass flex h-12 shrink-0 items-center gap-2.5 rounded-[12px] px-3.5">
            <Search size={20} className="text-text-muted" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={uz.admin.search}
              aria-label={uz.admin.search}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-dim"
            />
          </label>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
            {error ? (
              <p role="alert" className="py-10 text-center text-[#ff7b7b]">
                {uz.admin.loadFailed}
              </p>
            ) : !users ? (
              <p className="py-10 text-center text-text-muted">{uz.admin.loading}</p>
            ) : users.length === 0 ? (
              <p className="py-10 text-center text-text-muted">{uz.admin.empty}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3.5">
                {users.map((u) => (
                  <MasterCard
                    key={u.id}
                    u={u}
                    busy={busy}
                    onAction={(action) => setPending({ user: u, action })}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      <ConfirmDialog text={confirmText} onNo={() => setPending(null)} onYes={() => void run()} />
      <TempPasswordDialog
        value={temp?.password ?? null}
        name={temp?.name ?? ''}
        onClose={() => setTemp(null)}
      />
    </div>
  );
}
