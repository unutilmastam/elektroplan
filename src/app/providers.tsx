'use client';

import { useEffect, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';

/** Loads local projects from IndexedDB once per app start (no network). */
function StoreBootstrap() {
  const init = useProjectStore((s) => s.init);
  useEffect(() => {
    void init();
    void useSettingsStore.getState().load();
    // Write pending plan edits when the app goes to background / is closed (iPad home gesture, tab close).
    const flush = () => void useProjectStore.getState().flush();
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [init]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={100}>
      <StoreBootstrap />
      {children}
    </TooltipProvider>
  );
}
