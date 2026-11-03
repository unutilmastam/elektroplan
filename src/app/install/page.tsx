import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { InstallScreen } from '@/features/installation/InstallScreen';

/** Montaj rejimi (/install/?id=…) — works from IndexedDB only. */
export default function InstallPage() {
  return (
    <AppShell>
      <Suspense>
        <InstallScreen />
      </Suspense>
    </AppShell>
  );
}
