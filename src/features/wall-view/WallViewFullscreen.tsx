'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NumberField } from '@/components/common/NumberField';
import { sealEdit, updatePoint } from '@/features/editor/actions';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { WallElevationDrawing } from './WallElevation';
import { useWallView, WallSwitcher } from './WallViewPanel';

/** Full-screen wall view (phones / tablets): big elevation + the selected point's height and distance. */
export function WallViewFullscreen({ onClose }: { onClose: () => void }) {
  const { elevation, subtitle, step, canStep } = useWallView();
  const pointId = useEditorStore((s) => s.selectedPointId);
  const point = useProjectStore(
    (s) => selectCurrentProject(s)?.points.find((p) => p.id === pointId && p.deletedAt === null) ?? null,
  );

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={uz.wallView.title}
      className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur"
      style={{
        padding:
          'calc(8px + var(--safe-top)) calc(8px + var(--safe-right)) calc(8px + var(--safe-bottom)) calc(8px + var(--safe-left))',
      }}
    >
      <div className="glass flex shrink-0 items-center gap-1 px-3 py-2">
        <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold">
          {uz.wallView.title}
          {subtitle ? <span className="font-normal text-text-muted"> · {subtitle}</span> : null}
        </h2>
        <WallSwitcher step={step} canStep={canStep} />
        <button
          type="button"
          onClick={onClose}
          aria-label={uz.wallView.close}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:text-text"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="glass mt-2 flex min-h-0 flex-1 items-center justify-center p-2">
        {/* keep a wall-like proportion (wide, not tall) */}
        <div className="max-h-full w-full max-w-[1400px]" style={{ aspectRatio: '16 / 9' }}>
          {elevation ? (
            <WallElevationDrawing elevation={elevation} large />
          ) : (
            <p className="p-6 text-center text-text-muted">{uz.wallView.empty}</p>
          )}
        </div>
      </div>
      {point && point.wallId === elevation?.wall.id ? (
        <div className="glass mt-2 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5">
          <span className="flex items-center gap-2 text-[15px] font-medium">
            <SymbolIcon id={point.symbolId} size={28} color={point.color} />
            {uz.symbols[point.symbolId]}
          </span>
          <NumberField
            className="w-[260px]"
            label={uz.point.height}
            value={point.mountHeightCm}
            unit={uz.point.cm}
            max={1000}
            onChange={(v) => updatePoint(point.id, { mountHeightCm: v }, 'height')}
            onCommit={sealEdit}
          />
          <NumberField
            className="w-[260px]"
            label={uz.point.fromCorner}
            value={point.distanceFromCornerCm}
            unit={uz.point.cm}
            max={100000}
            onChange={(v) => updatePoint(point.id, { distanceFromCornerCm: v }, 'corner')}
            onCommit={sealEdit}
          />
        </div>
      ) : (
        <p className="mt-2 shrink-0 px-2 text-[13px] text-text-muted">{uz.wallView.dragHint}</p>
      )}
    </div>,
    document.body,
  );
}
