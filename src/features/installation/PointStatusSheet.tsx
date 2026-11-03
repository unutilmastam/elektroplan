'use client';

import { ChevronRight, PanelTop, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ElectricalPoint, Project } from '@/domain/types';
import { setPointStatus } from '@/features/editor/actions';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { StatusButtons } from './StatusButtons';

interface Props {
  project: Project;
  point: ElectricalPoint;
  onNext: () => void;
  onWall: () => void;
  onClose: () => void;
}

/** Selected point in Montaj rejimi: what / where, big status buttons, "Keyingi", wall view. */
export function PointStatusSheet({ project, point, onNext, onWall, onClose }: Props) {
  const room = project.rooms.find((r) => r.id === point.roomId);
  const facts = [
    room?.name,
    point.wallId === null ? uz.install.ceiling : null,
    point.mountHeightCm !== null ? `${uz.install.height} ${point.mountHeightCm} ${uz.point.cm}` : null,
    point.wallId !== null && point.distanceFromCornerCm !== null
      ? `${uz.install.fromCorner} ${point.distanceFromCornerCm} ${uz.point.cm}`
      : null,
  ].filter(Boolean);
  return (
    <section
      aria-label={uz.install.setStatus}
      className="flex flex-col gap-2.5 lg:gap-3"
      data-testid="status-sheet"
    >
      <div className="flex items-center gap-3">
        <SymbolIcon id={point.symbolId} size={44} color={point.color} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold">{uz.symbols[point.symbolId]}</div>
          <div className="truncate text-[13.5px] text-text-muted">{facts.join(' · ')}</div>
          {point.description ? (
            <div className="truncate text-[13.5px] text-text">{point.description}</div>
          ) : null}
        </div>
        <Button
          size="icon"
          onClick={onClose}
          aria-label={uz.install.close}
          title={uz.install.close}
          className="lg:hidden"
        >
          <X size={20} aria-hidden />
        </Button>
        {point.wallId !== null ? (
          <Button size="icon" onClick={onWall} aria-label={uz.install.openWall} title={uz.install.openWall}>
            <PanelTop size={20} aria-hidden />
          </Button>
        ) : null}
      </div>
      {point.description ? (
        <p className="rounded-lg bg-white/[0.05] px-3 py-2 text-[14px]">{point.description}</p>
      ) : null}
      <StatusButtons value={point.status} onChange={(s) => setPointStatus(point.id, s)} />
      <Button
        variant="primary"
        className="h-[52px] text-[16px] lg:h-14"
        onClick={onNext}
        aria-label={uz.install.nextOpen}
      >
        {uz.install.next}
        <ChevronRight size={20} aria-hidden />
      </Button>
    </section>
  );
}
