import { AppShell } from '@/components/layout/AppShell';
import { AccountScreen } from '@/features/auth/AccountScreen';

export default function LoginPage() {
  return (
    <AppShell>
      <AccountScreen />
    </AppShell>
  );
}
