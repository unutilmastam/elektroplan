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
import { Hint } from '@/components/common/Hint';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';
import { useProjectStore } from '@/store/projectStore';
import { redo, undo, zoomBy } from '../actions';
import { DrawToolsMenu } from './DrawToolsMenu';

interface ToolProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** tool buttons report pressed state */
  toggle?: boolean;
  fillIcon?: boolean;
}

/** Shared size of toolbar buttons (compact on iPad landscape so 9 buttons fit). */
export const BTN =
  'flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors duration-150 disabled:cursor-not-allowed sm:h-10 sm:w-11 md:h-[40px] md:w-[48px] lg:h-[50px] lg:w-[56px]';

function ToolButton({
  icon: Icon,
  label,
  active = false,
  onClick,
  disabled = false,
  toggle = false,
  fillIcon = false,
}: ToolProps) {
  const btn = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={toggle ? active : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        BTN,
        active ? 'bg-primary/25 text-white' : 'text-text hover:bg-white/[0.07]',
        disabled && 'text-text/40',
      )}
    >
      <Icon
        className="h-5 w-5 sm:h-[22px] sm:w-[22px] lg:h-[26px] lg:w-[26px]"
        strokeWidth={1.9}
        fill={fillIcon ? 'currentColor' : 'none'}
        aria-hidden
      />
    </button>
  );
  return (
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

/** Left drawing toolbar (DESIGN_SYSTEM §4): tools, undo/redo, zoom, fit — all live. */
export function DrawingToolbar() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const requestFit = useEditorStore((s) => s.requestFit);
  const canUndo = useProjectStore((s) => s.history.past.length > 0);
  const canRedo = useProjectStore((s) => s.history.future.length > 0);
  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label={uz.tools.label}
      className="flex flex-col gap-1 sm:gap-1.5 lg:gap-2.5"
    >
      <Group>
        <ToolButton
          icon={MousePointer2}
          label={`${uz.tools.select} (V)`}
          active={tool === 'select'}
          onClick={() => setTool('select')}
          toggle
          fillIcon
        />
        <ToolButton
          icon={BoxSelect}
          label={`${uz.tools.marquee} (M)`}
          active={tool === 'marquee'}
          onClick={() => setTool('marquee')}
          toggle
        />
      </Group>
      <Group>
        <DrawToolsMenu buttonClass={BTN} />
        <ToolButton
          icon={Move}
          label={`${uz.tools.pan} (H)`}
          active={tool === 'pan'}
          onClick={() => setTool('pan')}
          toggle
        />
      </Group>
      <Group>
        <ToolButton icon={Undo2} label={uz.tools.undo} onClick={undo} disabled={!canUndo} />
        <ToolButton icon={Redo2} label={uz.tools.redo} onClick={redo} disabled={!canRedo} />
      </Group>
      <Group>
        <ToolButton icon={Plus} label={uz.tools.zoomIn} onClick={() => zoomBy(1.2)} />
        <ToolButton icon={Minus} label={uz.tools.zoomOut} onClick={() => zoomBy(1 / 1.2)} />
      </Group>
      <Group>
        <ToolButton icon={Maximize} label={uz.tools.fit} onClick={requestFit} />
      </Group>
    </div>
  );
}
