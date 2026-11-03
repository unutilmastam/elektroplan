'use client';

import { GlassPanel } from '@/components/layout/GlassPanel';
import { PlanCanvas } from '@/features/editor/canvas/PlanCanvas';
import { SymbolBar } from '@/features/editor/toolbar/SymbolBar';
import { ProgressCard } from '@/features/installation/ProgressCard';
import { PropertiesPanel } from '@/features/editor/panels/PropertiesPanel';
import { ProjectHeader } from '@/features/projects/ProjectHeader';
import { RoomList } from '@/features/rooms/RoomList';
import { WallViewPanel } from '@/features/wall-view/WallViewPanel';
import { useCurrentProject, useProjectStore } from '@/store/projectStore';
import { NoProjectState } from './NoProjectState';
import { CompactPanels, PointSlideOver } from './CompactPanels';
import { useWorkspaceProject, type WorkspaceMode } from './useWorkspaceProject';

/**
 * Main workspace (reference layout).
 * ≥1024: header / symbols / [canvas | point panel] / [rooms | wall view | status].
 * 600–1023: point panel = slide-over, bottom row = tabs. <600: bottom sheet with tabs.
 */
export function Workspace({ mode }: { mode: WorkspaceMode }) {
  const { notFound } = useWorkspaceProject(mode);
  const project = useCurrentProject();
  const status = useProjectStore((s) => s.status);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:gap-2.5 sm:p-2.5 md:grid md:grid-cols-[minmax(0,1fr)_268px] md:grid-rows-[auto_auto_minmax(0,1fr)_212px] md:gap-x-2.5 md:gap-y-2.5 lg:grid-cols-[minmax(0,1fr)_272px] lg:grid-rows-[auto_auto_minmax(0,1fr)_248px] lg:gap-x-3.5 lg:gap-y-3.5 lg:p-3.5">
      <div className="md:col-span-2">
        <ProjectHeader />
      </div>
      <div className="md:col-span-2">
        <SymbolBar />
      </div>
      <div className="relative min-h-0 flex-1">
        <PlanCanvas
          project={project}
          overlay={project ? undefined : <NoProjectState notFound={notFound} status={status} />}
        />
        <PointSlideOver />
      </div>
      <GlassPanel as="aside" className="hidden min-h-0 md:block">
        <PropertiesPanel />
      </GlassPanel>
      <div className="hidden min-h-0 gap-2.5 md:grid md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-3.5">
        <GlassPanel className="min-h-0">
          <RoomList />
        </GlassPanel>
        <GlassPanel className="min-h-0">
          <WallViewPanel />
        </GlassPanel>
      </div>
      <GlassPanel className="hidden min-h-0 md:block">
        <ProgressCard />
      </GlassPanel>
      <CompactPanels />
    </div>
  );
}
