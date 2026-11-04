'use client';

import { ArrowLeft, List, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ProgressRing } from '@/components/common/ProgressRing';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { OfflineBadge } from '@/features/offline-library/ConnectionBadge';
import { Button } from '@/components/ui/button';
import { nextOpenPoint, roomProgress, workOrder } from '@/domain/installation';
import { computeProgress } from '@/domain/progress';
import { NoProjectState } from '@/features/dashboard/NoProjectState';
import { useWorkspaceProject } from '@/features/dashboard/useWorkspaceProject';
import { focusPoint, focusRoom } from '@/features/editor/actions';
import { PlanCanvas } from '@/features/editor/canvas/PlanCanvas';
import { WallViewFullscreen } from '@/features/wall-view/WallViewFullscreen';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';
import { useCurrentProject, useProjectStore } from '@/store/projectStore';
import { PointList } from './PointList';
import { PointStatusSheet } from './PointStatusSheet';
import { RoomTabs } from './RoomTabs';

/**
 * Montaj rejimi (/install/?id=): phone first. Room navigator, "only open" filter, plan (view + tap) or list,
 * and a bottom sheet with big status buttons for the selected point. ≥1024: plan left, list + sheet right.
 */
export function InstallScreen() {
  const { notFound } = useWorkspaceProject('editor');
  const project = useCurrentProject();
  const status = useProjectStore((s) => s.status);
  const selectedId = useEditorStore((s) => s.selectedPointId);
  const filter = useEditorStore((s) => s.pointFilter);
  const setFilter = useEditorStore((s) => s.setPointFilter);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [view, setView] = useState<'plan' | 'list'>('plan');
  const [wallOpen, setWallOpen] = useState(false);

  const total = useMemo(() => computeProgress(project?.points ?? []), [project]);
  const rooms = useMemo(() => (project ? roomProgress(project) : []), [project]);
  const list = useMemo(
    () => (project ? workOrder(project, roomId, filter === 'open') : []),
    [project, roomId, filter],
  );
  const point = project?.points.find((p) => p.id === selectedId && p.deletedAt === null) ?? null;

  if (!project) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-[22px] font-semibold">{uz.install.title}</h1>
          <NoProjectState notFound={notFound} status={status} />
        </div>
      </div>
    );
  }

  const pickRoom = (id: string | null) => {
    setRoomId(id);
    if (id) focusRoom(id);
    else useEditorStore.getState().requestFit();
  };
  const next = () => {
    const n = nextOpenPoint(project, selectedId, roomId);
    if (n) focusPoint(n.id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 short:overflow-y-auto sm:gap-2.5 sm:p-2.5 md:grid md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_400px] md:grid-rows-[auto_auto_minmax(0,1fr)] md:gap-3.5 md:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-3 py-2.5 md:col-span-2 md:px-4">
        <Button asChild size="icon" aria-label={uz.install.back} title={uz.install.back}>
          <Link href={`/editor/?id=${encodeURIComponent(project.id)}`}>
            <ArrowLeft size={20} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-semibold md:text-[22px]">{project.name}</h1>
          <p className="tabular truncate text-[13px] text-text-muted md:text-[14px]">
            {uz.install.title} · {total.completed}
            {uz.install.of}
            {total.total} · {uz.status.remaining} {total.remaining}
          </p>
        </div>
        <OfflineBadge />
        <ProgressRing
          percent={total.percent}
          size={52}
          stroke={6}
          label={`${uz.status.title}: ${total.percent}%`}
        />
      </GlassPanel>

      <div className="flex shrink-0 flex-col gap-2 md:col-span-2 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <RoomTabs rooms={rooms} total={total} value={roomId} onChange={pickRoom} />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={filter === 'open'}
            onClick={() => setFilter(filter === 'open' ? 'all' : 'open')}
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-3.5 text-[14.5px] whitespace-nowrap md:flex-none',
              filter === 'open'
                ? 'border-warning/60 bg-warning/15 text-[#fde68a]'
                : 'border-white/10 bg-[#0d1527] text-text',
            )}
          >
            <span
              className={cn(
                'h-4 w-7 rounded-full p-0.5 transition-colors',
                filter === 'open' ? 'bg-warning' : 'bg-white/20',
              )}
            >
              <span
                className={cn(
                  'block h-3 w-3 rounded-full bg-white transition-transform',
                  filter === 'open' && 'translate-x-3',
                )}
              />
            </span>
            {uz.install.onlyOpen}
          </button>
          <div
            role="tablist"
            className="flex shrink-0 rounded-xl border border-white/10 bg-[#0d1527] p-1 md:hidden"
          >
            {(['plan', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                aria-label={v === 'plan' ? uz.install.plan : uz.install.list}
                onClick={() => setView(v)}
                className={cn(
                  'flex h-10 w-12 items-center justify-center rounded-lg',
                  view === v ? 'bg-primary text-white' : 'text-text-muted',
                )}
              >
                {v === 'plan' ? <MapIcon size={20} aria-hidden /> : <List size={20} aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'relative min-h-0 flex-1 short:min-h-[82dvh]! md:block',
          view === 'plan' ? 'block' : 'hidden',
        )}
        data-testid="install-plan"
      >
        <PlanCanvas project={project} mode="install" />
      </div>

      <div
        className="flex min-h-0 flex-col gap-2 md:gap-3.5"
        style={{ flex: view === 'list' ? '1 1 0%' : '0 0 auto' }}
      >
        <GlassPanel
          className={cn(
            'no-scrollbar min-h-0 overflow-y-auto p-2.5 md:block md:flex-1',
            view === 'list' ? 'block flex-1' : 'hidden',
          )}
        >
          <PointList
            project={project}
            points={list}
            selectedId={selectedId}
            onSelect={focusPoint}
            showRoom={roomId === null}
          />
        </GlassPanel>
        <GlassPanel className="shrink-0 p-3 md:p-4" style={{ paddingBottom: 'calc(12px)' }}>
          {point ? (
            <PointStatusSheet
              project={project}
              point={point}
              onNext={next}
              onWall={() => setWallOpen(true)}
              onClose={() => useEditorStore.getState().clearSelection()}
            />
          ) : total.ready ? (
            <p className="py-2 text-center text-[15px] font-medium text-success">
              {uz.install.allDone} — {uz.install.allDoneHint}
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-[14px] text-text-muted">{uz.install.tapPoint}</p>
              <Button variant="primary" className="h-12" onClick={next} aria-label={uz.install.nextOpen}>
                {uz.install.next}
              </Button>
            </div>
          )}
        </GlassPanel>
      </div>
      {wallOpen ? <WallViewFullscreen onClose={() => setWallOpen(false)} /> : null}
    </div>
  );
}
