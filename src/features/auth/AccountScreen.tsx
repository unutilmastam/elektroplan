'use client';

import { LogOut, RefreshCw, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { OfflineBadge } from '@/features/offline-library/ConnectionBadge';
import { uz } from '@/i18n/uz';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { usePwaStore } from '@/store/pwaStore';
import { useSyncStore } from '@/store/syncStore';
import { useUiStore } from '@/store/uiStore';
import { AuthForm } from './AuthForm';

/** /login: sign in / create an account, or — when signed in — the account and its sync state. */
export function AccountScreen() {
  const router = useRouter();
  const { status, user } = useAuthStore();
  const sync = useSyncStore();
  const online = usePwaStore((s) => s.online);
  const notify = useUiStore((s) => s.notify);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-5 py-4">
        <h1 className="flex-1 text-[22px] font-semibold lg:text-[26px]">{uz.auth.title}</h1>
        <OfflineBadge />
      </GlassPanel>
      <GlassPanel className="mx-auto flex w-full max-w-[480px] flex-col gap-5 p-5 sm:p-6">
        {status === 'unknown' ? null : user ? (
          <>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <UserRound size={30} className="text-primary-hi" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[19px] font-semibold" data-testid="account-name">
                  {user.name}
                </div>
                <div className="truncate text-[15px] text-text-muted">{user.phone ?? user.email}</div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3">
              <div className="text-[15px] font-medium">{uz.sync.title}</div>
              <p className="mt-1 text-[14px] text-text-muted" data-testid="last-sync">
                {sync.lastSyncAt
                  ? uz.sync.lastSync.replace('{time}', formatDateTime(sync.lastSyncAt))
                  : uz.sync.never}
              </p>
              <Button
                className="mt-3"
                disabled={!online || sync.state === 'syncing'}
                onClick={() => void sync.run('manual')}
              >
                <RefreshCw
                  size={18}
                  className={sync.state === 'syncing' ? 'animate-spin' : undefined}
                  aria-hidden
                />
                {sync.state === 'syncing' ? uz.sync.syncing : uz.sync.now}
              </Button>
            </div>
            <div>
              <Button
                variant="danger"
                onClick={async () => {
                  await useAuthStore.getState().logout();
                  notify(uz.auth.signedOut);
                }}
              >
                <LogOut size={18} aria-hidden />
                {uz.auth.logout}
              </Button>
              <p className="mt-2 text-[13px] text-text-muted">{uz.auth.logoutHint}</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] text-text-muted">{uz.auth.intro}</p>
            <AuthForm
              onDone={(name) => {
                notify(uz.auth.signedIn.replace('{name}', name));
                router.push('/projects/');
              }}
            />
          </>
        )}
      </GlassPanel>
    </div>
  );
}
