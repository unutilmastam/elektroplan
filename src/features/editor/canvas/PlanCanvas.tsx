'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect } from 'react';
import { boundsOf, fitViewport, zoomAt } from '@/domain/geometry';
import type { Project } from '@/domain/types';
import { pointOnWall } from '@/domain/walls';
import { DrawingToolbar } from '@/features/editor/toolbar/DrawingToolbar';
import { uz } from '@/i18n/uz';
import { useElementSize } from '@/lib/useElementSize';
import { useEditorStore } from '@/store/editorStore';

const PlanStage = dynamic(() => import('./PlanStage'), { ssr: false });

const DEFAULT_VIEW = { x: 0, y: 0, scale: 1 };

/** Walls plus door-leaf tips, so swinging doors are not clipped when fitting. */
function planBounds(project: Project) {
  const walls = project.walls.filter((w) => w.deletedAt === null);
  const doorTips = project.openings.flatMap((o) => {
    const w = walls.find((x) => x.id === o.wallId);
    return w && o.kind === 'door' ? [pointOnWall(w, o.t, o.swing, o.width)] : [];
  });
  return boundsOf([...walls.flatMap((w) => [w.a, w.b]), ...doorTips]);
}

/** Canvas area: grid + plan (Konva) with the floating drawing toolbar on the left. */
export function PlanCanvas({ project }: { project: Project | null }) {
  const [hostRef, size] = useElementSize<HTMLDivElement>();
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);
  const fitRequest = useEditorStore((s) => s.fitRequest);

  const fit = useCallback(() => {
    if (!project || size.width === 0) return;
    const b = planBounds(project);
    const toolbarSpace = size.width < 600 ? 52 : size.width < 1000 ? 64 : 80;
    const pad = Math.max(16, Math.min(size.width, size.height) * 0.05);
    if (!b) return setViewport({ ...DEFAULT_VIEW, x: size.width / 2, y: size.height / 2 });
    const v = fitViewport(b, size.width - toolbarSpace, size.height, pad);
    setViewport({ ...v, x: v.x + toolbarSpace });
  }, [project, size.width, size.height, setViewport]);

  useEffect(() => {
    fit();
  }, [fit, fitRequest]);

  const zoom = (factor: number) => {
    const v = viewport ?? DEFAULT_VIEW;
    setViewport(zoomAt(v, factor, { x: size.width / 2, y: size.height / 2 }));
  };

  const empty = !project || project.rooms.length === 0;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-[14px] border border-white/[0.07] bg-canvas/80 lg:rounded-[16px]">
      <div ref={hostRef} className="canvas-host absolute inset-0" aria-label={uz.canvas.label} role="img">
        {project && viewport && size.width > 0 ? (
          <PlanStage project={project} width={size.width} height={size.height} viewport={viewport} />
        ) : null}
      </div>
      {empty ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-16 text-center">
          <div className="text-[17px] font-medium text-text">{uz.canvas.emptyTitle}</div>
          <div className="text-[14px] text-text-muted">{uz.canvas.emptyHint}</div>
        </div>
      ) : null}
      <div className="absolute top-2 left-2 md:top-2.5 md:left-2.5 lg:top-4 lg:left-2">
        <DrawingToolbar onZoom={zoom} />
      </div>
    </div>
  );
}
