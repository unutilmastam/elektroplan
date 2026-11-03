'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, type ReactNode } from 'react';
import { boundsOf, fitViewport } from '@/domain/geometry';
import type { Project } from '@/domain/types';
import { pointOnWall } from '@/domain/walls';
import { DrawingToolbar, ViewToolbar } from '@/features/editor/toolbar/DrawingToolbar';
import { uz } from '@/i18n/uz';
import { useElementSize } from '@/lib/useElementSize';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { useCanvasInput } from '../hooks/useCanvasInput';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { CanvasContextMenu } from './CanvasContextMenu';
import { PlaceModeBar } from './PlaceModeBar';
import { PolygonActions } from './PolygonActions';

const PlanStage = dynamic(() => import('./PlanStage'), { ssr: false });

/** Walls plus door-leaf tips, so swinging doors are not clipped when fitting. */
function planBounds(project: Project) {
  const walls = project.walls.filter((w) => w.deletedAt === null);
  const doorTips = project.openings.flatMap((o) => {
    const w = walls.find((x) => x.id === o.wallId);
    return w && o.kind === 'door' ? [pointOnWall(w, o.t, o.swing, o.width)] : [];
  });
  return boundsOf([...walls.flatMap((w) => [w.a, w.b]), ...doorTips]);
}

function fitTo(width: number, height: number) {
  const project = selectCurrentProject(useProjectStore.getState());
  const set = useEditorStore.getState().setViewport;
  if (!project || width === 0) return;
  const b = planBounds(project);
  if (!b) return set({ x: width / 2, y: height / 2, scale: 1 });
  const toolbarSpace = width < 600 ? 52 : width < 1000 ? 64 : 80;
  const pad = Math.max(16, Math.min(width, height) * 0.05);
  const v = fitViewport(b, width - toolbarSpace, height, pad);
  set({ ...v, x: v.x + toolbarSpace });
}

/** Canvas area: grid + plan (Konva) with the floating drawing toolbar on the left. */
export function PlanCanvas({
  project,
  overlay,
  mode = 'edit',
}: {
  project: Project | null;
  overlay?: ReactNode;
  /** 'install': view + tap only, status rings, zoom toolbar */
  mode?: 'edit' | 'install';
}) {
  const install = mode === 'install';
  const pointFilter = useEditorStore((s) => s.pointFilter);
  const shown =
    project && install && pointFilter === 'open'
      ? { ...project, points: project.points.filter((p) => p.status !== 'completed') }
      : project;
  const [hostRef, size] = useElementSize<HTMLDivElement>();
  const viewport = useEditorStore((s) => s.viewport);
  const selection = useEditorStore((s) => s.selection);
  const marquee = useEditorStore((s) => s.marquee);
  const draft = useEditorStore((s) => s.draft);
  const hover = useEditorStore((s) => s.hover);
  const fitRequest = useEditorStore((s) => s.fitRequest);
  const spaceHeld = useKeyboardShortcuts(install);
  useCanvasInput(hostRef, spaceHeld, install);

  const projectId = project?.id ?? null;
  // Fit when a project opens or on request (not on every edit).
  useEffect(() => {
    fitTo(useEditorStore.getState().canvasSize.width, useEditorStore.getState().canvasSize.height);
  }, [projectId, fitRequest]);

  // Resize (rotation, Split View, Stage Manager): keep the view centre instead of re-fitting.
  const prev = useRef({ width: 0, height: 0 });
  const { width, height } = size;
  useEffect(() => {
    const ed = useEditorStore.getState();
    ed.setCanvasSize(width, height);
    const p = prev.current;
    if (p.width === width && p.height === height) return;
    prev.current = { width, height };
    if (width === 0) return;
    if (p.width === 0 || !ed.viewport) fitTo(width, height);
    else
      ed.setViewport({
        ...ed.viewport,
        x: ed.viewport.x + (width - p.width) / 2,
        y: ed.viewport.y + (height - p.height) / 2,
      });
  }, [width, height]);

  const empty = !project || project.rooms.filter((r) => r.deletedAt === null).length === 0;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-[14px] border border-white/[0.07] bg-canvas/80 lg:rounded-[16px]">
      <div
        ref={hostRef}
        className="canvas-host absolute inset-0"
        aria-label={uz.canvas.label}
        role="application"
        data-testid="plan-canvas"
        data-vx={viewport?.x.toFixed(2)}
        data-vy={viewport?.y.toFixed(2)}
        data-scale={viewport?.scale.toFixed(4)}
      >
        {project && viewport && size.width > 0 ? (
          <PlanStage
            project={shown!}
            showStatus={install}
            width={size.width}
            height={size.height}
            viewport={viewport}
            selection={selection}
            marquee={marquee}
            draft={draft}
            hover={hover}
          />
        ) : null}
      </div>
      {overlay ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-16 text-center">
          {overlay}
        </div>
      ) : empty && !draft ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-16 text-center">
          <div className="text-[17px] font-medium text-text">{uz.canvas.emptyTitle}</div>
          <div className="text-[14px] text-text-muted">{uz.canvas.emptyHint}</div>
        </div>
      ) : null}
      <div className="absolute top-2 left-2 md:top-2.5 md:left-2.5 lg:top-4 lg:left-2">
        {install ? <ViewToolbar /> : <DrawingToolbar />}
      </div>
      {install ? null : (
        <>
          <CanvasContextMenu />
          <PolygonActions />
          <PlaceModeBar />
        </>
      )}
    </div>
  );
}
