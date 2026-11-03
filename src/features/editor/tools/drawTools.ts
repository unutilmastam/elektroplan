import { distance, rectFromPoints, type Vec2 } from '@/domain/geometry';
import type { Opening } from '@/domain/types';
import type { Tool, ToolContext, ToolPointer } from './types';

const rectCorners = (a: Vec2, b: Vec2): Vec2[] => {
  const r = rectFromPoints(a, b);
  return [
    { x: r.minX, y: r.minY },
    { x: r.maxX, y: r.minY },
    { x: r.maxX, y: r.maxY },
    { x: r.minX, y: r.maxY },
  ];
};

/** To'rtburchak / Kvadrat xona: drag from corner to corner. Sizes are never asked for. */
export function createRectRoomTool(ctx: ToolContext, square: boolean): Tool {
  let start: Vec2 | null = null;
  let end: Vec2 | null = null;
  const fix = (a: Vec2, b: Vec2): Vec2 => {
    if (!square) return b;
    const s = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    return { x: a.x + Math.sign(b.x - a.x || 1) * s, y: a.y + Math.sign(b.y - a.y || 1) * s };
  };
  return {
    onDown(p) {
      start = ctx.snap(p);
      end = start;
    },
    onMove(p) {
      if (!start) return;
      end = fix(start, ctx.snap(p));
      ctx.setDraft({ kind: 'rect', a: start, b: end });
    },
    onUp() {
      if (start && end && Math.abs(end.x - start.x) >= ctx.px(16) && Math.abs(end.y - start.y) >= ctx.px(16))
        ctx.createRoom(rectCorners(start, end), square ? 'square' : 'rect');
      start = end = null;
      ctx.setDraft(null);
    },
    onCancel() {
      start = end = null;
      ctx.setDraft(null);
    },
    onHover(p) {
      ctx.setHover(ctx.snap(p));
    },
  };
}

/** Erkin xona: tap corners; tap the first corner (or Enter / "Yopish") to finish. */
export function createPolygonRoomTool(ctx: ToolContext): Tool {
  let points: Vec2[] = [];
  let cursor: Vec2 | null = null;
  const closeTol = () => ctx.px(18);
  const show = () =>
    ctx.setDraft(
      points.length ? { kind: 'polygon', points: [...points], cursor, closable: points.length >= 3 } : null,
    );
  const finish = () => {
    if (points.length >= 3) ctx.createRoom(points, 'polygon');
    points = [];
    cursor = null;
    ctx.setDraft(null);
  };
  const nextPoint = (p: ToolPointer) => ctx.snap(p, points[points.length - 1]);
  return {
    onDown(p) {
      cursor = nextPoint(p);
      show();
    },
    onMove(p) {
      cursor = nextPoint(p);
      show();
    },
    onUp(p) {
      const q = nextPoint(p);
      if (points.length >= 3 && distance(q, points[0]!) <= closeTol()) return finish();
      if (!points.length || distance(q, points[points.length - 1]!) > ctx.px(4)) points.push(q);
      cursor = q;
      show();
    },
    onCancel() {
      show();
    },
    onHover(p) {
      cursor = nextPoint(p);
      ctx.setHover(cursor);
      show();
    },
    onKey(key) {
      if (!points.length) return false;
      if (key === 'Enter') finish();
      else if (key === 'Escape') {
        points = [];
        ctx.setDraft(null);
      } else {
        points.pop();
        show();
      }
      return true;
    },
  };
}

/** Devor: drag a straight wall (snaps to corners, walls, 45° and the grid). */
export function createWallTool(ctx: ToolContext): Tool {
  let a: Vec2 | null = null;
  let b: Vec2 | null = null;
  return {
    onDown(p) {
      a = ctx.snap(p);
      b = a;
    },
    onMove(p) {
      if (!a) return;
      b = ctx.snap(p, a);
      ctx.setDraft({ kind: 'wall', a, b });
    },
    onUp() {
      if (a && b && distance(a, b) >= ctx.px(16)) ctx.createWall(a, b);
      a = b = null;
      ctx.setDraft(null);
    },
    onCancel() {
      a = b = null;
      ctx.setDraft(null);
    },
    onHover(p) {
      ctx.setHover(ctx.snap(p));
    },
  };
}

/** Qo'lda chizish: draw freely; on release the app straightens it (rooms or walls). */
export function createSketchTool(ctx: ToolContext): Tool {
  let stroke: Vec2[] = [];
  let kind: ToolPointer['pointerType'] = 'mouse';
  return {
    onDown(p) {
      stroke = [p.world];
      kind = p.pointerType;
      ctx.setDraft({ kind: 'stroke', points: stroke });
    },
    onMove(p) {
      if (!stroke.length) return;
      stroke.push(p.world);
      ctx.setDraft({ kind: 'stroke', points: [...stroke] });
    },
    onUp(p) {
      if (stroke.length) {
        stroke.push(p.world);
        ctx.commitSketch(stroke, kind);
      }
      stroke = [];
      ctx.setDraft(null);
    },
    onCancel() {
      stroke = [];
      ctx.setDraft(null);
    },
  };
}

/** Eshik / Deraza: tap on a wall. */
export function createOpeningTool(ctx: ToolContext, kind: Opening['kind']): Tool {
  let down: ToolPointer | null = null;
  return {
    onDown(p) {
      down = p;
    },
    onMove() {},
    onUp(p) {
      if (down && distance(down.screen, p.screen) < 12) ctx.placeOpening(p, kind);
      down = null;
    },
    onCancel() {
      down = null;
    },
  };
}

/** Belgi joylashtirish: the picked symbol follows the pointer; a tap places it. */
export function createPlaceSymbolTool(ctx: ToolContext): Tool {
  let down: ToolPointer | null = null;
  const ghost = (p: ToolPointer) => ctx.setDraft(ctx.symbolPreview(p));
  return {
    onDown(p) {
      down = p;
      ghost(p);
    },
    onMove(p) {
      ghost(p);
    },
    onUp(p) {
      if (down && distance(down.screen, p.screen) < 12) ctx.placeSymbol(p);
      down = null;
    },
    onCancel() {
      down = null;
      ctx.setDraft(null);
    },
    onHover(p) {
      ghost(p);
    },
  };
}
