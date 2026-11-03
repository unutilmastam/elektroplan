import { describe, expect, it } from 'vitest';
import type { Vec2 } from '@/domain/geometry';
import {
  createOpeningTool,
  createPolygonRoomTool,
  createRectRoomTool,
  createSketchTool,
  createWallTool,
} from '@/features/editor/tools';
import type { ToolContext, ToolPointer } from '@/features/editor/tools/types';
import type { DraftShape } from '@/store/editorStore';

function fake() {
  const calls: string[] = [];
  let draft: DraftShape | null = null;
  const rooms: Array<{ vs: Vec2[]; shape: string }> = [];
  const walls: Array<[Vec2, Vec2]> = [];
  let sketch: Vec2[] = [];
  const ctx = {
    snap: (p: ToolPointer) => ({ x: Math.round(p.world.x / 10) * 10, y: Math.round(p.world.y / 10) * 10 }),
    px: (n: number) => n,
    setDraft: (d: DraftShape | null) => void (draft = d),
    setHover: () => undefined,
    createRoom: (vs: Vec2[], shape: string) => void rooms.push({ vs, shape }),
    createWall: (a: Vec2, b: Vec2) => void walls.push([a, b]),
    commitSketch: (s: Vec2[]) => void (sketch = s),
    placeOpening: (_p: ToolPointer, k: string) => void calls.push(`opening:${k}`),
  } as unknown as ToolContext;
  return { ctx, calls, rooms, walls, draft: () => draft, sketch: () => sketch };
}
const p = (x: number, y: number): ToolPointer => ({
  world: { x, y },
  screen: { x, y },
  pointerType: 'pen',
  shift: false,
  toggle: false,
});

describe('drawing tools', () => {
  it('rectangle: drag corner to corner, snapped, no sizes asked', () => {
    const f = fake();
    const t = createRectRoomTool(f.ctx, false);
    t.onDown(p(2, 3));
    t.onMove(p(150, 80));
    expect(f.draft()).toEqual({ kind: 'rect', a: { x: 0, y: 0 }, b: { x: 150, y: 80 } });
    t.onUp(p(148, 79));
    expect(f.rooms[0]).toEqual({
      vs: [
        { x: 0, y: 0 },
        { x: 150, y: 0 },
        { x: 150, y: 80 },
        { x: 0, y: 80 },
      ],
      shape: 'rect',
    });
    expect(f.draft()).toBeNull();
  });

  it('square keeps equal sides; tiny drags are ignored', () => {
    const f = fake();
    const t = createRectRoomTool(f.ctx, true);
    t.onDown(p(0, 0));
    t.onMove(p(-120, 60));
    t.onUp(p(-120, 60));
    expect(f.rooms[0]!.vs).toEqual([
      { x: -120, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 120 },
      { x: -120, y: 120 },
    ]);
    t.onDown(p(0, 0));
    t.onMove(p(5, 5));
    t.onUp(p(5, 5));
    expect(f.rooms).toHaveLength(1);
  });

  it('freeform room: taps add corners, tapping the first corner closes it', () => {
    const f = fake();
    const t = createPolygonRoomTool(f.ctx);
    for (const [x, y] of [
      [0, 0],
      [200, 0],
      [200, 100],
      [100, 100],
      [100, 200],
      [0, 200],
    ] as const) {
      t.onDown(p(x, y));
      t.onUp(p(x, y));
    }
    expect(f.draft()).toMatchObject({ kind: 'polygon', closable: true });
    t.onDown(p(3, 4));
    t.onUp(p(3, 4));
    expect(f.rooms[0]!.vs).toHaveLength(6);
    expect(f.rooms[0]!.shape).toBe('polygon');
  });

  it('freeform room: Backspace removes the last corner, Enter finishes, Escape cancels', () => {
    const f = fake();
    const t = createPolygonRoomTool(f.ctx);
    expect(t.onKey!('Enter')).toBe(false); // nothing drawn → key not consumed
    for (const [x, y] of [
      [0, 0],
      [100, 0],
      [100, 100],
      [50, 150],
    ] as const) {
      t.onDown(p(x, y));
      t.onUp(p(x, y));
    }
    t.onKey!('Backspace');
    t.onKey!('Enter');
    expect(f.rooms[0]!.vs).toHaveLength(3);
    t.onDown(p(0, 0));
    t.onUp(p(0, 0));
    t.onKey!('Escape');
    expect(f.draft()).toBeNull();
    expect(f.rooms).toHaveLength(1);
  });

  it('wall: drag a segment', () => {
    const f = fake();
    const t = createWallTool(f.ctx);
    t.onDown(p(0, 0));
    t.onMove(p(100, 1));
    t.onUp(p(100, 1));
    expect(f.walls).toEqual([
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    ]);
  });

  it('sketch: raw stroke goes to commitSketch (straightening happens there)', () => {
    const f = fake();
    const t = createSketchTool(f.ctx);
    t.onDown(p(0, 0));
    t.onMove(p(10, 1));
    t.onMove(p(20, -1));
    t.onUp(p(30, 0));
    expect(f.sketch()).toHaveLength(4);
    expect(f.draft()).toBeNull();
  });

  it('door / window: a tap places, a drag does not', () => {
    const f = fake();
    const t = createOpeningTool(f.ctx, 'door');
    t.onDown(p(10, 10));
    t.onUp(p(12, 11));
    t.onDown(p(10, 10));
    t.onUp(p(80, 10));
    expect(f.calls).toEqual(['opening:door']);
  });
});
