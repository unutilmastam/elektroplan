import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Workspace } from '@/features/dashboard/Workspace';

/** Chizma (/editor?id=…). Opens the project from IndexedDB. */
export default function EditorPage() {
  return (
    <AppShell>
      <Suspense>
        <Workspace mode="editor" />
      </Suspense>
    </AppShell>
  );
}
