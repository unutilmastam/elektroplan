'use client';

import { AlertTriangle, CloudCheck, CloudUpload, Loader2, WifiOff, type LucideIcon } from 'lucide-react';
import { Hint } from '@/components/common/Hint';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { usePwaStore } from '@/store/pwaStore';
import { useSyncStore } from '@/store/syncStore';

const TONES = {
  warn: 'border-warning/45 bg-warning/12 text-[#fcd27b]',
  info: 'border-primary/45 bg-primary/12 text-primary-hi',
  ok: 'border-success/40 bg-success/10 text-[#86efac]',
  bad: 'border-danger/45 bg-danger/12 text-[#ff8a8a]',
} as const;

function Pill({
  testId,
  state,
  icon: Icon,
  label,
  hint,
  tone,
  spin,
  className,
}: {
  testId: string;
  state: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  tone: keyof typeof TONES;
  spin?: boolean;
  className?: string;
}) {
  return (
    <Hint label={hint}>
      <span
        role="status"
        data-testid={testId}
        data-state={state}
        className={cn(
          'inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium',
          TONES[tone],
          className,
        )}
      >
        <Icon size={15} className={spin ? 'animate-spin' : undefined} aria-hidden />
        {/* phones: icon only, so the project name keeps its room */}
        <span className="sr-only sm:not-sr-only">{label}</span>
      </span>
    </Hint>
  );
}

/**
 * Header connection state (ARCHITECTURE §4.6.6): Oflayn · Sinxronlanmoqda · Sinxronlandi · Sinxronlanmadi.
 * Without an account only "Oflayn" is shown (nothing is synced).
 */
export function OfflineBadge({ className }: { className?: string }) {
  const online = usePwaStore((s) => s.online);
  const signedIn = useAuthStore((s) => s.user !== null);
  const sync = useSyncStore((s) => s.state);
  const last = useSyncStore((s) => s.lastSyncAt);
  if (!online)
    return (
      <Pill
        testId="offline-badge"
        state="offline"
        icon={WifiOff}
        label={uz.pwa.offline}
        hint={uz.pwa.offlineHint}
        tone="warn"
        className={className}
      />
    );
  if (!signedIn || sync === 'idle') return null;
  if (sync === 'syncing')
    return (
      <Pill
        testId="sync-badge"
        state="syncing"
        icon={Loader2}
        spin
        label={uz.sync.syncing}
        hint={uz.sync.syncing}
        tone="info"
        className={className}
      />
    );
  if (sync === 'error')
    return (
      <Pill
        testId="sync-badge"
        state="error"
        icon={AlertTriangle}
        label={uz.sync.error}
        hint={uz.sync.errorHint}
        tone="bad"
        className={className}
      />
    );
  return (
    <Pill
      testId="sync-badge"
      state="synced"
      icon={CloudCheck}
      label={uz.sync.synced}
      hint={last ? uz.sync.lastSync.replace('{time}', formatDateTime(last)) : uz.sync.synced}
      tone="ok"
      className={className}
    />
  );
}

/** Small cloud mark: this project has changes that are only on this device (outbox not empty). */
export function UnsentBadge({ projectId, className }: { projectId: string; className?: string }) {
  const n = usePwaStore((s) => s.unsent[projectId] ?? 0);
  const signedIn = useAuthStore((s) => s.user !== null);
  if (n === 0) return null;
  return (
    <Hint label={signedIn ? uz.pwa.unsentHint : uz.pwa.unsentAnonHint}>
      <span
        data-testid="unsent-badge"
        aria-label={uz.pwa.unsent}
        className={cn('inline-flex shrink-0 items-center gap-1 text-[13px] text-text-muted', className)}
      >
        <CloudUpload size={16} aria-hidden className="text-primary-hi" />
        <span className="sr-only">{uz.pwa.unsent}</span>
      </span>
    </Hint>
  );
}
