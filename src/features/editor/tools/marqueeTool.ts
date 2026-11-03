import { distance, rectFromPoints } from '@/domain/geometry';
import { mergeSelection } from '@/domain/selection';
import { dragSlop, type Tool, type ToolContext, type ToolPointer } from './types';

/** Ramka tanlash: drag a rectangle, everything fully inside is selected (Shift adds). A tap acts like Tanlash. */
export function createMarqueeTool(ctx: ToolContext): Tool {
  let start: ToolPointer | null = null;
  let dragging = false;

  const finish = (p: ToolPointer) => {
    if (!start) return;
    if (dragging) {
      const found = ctx.entitiesIn(rectFromPoints(start.world, p.world));
      ctx.select(p.shift || p.toggle ? mergeSelection(ctx.selection(), found) : found);
    } else {
      const hit = ctx.hit(p);
      if (hit) ctx.select(p.shift || p.toggle ? mergeSelection(ctx.selection(), [hit]) : [hit]);
      else if (!p.shift && !p.toggle) ctx.select([]);
    }
  };

  return {
    onDown(p) {
      start = p;
      dragging = false;
    },
    onMove(p) {
      if (!start) return;
      if (!dragging && distance(p.screen, start.screen) < dragSlop(p.pointerType)) return;
      dragging = true;
      ctx.setMarquee(rectFromPoints(start.world, p.world));
    },
    onUp(p) {
      finish(p);
      ctx.setMarquee(null);
      start = null;
      dragging = false;
    },
    onCancel() {
      ctx.setMarquee(null);
      start = null;
      dragging = false;
    },
  };
}
