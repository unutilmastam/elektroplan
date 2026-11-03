'use client';

import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={100}>
      {children}
    </TooltipProvider>
  );
}
