import type { Vec2 } from '@/domain/geometry';
import type { Tool, ToolContext } from './types';

/** Siljitish: any drag pans the view. */
export function createPanTool(ctx: ToolContext): Tool {
  let last: Vec2 | null = null;
  return {
    onDown(p) {
      last = p.screen;
    },
    onMove(p) {
      if (!last) return;
      ctx.panBy(p.screen.x - last.x, p.screen.y - last.y);
      last = p.screen;
    },
    onUp() {
      last = null;
    },
    onCancel() {
      last = null;
    },
  };
}
