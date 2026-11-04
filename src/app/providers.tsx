'use client';

import { useEffect, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PwaBootstrap } from '@/features/offline-library/PwaBootstrap';
import { SyncBootstrap } from '@/features/offline-library/SyncBootstrap';
import { useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUiStore } from '@/store/uiStore';
import { uz } from '@/i18n/uz';

/** Loads local projects from IndexedDB once per app start (no network). */
function StoreBootstrap() {
  const init = useProjectStore((s) => s.init);
  useEffect(() => {
    void init();
    void useSettingsStore.getState().load();
    // Write pending plan edits when the app goes to background / is closed (iPad home gesture, tab close).
    const flush = () => void useProjectStore.getState().flush(true);
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [init]);
  const recovered = useProjectStore((s) => s.recoveredCount);
  useEffect(() => {
    if (recovered > 0) useUiStore.getState().notify(uz.generic.recovered.replace('{n}', String(recovered)));
  }, [recovered]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={100}>
      <StoreBootstrap />
      <PwaBootstrap />
      <SyncBootstrap />
      {children}
    </TooltipProvider>
  );
}
