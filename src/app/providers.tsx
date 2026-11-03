'use client';

import { useEffect, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useProjectStore } from '@/store/projectStore';

/** Loads local projects from IndexedDB once per app start (no network). */
function StoreBootstrap() {
  const init = useProjectStore((s) => s.init);
  useEffect(() => {
    void init();
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
