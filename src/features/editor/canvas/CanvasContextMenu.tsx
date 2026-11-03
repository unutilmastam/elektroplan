'use client';

import { Copy, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NextPhase } from '@/components/common/Hint';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { useUiStore } from '@/store/uiStore';
import { deleteSelection } from '../actions';

const item =
  'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60';

/** Long press (touch / Pencil) or right click on the plan. */
export function CanvasContextMenu() {
  const menu = useEditorStore((s) => s.contextMenu);
  const close = () => useEditorStore.getState().openContextMenu(null);
  const size = useEditorStore((s) => s.canvasSize);
  const ref = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);
  // The finger lifting after a long press produces a synthetic click under it — ignore that one.
  const guard = (fn: () => void) => () => {
    if (performance.now() - openedAt.current < 450) return;
    fn();
  };

  useEffect(() => {
    if (!menu) return;
    openedAt.current = performance.now();
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', outside, true);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('keydown', esc);
    };
  }, [menu]);

  if (!menu) return null;
  const W = 220;
  const H = 156;
  // open beside the finger, not under it
  const left = Math.max(8, Math.min(menu.x + 16, size.width - W - 8));
  const top = Math.max(8, Math.min(menu.y - H / 2, size.height - H - 8));
  return (
    <div
      ref={ref}
      role="menu"
      aria-label={uz.canvas.menu}
      className="glass absolute z-30 flex flex-col gap-1 p-2"
      style={{ left, top, width: W, background: 'rgba(14,22,40,0.96)' }}
    >
      <button
        type="button"
        role="menuitem"
        className={item}
        onClick={guard(() => {
          useUiStore.getState().requestProperties();
          close();
        })}
      >
        <SlidersHorizontal size={18} aria-hidden />
        {uz.canvas.properties}
      </button>
      <NextPhase side="right" className="flex">
        <button type="button" role="menuitem" disabled className={item}>
          <Copy size={18} aria-hidden />
          {uz.canvas.duplicate}
        </button>
      </NextPhase>
      <button
        type="button"
        role="menuitem"
        className={`${item} text-[#ff7b7b]`}
        onClick={guard(() => {
          deleteSelection();
          close();
        })}
      >
        <Trash2 size={18} aria-hidden />
        {uz.canvas.delete}
      </button>
    </div>
  );
}
