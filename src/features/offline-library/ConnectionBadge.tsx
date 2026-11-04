'use client';

import { CloudUpload, WifiOff } from 'lucide-react';
import { Hint } from '@/components/common/Hint';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { usePwaStore } from '@/store/pwaStore';

/** "Oflayn" pill while there is no internet (ARCHITECTURE §4.6.6). */
export function OfflineBadge({ className }: { className?: string }) {
  const online = usePwaStore((s) => s.online);
  if (online) return null;
  return (
    <Hint label={uz.pwa.offlineHint}>
      <span
        role="status"
        data-testid="offline-badge"
        className={cn(
          'inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-warning/45 bg-warning/12 px-2.5 text-[13px] font-medium text-[#fcd27b]',
          className,
        )}
      >
        <WifiOff size={15} aria-hidden />
        {/* phones: icon only, so the project name keeps its room */}
        <span className="sr-only sm:not-sr-only">{uz.pwa.offline}</span>
      </span>
    </Hint>
  );
}

/** Small cloud mark: this project has changes that are only on this device (outbox not empty). */
export function UnsentBadge({ projectId, className }: { projectId: string; className?: string }) {
  const n = usePwaStore((s) => s.unsent[projectId] ?? 0);
  if (n === 0) return null;
  return (
    <Hint label={uz.pwa.unsentHint}>
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
