'use client';

import {
  BoxSelect,
  Maximize,
  Minus,
  MousePointer2,
  Move,
  Plus,
  Redo2,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Hint, NextPhase } from '@/components/common/Hint';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';

interface ToolProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** later-phase tool: rendered disabled with "Keyingi bosqichda" */
  later?: boolean;
  fillIcon?: boolean;
}

function ToolButton({
  icon: Icon,
  label,
  active = false,
  onClick,
  later = false,
  fillIcon = false,
}: ToolProps) {
  const btn = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={onClick || active ? active : undefined}
      disabled={later}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors duration-150 disabled:cursor-not-allowed sm:h-10 sm:w-11 md:h-10 md:w-[48px] lg:h-[54px] lg:w-[58px]',
        active ? 'bg-primary/25 text-white' : 'text-text hover:bg-white/[0.07]',
        later && 'text-text/70',
      )}
    >
      <Icon
        className="h-5 w-5 sm:h-[22px] sm:w-[22px] lg:h-[27px] lg:w-[27px]"
        strokeWidth={1.9}
        fill={fillIcon ? 'currentColor' : 'none'}
        aria-hidden
      />
    </button>
  );
  return later ? (
    <NextPhase side="right">{btn}</NextPhase>
  ) : (
    <Hint label={label} side="right">
      {btn}
    </Hint>
  );
}

function Group({ children }: { children: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-[11px] p-[2px] sm:p-[3px] lg:rounded-[12px] lg:p-[4px]">
      {children}
    </div>
  );
}

/** Left drawing toolbar (DESIGN_SYSTEM §4). Zoom/fit work now; drawing tools arrive in Phase 3. */
export function DrawingToolbar({ onZoom }: { onZoom: (factor: number) => void }) {
  const tool = useEditorStore((s) => s.tool);
  const requestFit = useEditorStore((s) => s.requestFit);
  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label={uz.tools.label}
      className="flex flex-col gap-1 sm:gap-1.5 lg:gap-2.5"
    >
      <Group>
        <ToolButton icon={MousePointer2} label={uz.tools.select} active={tool === 'select'} fillIcon />
      </Group>
      <Group>
        <ToolButton icon={BoxSelect} label={uz.tools.marquee} later />
      </Group>
      <Group>
        <ToolButton icon={Move} label={uz.tools.pan} later />
      </Group>
      <Group>
        <ToolButton icon={Undo2} label={uz.tools.undo} later />
        <ToolButton icon={Redo2} label={uz.tools.redo} later />
      </Group>
      <Group>
        <ToolButton icon={Plus} label={uz.tools.zoomIn} onClick={() => onZoom(1.2)} />
        <ToolButton icon={Minus} label={uz.tools.zoomOut} onClick={() => onZoom(1 / 1.2)} />
      </Group>
      <Group>
        <ToolButton icon={Maximize} label={uz.tools.fit} onClick={requestFit} />
      </Group>
    </div>
  );
}
