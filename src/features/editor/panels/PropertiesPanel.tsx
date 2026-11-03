'use client';

import { liveSelection } from '@/domain/selection';
import { PointPropertiesPanel } from '@/features/points/PointPropertiesPanel';
import { useEditorStore } from '@/store/editorStore';
import { useCurrentProject } from '@/store/projectStore';
import { RoomPanel } from './RoomPanel';
import { OpeningPanel, WallPanel } from './WallPanel';

/** Right panel: point → opening → single wall → room; otherwise the point panel's empty state. */
export function PropertiesPanel({
  className,
  showTitle = true,
}: {
  className?: string;
  showTitle?: boolean;
}) {
  const project = useCurrentProject();
  const selection = useEditorStore((s) => s.selection);
  const pointId = useEditorStore((s) => s.selectedPointId);
  const sel = project ? liveSelection(project, selection) : [];
  if (project && !pointId && sel.length === 1) {
    const r = sel[0]!;
    if (r.kind === 'opening') {
      const o = project.openings.find((x) => x.id === r.id)!;
      return <OpeningPanel opening={o} showTitle={showTitle} />;
    }
    if (r.kind === 'wall')
      return <WallPanel wall={project.walls.find((x) => x.id === r.id)!} showTitle={showTitle} />;
    if (r.kind === 'room')
      return <RoomPanel room={project.rooms.find((x) => x.id === r.id)!} showTitle={showTitle} />;
  }
  return <PointPropertiesPanel className={className} showTitle={showTitle} />;
}
