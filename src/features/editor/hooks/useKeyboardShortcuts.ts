'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore, type DrawToolId } from '@/store/editorStore';
import { useProjectStore } from '@/store/projectStore';
import { getActiveTool } from '../tools/registry';
import { deleteSelection, redo, selectEverything, undo, zoomBy } from '../actions';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/**
 * DEVICES §2/§5: V tanlash, M ramka, H siljitish, R/Q/P/F/W/D/O chizish asboblari, Space+drag pan, ⌫/Delete o'chirish, Esc,
 * ⌘/Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y, ⌘/Ctrl+A, +/− zoom, 0 ekranga sig'dirish.
 * Returns a getter telling whether Space is held (for the gesture router).
 */
export function useKeyboardShortcuts(readOnly = false): () => boolean {
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
      if (readOnly && mod && k !== 's') return;
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
      if (mod && k === 's') {
        e.preventDefault();
        void useProjectStore.getState().flush();
        return;
      }
      if (mod && k === 'a') {
        e.preventDefault();
        selectEverything();
        return;
      }
      if (mod) return;
      if (readOnly) {
        // Montaj rejimi: view keys only
        if (k === 'escape') ed.clearSelection();
        else if (k === '+' || k === '=') zoomBy(1.2);
        else if (k === '-' || k === '_') zoomBy(1 / 1.2);
        else if (k === '0') ed.requestFit();
        return;
      }
      const tool = getActiveTool();
      if ((e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') && tool?.onKey?.(e.key)) {
        e.preventDefault();
        return;
      }
      const drawKey: Record<string, DrawToolId> = {
        r: 'room-rect',
        q: 'room-square',
        p: 'room-polygon',
        f: 'sketch',
        w: 'wall',
        d: 'door',
        o: 'window',
      };
      if (drawKey[k]) {
        ed.setTool(drawKey[k]);
        return;
      }
      if (k === 'delete' || k === 'backspace') {
        if (deleteSelection()) e.preventDefault();
      } else if (k === 'escape') {
        if (ed.tool !== 'select') ed.setTool('select');
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
  }, [readOnly]);

  return useCallback(() => space.current, []);
}
