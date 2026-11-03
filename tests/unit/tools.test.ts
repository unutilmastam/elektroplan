import { describe, expect, it } from 'vitest';
import type { Bounds, Vec2 } from '@/domain/geometry';
import type { EntityRef, Selection } from '@/domain/selection';
import { createMarqueeTool, createPanTool, createSelectTool } from '@/features/editor/tools';
import type { ToolContext, ToolPointer } from '@/features/editor/tools/types';

/** Fake canvas: entity "a" at world x∈[0,10], "b" at x∈[20,30]; screen == world. */
function fakeCtx(movable = true) {
  const log: string[] = [];
  let selection: Selection = [];
  let marquee: Bounds | null = null;
  const moves: Vec2[] = [];
  let pan = { x: 0, y: 0 };
  const ctx: ToolContext = {
    hit: (p) =>
      p.world.x <= 10
        ? { kind: 'point', id: 'a' }
        : p.world.x >= 20 && p.world.x <= 30
          ? { kind: 'point', id: 'b' }
          : null,
    selection: () => selection,
    select: (s) => {
      selection = s;
      log.push(`select:${s.map((r: EntityRef) => r.id).join(',')}`);
    },
    entitiesIn: (r) =>
      r.minX <= 0 && r.maxX >= 30
        ? [
            { kind: 'point', id: 'a' },
            { kind: 'point', id: 'b' },
          ]
        : [],
    setMarquee: (r) => void (marquee = r),
    beginMove: () => {
      log.push('beginMove');
      return movable;
    },
    moveTo: (d) => void moves.push(d),
    endMove: () => void log.push('endMove'),
    panBy: (dx, dy) => void (pan = { x: pan.x + dx, y: pan.y + dy }),
    doubleTap: (h) => void log.push(`double:${h.id}`),
    snap: (p) => p.world,
    px: (n) => n,
    setDraft: () => undefined,
    setHover: () => undefined,
    createRoom: () => undefined,
    createWall: () => undefined,
    commitSketch: () => undefined,
    placeOpening: () => undefined,
    activeSymbol: () => 'socket-single',
    symbolPreview: (p) => ({
      kind: 'symbol',
      symbolId: 'socket-single',
      at: p.world,
      rotation: 0,
      valid: true,
    }),
    placeSymbol: () => void log.push('place'),
  };
  return { ctx, log, moves, sel: () => selection, marquee: () => marquee, pan: () => pan };
}

const ptr = (x: number, y = 0, mods: Partial<ToolPointer> = {}): ToolPointer => ({
  world: { x, y },
  screen: { x, y },
  pointerType: 'mouse',
  shift: false,
  toggle: false,
  ...mods,
});

describe('select tool', () => {
  it('tap selects, tap on empty clears', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx);
    t.onDown(ptr(5));
    t.onUp(ptr(5));
    expect(f.sel()).toEqual([{ kind: 'point', id: 'a' }]);
    t.onDown(ptr(15));
    t.onUp(ptr(15));
    expect(f.sel()).toEqual([]);
  });

  it('shift adds, ctrl toggles', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx);
    t.onDown(ptr(5));
    t.onUp(ptr(5));
    t.onDown(ptr(25, 0, { shift: true }));
    t.onUp(ptr(25, 0, { shift: true }));
    expect(f.sel().map((r) => r.id)).toEqual(['a', 'b']);
    t.onDown(ptr(5, 0, { toggle: true }));
    t.onUp(ptr(5, 0, { toggle: true }));
    expect(f.sel().map((r) => r.id)).toEqual(['b']);
  });

  it('dragging an object moves the selection by the total delta, once begun and ended', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx);
    t.onDown(ptr(5));
    t.onMove(ptr(6)); // within slop
    expect(f.moves).toHaveLength(0);
    t.onMove(ptr(15, 3));
    t.onMove(ptr(25, 6));
    t.onUp(ptr(25, 6));
    expect(f.moves).toEqual([
      { x: 10, y: 3 },
      { x: 20, y: 6 },
    ]);
    expect(f.log.filter((l) => l === 'beginMove' || l === 'endMove')).toEqual(['beginMove', 'endMove']);
  });

  it('dragging empty space pans and keeps the selection', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx);
    f.ctx.select([{ kind: 'point', id: 'a' }]);
    t.onDown(ptr(15));
    t.onMove(ptr(17, 0));
    t.onMove(ptr(19, 4));
    t.onUp(ptr(19, 4));
    expect(f.pan()).toEqual({ x: 4, y: 4 });
    expect(f.sel()).toEqual([{ kind: 'point', id: 'a' }]);
  });

  it('finger in "Faqat Pencil" mode pans instead of moving', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx, { allowMove: false });
    t.onDown(ptr(5, 0, { pointerType: 'touch' }));
    t.onMove(ptr(20, 0, { pointerType: 'touch' }));
    t.onMove(ptr(30, 0, { pointerType: 'touch' }));
    expect(f.moves).toHaveLength(0);
    expect(f.pan()).toEqual({ x: 10, y: 0 });
  });

  it('a press that is cancelled (second finger / long press) does not change the selection', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx);
    f.ctx.select([{ kind: 'point', id: 'b' }]);
    t.onDown(ptr(5, 0, { pointerType: 'touch' }));
    t.onCancel();
    expect(f.sel()).toEqual([{ kind: 'point', id: 'b' }]);
  });

  it('dragging an unselected object selects it first; dragging inside a multi-selection keeps the group', () => {
    const f = fakeCtx();
    const t = createSelectTool(f.ctx);
    t.onDown(ptr(25));
    t.onMove(ptr(40));
    t.onUp(ptr(40));
    expect(f.sel()).toEqual([{ kind: 'point', id: 'b' }]);
    f.ctx.select([
      { kind: 'point', id: 'a' },
      { kind: 'point', id: 'b' },
    ]);
    t.onDown(ptr(5));
    t.onMove(ptr(20));
    t.onUp(ptr(20));
    expect(f.sel().map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('immovable selection pans; cancel ends a move', () => {
    const f = fakeCtx(false);
    const t = createSelectTool(f.ctx);
    t.onDown(ptr(5));
    t.onMove(ptr(15));
    t.onMove(ptr(20));
    expect(f.pan()).toEqual({ x: 5, y: 0 });
    const g = fakeCtx(true);
    const t2 = createSelectTool(g.ctx);
    t2.onDown(ptr(5));
    t2.onMove(ptr(15));
    t2.onCancel();
    expect(g.log).toContain('endMove');
  });
});

describe('marquee tool', () => {
  it('selects everything inside the dragged rectangle and clears the rectangle', () => {
    const f = fakeCtx();
    const t = createMarqueeTool(f.ctx);
    t.onDown(ptr(-5, -5));
    t.onMove(ptr(35, 5));
    expect(f.marquee()).toEqual({ minX: -5, minY: -5, maxX: 35, maxY: 5 });
    t.onUp(ptr(35, 5));
    expect(f.sel().map((r) => r.id)).toEqual(['a', 'b']);
    expect(f.marquee()).toBeNull();
  });
  it('a tap acts like select; shift merges', () => {
    const f = fakeCtx();
    const t = createMarqueeTool(f.ctx);
    t.onDown(ptr(5));
    t.onUp(ptr(5));
    t.onDown(ptr(25, 0, { shift: true }));
    t.onUp(ptr(25, 0, { shift: true }));
    expect(f.sel().map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('pan tool', () => {
  it('pans by pointer movement', () => {
    const f = fakeCtx();
    const t = createPanTool(f.ctx);
    t.onDown(ptr(0));
    t.onMove(ptr(10, 5));
    t.onMove(ptr(12, 5));
    t.onUp(ptr(12, 5));
    t.onMove(ptr(50, 50));
    expect(f.pan()).toEqual({ x: 12, y: 5 });
  });
});
