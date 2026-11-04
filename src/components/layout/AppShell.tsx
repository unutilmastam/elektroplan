import type { ReactNode } from 'react';
import { PwaNotices } from '@/features/offline-library/PwaNotices';
import { ProjectDialogs } from '@/features/projects/ProjectDialogs';
import { MobileNav } from './MobileNav';
import { NoticeToast } from './NoticeToast';
import { SaveErrorBanner } from './SaveErrorBanner';
import { Sidebar } from './Sidebar';

/** Fixed-viewport app frame: sidebar / rail + content + phone bottom nav. No page scroll. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden sm:flex-row">
      <Sidebar />
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        style={{ paddingTop: 'var(--safe-top)', paddingRight: 'var(--safe-right)' }}
      >
        {children}
      </main>
      <MobileNav />
      <ProjectDialogs />
      <SaveErrorBanner />
      <NoticeToast />
      <PwaNotices />
    </div>
  );
}
