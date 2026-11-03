import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Workspace } from '@/features/dashboard/Workspace';

/** Bosh sahifa — dashboard workspace (reference layout). */
export default function HomePage() {
  return (
    <AppShell>
      <Suspense>
        <Workspace mode="home" />
      </Suspense>
    </AppShell>
  );
}
