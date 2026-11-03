'use client';

import { CircleCheck } from 'lucide-react';
import { NextPhase } from '@/components/common/Hint';
import { ProgressRing } from '@/components/common/ProgressRing';
import { Button } from '@/components/ui/button';
import { computeProgress } from '@/domain/progress';
import { uz } from '@/i18n/uz';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';

function Row({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/[0.07] py-[7px] last:border-b-0">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: dot }} aria-hidden />
      <span className="flex-1 text-[14px] lg:text-[15px]">{label}</span>
      <span className="tabular text-[15px] font-medium">{value}</span>
    </div>
  );
}

/** "Loyiha holati": completion ring + counts + "Loyiha tayyor". */
export function ProgressCard({ showTitle = true }: { showTitle?: boolean }) {
  const points = useProjectStore((s) => selectCurrentProject(s)?.points);
  const p = computeProgress(points ?? []);
  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-3 pb-3 lg:pt-4 lg:pb-4">
      {showTitle ? <h2 className="text-[16px] font-semibold lg:text-[17px]">{uz.status.title}</h2> : null}
      <div className="flex min-h-0 flex-1 items-center gap-4 py-2 lg:gap-5">
        <div className="md:hidden lg:block">
          <ProgressRing percent={p.percent} size={98} stroke={9} />
        </div>
        <div className="hidden md:block lg:hidden">
          <ProgressRing percent={p.percent} size={80} stroke={8} />
        </div>
        <div className="min-w-0 flex-1">
          <Row dot="#22c55e" label={uz.status.completed} value={p.completed} />
          <Row dot="#f97316" label={uz.status.remaining} value={p.remaining} />
          <Row dot="#334155" label={uz.status.total} value={p.total} />
        </div>
      </div>
      <NextPhase className="flex">
        <Button variant="success" disabled className="h-11 w-full text-[16px] lg:h-[54px] lg:text-[17px]">
          <CircleCheck size={26} className="text-success" aria-hidden />
          {uz.status.ready}
        </Button>
      </NextPhase>
    </div>
  );
}
