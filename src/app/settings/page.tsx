import { AppShell } from '@/components/layout/AppShell';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsScreen />
    </AppShell>
  );
}
