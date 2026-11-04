'use client';

import { KeyRound } from 'lucide-react';
import { uz } from '@/i18n/uz';
import { useAuthStore } from '@/store/authStore';
import { ChangePasswordForm } from './ChangePasswordForm';

/** After an admin password reset the master must choose their own password before working on (full screen). */
export function PasswordGate() {
  const must = useAuthStore((s) => s.user?.mustChangePassword === true);
  if (!must) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={uz.password.forcedTitle}
      data-testid="password-gate"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg/95 p-4"
      style={{ paddingTop: 'calc(var(--safe-top) + 16px)', paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
    >
      <div className="glass flex w-full max-w-[440px] flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <KeyRound size={28} className="text-primary-hi" aria-hidden />
          <h1 className="text-[20px] font-semibold">{uz.password.forcedTitle}</h1>
        </div>
        <p className="text-[15px] text-text-muted">{uz.password.forcedText}</p>
        <ChangePasswordForm temporary />
      </div>
    </div>
  );
}
