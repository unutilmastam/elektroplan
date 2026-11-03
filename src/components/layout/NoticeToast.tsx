'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';

/** Short bottom message (auto-hides after 4 s). */
export function NoticeToast() {
  const notice = useUiStore((s) => s.notice);
  const clear = useUiStore((s) => s.clearNotice);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(clear, 4000);
    return () => window.clearTimeout(t);
  }, [notice, clear]);
  if (!notice) return null;
  return (
    <div
      role="status"
      key={notice.id}
      className="glass fixed inset-x-3 bottom-[calc(76px+var(--safe-bottom))] z-40 px-4 py-3 text-[14px] sm:right-auto sm:bottom-5 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
      style={{ background: 'rgba(14,22,40,0.96)' }}
    >
      {notice.text}
    </div>
  );
}
