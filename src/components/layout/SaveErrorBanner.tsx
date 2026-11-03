'use client';

import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';

/** Shown when writing to IndexedDB failed (e.g. storage full / private mode). */
export function SaveErrorBanner() {
  const failed = useProjectStore((s) => s.saveError);
  if (!failed) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-[calc(76px+var(--safe-bottom))] z-40 rounded-xl border border-danger/50 bg-[#2a1014]/95 px-4 py-3 text-[14px] text-[#ffb4b4] sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm"
    >
      {uz.projects.saveError}
    </div>
  );
}
