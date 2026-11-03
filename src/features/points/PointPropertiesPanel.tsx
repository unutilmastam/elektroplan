'use client';

import { Copy, Plug, Trash2 } from 'lucide-react';
import { ColorSwatches, type Swatch } from '@/components/common/ColorSwatches';
import { NextPhase } from '@/components/common/Hint';
import { NumberField } from '@/components/common/NumberField';
import { Button } from '@/components/ui/button';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { SYMBOL_COLORS } from '@/features/symbols/catalog';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';

const SWATCHES: Swatch[] = [
  { value: SYMBOL_COLORS.blue, label: uz.point.swatch.blue },
  { value: SYMBOL_COLORS.red, label: uz.point.swatch.red },
  { value: SYMBOL_COLORS.green, label: uz.point.swatch.green },
  { value: SYMBOL_COLORS.yellow, label: uz.point.swatch.yellow },
  { value: SYMBOL_COLORS.purple, label: uz.point.swatch.purple },
];

/** "Tanlangan nuqta" — read-only in Phase 1; editing arrives with Phase 6. */
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

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {showTitle ? (
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-2.5 lg:px-5 lg:pt-4 lg:pb-4">
          <Plug size={24} className="rotate-180 text-primary-hi" fill="currentColor" aria-hidden />
          <h2 className="text-[16px] font-semibold lg:text-[17px]">{uz.point.panelTitle}</h2>
        </div>
      ) : null}
      {point ? (
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-3.5 pb-3 lg:px-4">
          <div className="flex items-center gap-4 border-b border-white/[0.08] py-2.5 lg:py-4">
            <SymbolIcon
              id={point.symbolId}
              size={58}
              color={point.color}
              className="h-12 w-12 drop-shadow-[0_0_12px_rgba(59,139,255,0.35)] lg:h-[58px] lg:w-[58px]"
            />
            <span className="text-[18px] font-medium lg:text-[20px]">{uz.symbols[point.symbolId]}</span>
          </div>
          <div className="flex flex-col gap-2 pt-2.5 lg:gap-3 lg:pt-4">
            <NumberField label={uz.point.height} value={point.mountHeightCm} unit={uz.point.cm} />
            <NumberField label={uz.point.fromCorner} value={point.distanceFromCornerCm} unit={uz.point.cm} />
          </div>
          <label className="mt-2.5 block text-[15px] lg:mt-4">
            {uz.point.note}
            <textarea
              readOnly
              value={point.description}
              rows={2}
              className="mt-1.5 block h-[44px] w-full resize-none rounded-lg border border-white/12 bg-[#0a1222] px-3 py-2.5 text-base text-text outline-none lg:mt-2 lg:h-[56px]"
            />
          </label>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.08] pt-2.5 lg:mt-4 lg:pt-5">
            <span className="text-[15px]">{uz.point.color}</span>
            <ColorSwatches swatches={SWATCHES} value={point.color} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-3 lg:pt-5">
            <NextPhase className="flex">
              <Button variant="danger" disabled className="h-11 w-full px-2 lg:h-[54px]">
                <Trash2 size={20} aria-hidden />
                {uz.point.delete}
              </Button>
            </NextPhase>
            <NextPhase className="flex">
              <Button disabled className="h-11 w-full px-2 lg:h-[54px]">
                <Copy size={20} aria-hidden />
                {uz.point.duplicate}
              </Button>
            </NextPhase>
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
