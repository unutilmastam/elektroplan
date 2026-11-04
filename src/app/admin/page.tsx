import { AppShell } from '@/components/layout/AppShell';
import { AdminScreen } from '@/features/admin/AdminScreen';

export default function AdminPage() {
  return (
    <AppShell>
      <AdminScreen />
    </AppShell>
  );
}
