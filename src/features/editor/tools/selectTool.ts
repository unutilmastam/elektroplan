import { distance, type Vec2 } from '@/domain/geometry';
import { hasRef, mergeSelection, plainRef, sameRef, toggleRef, type EntityRef } from '@/domain/selection';
import { dragSlop, type Tool, type ToolContext, type ToolPointer } from './types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'pressEntity'; start: ToolPointer; hit: EntityRef }
  | { kind: 'moving'; start: ToolPointer }
  | { kind: 'pressEmpty'; start: ToolPointer; last: Vec2 }
  | { kind: 'panning'; last: Vec2 };

export interface SelectToolOptions {
  /** false for finger input in "Faqat Pencil" mode: a drag never moves objects, it pans */
  allowMove: boolean;
}

/**
 * Tanlash: tap selects (Shift adds, Ctrl/Cmd toggles), tap on empty clears,
 * drag a selected object moves the selection (one undo step), drag on empty space pans.
 */
export function createSelectTool(ctx: ToolContext, opts: SelectToolOptions = { allowMove: true }): Tool {
  let mode: Mode = { kind: 'idle' };
  let lastTap: { at: number; ref: EntityRef } | null = null;

  return {
    onDown(p) {
      const hit = ctx.hit(p);
      if (!hit) {
        mode = { kind: 'pressEmpty', start: p, last: p.screen };
        return;
      }
      // Selection is decided on release or drag start, so a second finger (pinch) or a long press
      // can still take over without changing the selection.
      mode = { kind: 'pressEntity', start: p, hit };
    },

    onMove(p) {
      switch (mode.kind) {
        case 'pressEntity':
          if (distance(p.screen, mode.start.screen) < dragSlop(p.pointerType)) return;
          if (mode.start.shift || mode.start.toggle) {
            mode = { kind: 'panning', last: p.screen };
            return;
          }
          if (opts.allowMove && !hasRef(ctx.selection(), mode.hit)) ctx.select([plainRef(mode.hit)]);
          if (opts.allowMove && ctx.beginMove(mode.hit)) {
            mode = { kind: 'moving', start: mode.start };
            ctx.moveTo({ x: p.world.x - mode.start.world.x, y: p.world.y - mode.start.world.y });
          } else mode = { kind: 'panning', last: p.screen };
          return;
        case 'moving':
          ctx.moveTo({ x: p.world.x - mode.start.world.x, y: p.world.y - mode.start.world.y });
          return;
        case 'pressEmpty':
          if (distance(p.screen, mode.start.screen) < dragSlop(p.pointerType)) return;
          mode = { kind: 'panning', last: mode.last };
          ctx.panBy(p.screen.x - mode.last.x, p.screen.y - mode.last.y);
          mode.last = p.screen;
          return;
        case 'panning':
          ctx.panBy(p.screen.x - mode.last.x, p.screen.y - mode.last.y);
          mode.last = p.screen;
          return;
        default:
      }
    },

    onUp(p) {
      if (mode.kind === 'pressEntity') {
        const sel = ctx.selection();
        const { hit, start } = mode;
        const ref = plainRef(hit);
        if (start.toggle) ctx.select(toggleRef(sel, ref));
        else if (start.shift) ctx.select(mergeSelection(sel, [ref]));
        else ctx.select([ref]);
        const now = Date.now();
        if (lastTap && now - lastTap.at < 400 && sameRef(lastTap.ref, ref)) {
          ctx.doubleTap(hit);
          lastTap = null;
        } else lastTap = { at: now, ref };
      }
      if (mode.kind === 'moving') ctx.endMove();
      if (mode.kind === 'pressEmpty' && !p.shift && !p.toggle) ctx.select([]);
      mode = { kind: 'idle' };
    },

    onCancel() {
      if (mode.kind === 'moving') ctx.endMove();
      mode = { kind: 'idle' };
    },
  };
}
