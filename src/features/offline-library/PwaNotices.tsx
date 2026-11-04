'use client';

import { RefreshCw, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shouldShowIosHint } from '@/domain/platform';
import { uz } from '@/i18n/uz';
import { activateUpdate } from '@/infra/pwa/registerSw';
import { useProjectStore } from '@/store/projectStore';
import { usePwaStore } from '@/store/pwaStore';

const BOX =
  'glass fixed inset-x-3 bottom-[calc(76px+var(--safe-bottom))] z-40 flex items-start gap-3 px-4 py-3 sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-[400px]';

/** "Yangi versiya tayyor · Yangilash": pending edits are saved, then the new version takes over. */
function UpdateNotice() {
  const waiting = usePwaStore((s) => s.waiting);
  const setWaiting = usePwaStore((s) => s.setWaiting);
  if (!waiting) return null;
  const update = async () => {
    await useProjectStore.getState().flush(true);
    activateUpdate(waiting);
  };
  return (
    <div
      role="status"
      data-testid="update-notice"
      className={BOX}
      style={{ background: 'rgba(14,22,40,0.97)' }}
    >
      <RefreshCw size={22} className="mt-1 shrink-0 text-primary-hi" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">{uz.pwa.updateReady}</p>
        <div className="mt-2.5 flex gap-2">
          <Button variant="primary" size="sm" onClick={() => void update()}>
            {uz.pwa.update}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWaiting(null)}>
            {uz.pwa.later}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** One-time iPhone/iPad hint: Home Screen apps keep their data (Safari may clear unused sites). */
function IosInstallHint() {
  const show = usePwaStore((s) =>
    s.iosHintDismissed === null ? false : shouldShowIosHint(s.platform, s.standalone, s.iosHintDismissed),
  );
  const dismiss = usePwaStore((s) => s.dismissIosHint);
  const waiting = usePwaStore((s) => s.waiting !== null);
  if (!show || waiting) return null;
  return (
    <div
      role="dialog"
      aria-label={uz.pwa.iosHintTitle}
      data-testid="ios-install-hint"
      className={BOX}
      style={{ background: 'rgba(14,22,40,0.97)' }}
    >
      <Share size={22} className="mt-1 shrink-0 text-primary-hi" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{uz.pwa.iosHintTitle}</p>
        <p className="mt-1 text-[13.5px] text-text-muted">{uz.pwa.iosHintText}</p>
        <p className="mt-1.5 text-[14px] font-medium">{uz.pwa.iosHintSteps}</p>
        <Button variant="primary" size="sm" className="mt-2.5" onClick={() => void dismiss()}>
          {uz.pwa.iosHintClose}
        </Button>
      </div>
      <button
        type="button"
        aria-label={uz.generic.close}
        onClick={() => void dismiss()}
        className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-white/[0.06]"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}

export function PwaNotices() {
  return (
    <>
      <UpdateNotice />
      <IosInstallHint />
    </>
  );
}
