'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { deleteSelection, redo, selectEverything, undo, zoomBy } from '../actions';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/**
 * DEVICES §2/§5: V tanlash, M ramka, H siljitish, Space+drag pan, ⌫/Delete o'chirish, Esc,
 * ⌘/Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y, ⌘/Ctrl+A, +/− zoom, 0 ekranga sig'dirish.
 * Returns a getter telling whether Space is held (for the gesture router).
 */
export function useKeyboardShortcuts(): () => boolean {
  const space = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const ed = useEditorStore.getState();
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (e.code === 'Space') {
        space.current = true;
        e.preventDefault();
        return;
      }
      if (mod && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && k === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && k === 'a') {
        e.preventDefault();
        selectEverything();
        return;
      }
      if (mod) return;
      if (k === 'delete' || k === 'backspace') {
        if (deleteSelection()) e.preventDefault();
      } else if (k === 'escape') {
        ed.openContextMenu(null);
        ed.setMarquee(null);
        ed.clearSelection();
      } else if (k === 'v') ed.setTool('select');
      else if (k === 'm') ed.setTool('marquee');
      else if (k === 'h') ed.setTool('pan');
      else if (k === '+' || k === '=') zoomBy(1.2);
      else if (k === '-' || k === '_') zoomBy(1 / 1.2);
      else if (k === '0') ed.requestFit();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') space.current = false;
    };
    const onBlur = () => (space.current = false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return useCallback(() => space.current, []);
}
