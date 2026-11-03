import { AppShell } from '@/components/layout/AppShell';
import { ProjectsScreen } from '@/features/projects/ProjectsScreen';

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsScreen />
    </AppShell>
  );
}
