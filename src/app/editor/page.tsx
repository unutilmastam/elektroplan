import { AppShell } from '@/components/layout/AppShell';
import { Workspace } from '@/features/dashboard/Workspace';

/** Chizma (/editor?id=…). Phase 1 shows the same workspace; per-project loading arrives in Phase 2. */
export default function EditorPage() {
  return (
    <AppShell>
      <Workspace />
    </AppShell>
  );
}
