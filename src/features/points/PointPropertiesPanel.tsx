'use client';

import { Copy, Plug, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ColorSwatches, type Swatch } from '@/components/common/ColorSwatches';
import { NumberField } from '@/components/common/NumberField';
import { Button } from '@/components/ui/button';
import type { ElectricalPoint } from '@/domain/types';
import { deleteSelection, duplicateSelectedPoint, sealEdit, updatePoint } from '@/features/editor/actions';
import { SYMBOL_COLORS } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { PointTypeMenu } from './PointTypeMenu';
import { StatusPicker } from './StatusPicker';

const SWATCHES: Swatch[] = [
  { value: SYMBOL_COLORS.blue, label: uz.point.swatch.blue },
  { value: SYMBOL_COLORS.red, label: uz.point.swatch.red },
  { value: SYMBOL_COLORS.green, label: uz.point.swatch.green },
  { value: SYMBOL_COLORS.yellow, label: uz.point.swatch.yellow },
  { value: SYMBOL_COLORS.purple, label: uz.point.swatch.purple },
];

/** Description textarea: local text while typing, one undo step per editing session. */
function NoteField({ point }: { point: ElectricalPoint }) {
  const [text, setText] = useState(point.description);
  useEffect(() => setText(point.description), [point.id, point.description]);
  return (
    <label className="mt-2 block text-[15px] lg:mt-3">
      {uz.point.note}
      <textarea
        value={text}
        rows={2}
        maxLength={300}
        onChange={(e) => {
          setText(e.target.value);
          updatePoint(point.id, { description: e.target.value }, 'note');
        }}
        onBlur={sealEdit}
        className="mt-1.5 block h-10 w-full resize-none rounded-lg border border-white/12 bg-[#0a1222] px-3 py-2 text-base text-text outline-none focus:border-primary-hi/70 lg:h-[48px]"
      />
    </label>
  );
}

function removePoint(id: string) {
  const project = selectCurrentProject(useProjectStore.getState());
  if (project) useEditorStore.getState().select(project, [{ kind: 'point', id }]);
  deleteSelection();
}

/** "Tanlangan nuqta": every property is editable and undoable (Phase 6). */
export function PointPropertiesPanel({
  className,
  showTitle = true,
}: {
  className?: string;
  showTitle?: boolean;
}) {
  const selectedId = useEditorStore((s) => s.selectedPointId);
  const point = useProjectStore(
    (s) => selectCurrentProject(s)?.points.find((p) => p.id === selectedId && p.deletedAt === null) ?? null,
  );
  const onWall = point?.wallId !== null && point?.wallId !== undefined;

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {showTitle ? (
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-2.5 lg:px-5 lg:pt-4 lg:pb-4">
          <Plug
            size={24}
            className="shrink-0 rotate-180 text-primary-hi md:max-lg:hidden"
            fill="currentColor"
            aria-hidden
          />
          <h2 className="truncate text-[16px] font-semibold whitespace-nowrap lg:text-[17px]">
            {uz.point.panelTitle}
          </h2>
          {point ? (
            // iPad landscape: the panel is short, so the actions live in the title row
            <div className="ml-auto hidden gap-1 md:max-lg:flex">
              <button
                type="button"
                aria-label={uz.point.duplicate}
                title={uz.point.duplicate}
                onClick={() => duplicateSelectedPoint(point.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06] hover:text-text"
              >
                <Copy size={18} aria-hidden />
              </button>
              <button
                type="button"
                aria-label={uz.point.delete}
                title={uz.point.delete}
                onClick={() => removePoint(point.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#ff7b7b] hover:bg-danger/15"
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {point ? (
        <div
          className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-3.5 pb-3 lg:px-4"
          data-testid="point-panel"
        >
          <div className="border-b border-white/[0.08] py-2 lg:py-2.5">
            <PointTypeMenu point={point} />
          </div>
          <div className="flex flex-col gap-2 pt-2.5 lg:gap-2.5 lg:pt-3">
            <NumberField
              label={uz.point.height}
              value={point.mountHeightCm}
              unit={uz.point.cm}
              max={1000}
              onChange={(v) => updatePoint(point.id, { mountHeightCm: v }, 'height')}
              onCommit={sealEdit}
            />
            {onWall ? (
              <NumberField
                label={uz.point.fromCorner}
                value={point.distanceFromCornerCm}
                unit={uz.point.cm}
                max={100000}
                onChange={(v) => updatePoint(point.id, { distanceFromCornerCm: v }, 'corner')}
                onCommit={sealEdit}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label={uz.point.x}
                  value={Math.round(point.x)}
                  min={-100000}
                  max={100000}
                  onChange={(v) => v !== null && updatePoint(point.id, { x: v }, 'x')}
                  onCommit={sealEdit}
                />
                <NumberField
                  label={uz.point.y}
                  value={Math.round(point.y)}
                  min={-100000}
                  max={100000}
                  onChange={(v) => v !== null && updatePoint(point.id, { y: v }, 'y')}
                  onCommit={sealEdit}
                />
              </div>
            )}
          </div>
          <NoteField point={point} />
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-2 lg:mt-3 lg:pt-3">
            <span className="text-[15px]">{uz.point.color}</span>
            <ColorSwatches
              swatches={SWATCHES}
              value={point.color}
              onChange={(c) => updatePoint(point.id, { color: c }, 'color')}
            />
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            <span className="text-[14.5px]">{uz.point.status}</span>
            <div>
              <StatusPicker
                value={point.status}
                onChange={(st) => updatePoint(point.id, { status: st }, `status-${st}`)}
              />
            </div>
          </div>
          <div className={cn('grid grid-cols-2 gap-2.5 pt-2.5', showTitle && 'md:max-lg:hidden')}>
            <Button
              variant="danger"
              className="h-10 w-full px-2 lg:h-[46px]"
              onClick={() => removePoint(point.id)}
            >
              <Trash2 size={20} aria-hidden />
              {uz.point.delete}
            </Button>
            <Button className="h-10 w-full px-2 lg:h-[46px]" onClick={() => duplicateSelectedPoint(point.id)}>
              <Copy size={20} aria-hidden />
              {uz.point.duplicate}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-8 text-center">
          <div className="text-[15px] font-medium">{uz.point.none}</div>
          <div className="text-[13px] text-text-muted">{uz.point.noneHint}</div>
        </div>
      )}
    </div>
  );
}
