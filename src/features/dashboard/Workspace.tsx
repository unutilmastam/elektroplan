'use client';

import { GlassPanel } from '@/components/layout/GlassPanel';
import { PlanCanvas } from '@/features/editor/canvas/PlanCanvas';
import { SymbolBar } from '@/features/editor/toolbar/SymbolBar';
import { ProgressCard } from '@/features/installation/ProgressCard';
import { PropertiesPanel } from '@/features/editor/panels/PropertiesPanel';
import { ProjectHeader } from '@/features/projects/ProjectHeader';
import { RoomList } from '@/features/rooms/RoomList';
import { WallViewPanel } from '@/features/wall-view/WallViewPanel';
import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { useCurrentProject, useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { BottomPanelsGrip, ExpandPlanButton } from './LayoutControls';
import { Room3DButton } from '@/features/room3d/Room3DButton';
import { NoProjectState } from './NoProjectState';
import { CompactPanels, PointSlideOver } from './CompactPanels';
import { useWorkspaceProject, type WorkspaceMode } from './useWorkspaceProject';

/** Bottom row height on laptop-height screens (≤ 860 px tall). */
const LOW_BOTTOM = 168;

/**
 * Main workspace (reference layout).
 * ≥1024: header / symbols / [canvas | point panel] / [rooms | wall view | status].
 * 600–1023: point panel = slide-over, bottom row = tabs. <600: bottom sheet with tabs.
 */
export function Workspace({ mode }: { mode: WorkspaceMode }) {
  const { notFound } = useWorkspaceProject(mode);
  const project = useCurrentProject();
  const status = useProjectStore((s) => s.status);
  const expanded = useUiStore((s) => s.planExpanded);
  const bottom = useUiStore((s) => s.layout.bottomHeight);
  const loadLayout = useUiStore((s) => s.loadLayout);
  const setExpanded = useUiStore((s) => s.setPlanExpanded);
  const [wide, setWide] = useState(false); // ≥1280: taller default bottom row
  const [low, setLow] = useState(false); // laptop-height screens: a lower bottom row leaves room for the plan
  useEffect(() => {
    loadLayout();
    const mq = window.matchMedia('(min-width: 1280px)');
    const mh = window.matchMedia('(max-height: 860px)');
    const on = () => {
      setWide(mq.matches);
      setLow(mh.matches);
    };
    on();
    mq.addEventListener('change', on);
    mh.addEventListener('change', on);
    const esc = (e: KeyboardEvent) =>
      e.key === 'Escape' && useUiStore.getState().planExpanded && setExpanded(false);
    window.addEventListener('keydown', esc);
    return () => {
      mq.removeEventListener('change', on);
      mh.removeEventListener('change', on);
      window.removeEventListener('keydown', esc);
      setExpanded(false);
    };
  }, [loadLayout, setExpanded]);
  const folded = expanded || bottom === 0;
  // PHASE 19: ≥1024 grid rows follow the bottom-panel height (folded = no bottom row at all)
  const rows: CSSProperties | undefined = folded
    ? { gridTemplateRows: 'auto auto minmax(0,1fr)' }
    : bottom > 0
      ? { gridTemplateRows: `auto auto minmax(0,1fr) ${bottom}px` }
      : low
        ? { gridTemplateRows: `auto auto minmax(0,1fr) ${LOW_BOTTOM}px` }
        : undefined;
  return (
    <div
      style={rows}
      data-plan-expanded={expanded || undefined}
      className="flex min-h-0 flex-1 flex-col gap-2 p-2 short:overflow-y-auto sm:gap-2.5 sm:p-2.5 md:grid md:grid-cols-[minmax(0,1fr)_268px] md:grid-rows-[auto_auto_minmax(0,1fr)_212px] md:gap-x-2.5 md:gap-y-2.5 lg:grid-cols-[minmax(0,1fr)_272px] lg:grid-rows-[auto_auto_minmax(0,1fr)_248px] lg:gap-x-3.5 lg:gap-y-3.5 lg:p-3.5"
    >
      <div className="md:col-span-2">
        <ProjectHeader />
      </div>
      <div className="md:col-span-2">
        <SymbolBar />
      </div>
      <div
        className={cn(
          'relative min-h-0 flex-1 short:min-h-[82dvh]!',
          expanded && 'md:col-span-2 short:min-h-0!',
        )}
      >
        <PlanCanvas
          project={project}
          overlay={project ? undefined : <NoProjectState notFound={notFound} status={status} />}
        />
        <PointSlideOver />
        {project ? <ExpandPlanButton /> : null}
        <Room3DButton className={expanded ? 'right-14' : 'right-14 sm:right-28 md:right-14'} />
        {project && !expanded ? (
          <BottomPanelsGrip defaultHeight={low ? LOW_BOTTOM : wide ? 248 : 212} />
        ) : null}
      </div>
      <GlassPanel as="aside" className={cn('hidden min-h-0', !expanded && 'md:block')}>
        <PropertiesPanel />
      </GlassPanel>
      <div
        className={cn(
          'hidden min-h-0 gap-2.5 md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-3.5',
          !folded && 'md:grid',
        )}
      >
        <GlassPanel className="min-h-0">
          <RoomList />
        </GlassPanel>
        <GlassPanel className="min-h-0">
          <WallViewPanel />
        </GlassPanel>
      </div>
      <GlassPanel className={cn('hidden min-h-0', !folded && 'md:block')}>
        <ProgressCard />
      </GlassPanel>
      {expanded ? null : <CompactPanels />}
    </div>
  );
}
