'use client';

import {
  AppWindow,
  BrickWall,
  DoorOpen,
  Pentagon,
  PencilLine,
  RectangleHorizontal,
  Square,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { AnchoredMenu } from '@/components/common/AnchoredMenu';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { DRAW_TOOLS, isDrawTool, useEditorStore, type DrawToolId } from '@/store/editorStore';

export const DRAW_TOOL_META: Record<DrawToolId, { icon: LucideIcon; label: string; key: string }> = {
  'room-rect': { icon: RectangleHorizontal, label: uz.tools.roomRect, key: 'R' },
  'room-square': { icon: Square, label: uz.tools.roomSquare, key: 'Q' },
  'room-polygon': { icon: Pentagon, label: uz.tools.roomPolygon, key: 'P' },
  sketch: { icon: PencilLine, label: uz.tools.sketch, key: 'F' },
  wall: { icon: BrickWall, label: uz.tools.wall, key: 'W' },
  door: { icon: DoorOpen, label: uz.tools.door, key: 'D' },
  window: { icon: AppWindow, label: uz.tools.window, key: 'O' },
};

/** Toolbar button showing the last draw tool; opens the list of drawing tools. */
export function DrawToolsMenu({ buttonClass }: { buttonClass: string }) {
  const tool = useEditorStore((s) => s.tool);
  const last = useEditorStore((s) => s.lastDrawTool);
  const setTool = useEditorStore((s) => s.setTool);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const active = isDrawTool(tool);
  const Icon = DRAW_TOOL_META[active ? tool : last].icon;
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={uz.tools.draw}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-pressed={active}
        title={uz.tools.draw}
        onClick={() => setOpen((o) => !o)}
        className={cn(buttonClass, active ? 'bg-primary/25 text-white' : 'text-text hover:bg-white/[0.07]')}
      >
        <Icon
          className="h-5 w-5 sm:h-[22px] sm:w-[22px] lg:h-[26px] lg:w-[26px]"
          strokeWidth={1.9}
          aria-hidden
        />
      </button>
      <AnchoredMenu
        anchorRef={ref}
        open={open}
        onClose={close}
        width={250}
        label={uz.tools.draw}
        placement="right"
      >
        {DRAW_TOOLS.map((id) => {
          const m = DRAW_TOOL_META[id];
          return (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={tool === id}
              onClick={() => {
                setTool(id);
                close();
              }}
              className="flex h-11 items-center gap-3 rounded-lg px-2.5 text-left text-[15px] hover:bg-white/[0.06] aria-checked:bg-primary/25"
            >
              <m.icon size={20} aria-hidden />
              <span className="flex-1">{m.label}</span>
              <kbd className="hidden rounded border border-white/15 px-1.5 text-[11px] text-text-dim md:inline">
                {m.key}
              </kbd>
            </button>
          );
        })}
      </AnchoredMenu>
    </>
  );
}
