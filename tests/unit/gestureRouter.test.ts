import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Viewport } from '@/domain/geometry';
import { GestureRouter, LONG_PRESS_MS, type RawPointer } from '@/features/editor/input/GestureRouter';
import type { Tool } from '@/features/editor/tools/types';

function setup(opts: { space?: boolean } = {}) {
  let vp: Viewport = { x: 0, y: 0, scale: 1 };
  const calls: string[] = [];
  const tool: Tool = {
    onDown: (p) => void calls.push(`down:${p.pointerType}:${p.world.x},${p.world.y}`),
    onMove: (p) => void calls.push(`move:${p.screen.x}`),
    onUp: () => void calls.push('up'),
    onCancel: () => void calls.push('cancel'),
  };
  const longPress: string[] = [];
  const r = new GestureRouter({
    getViewport: () => vp,
    setViewport: (v) => void (vp = v),
    toolFor: () => tool,
    spaceHeld: () => opts.space ?? false,
    onLongPress: (s, _w, k) => void longPress.push(`${k}@${s.x},${s.y}`),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  });
  return { r, calls, longPress, vp: () => vp, setVp: (v: Viewport) => void (vp = v) };
}

const ev = (id: number, type: string, x: number, y: number, extra: Partial<RawPointer> = {}): RawPointer => ({
  pointerId: id,
  pointerType: type,
  x,
  y,
  button: 0,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  ...extra,
});

describe('GestureRouter', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('sends a single pointer to the tool in world coordinates', () => {
    const s = setup();
    s.setVp({ x: 10, y: 0, scale: 2 });
    s.r.down(ev(1, 'mouse', 30, 8));
    s.r.move(ev(1, 'mouse', 40, 8));
    s.r.up(ev(1, 'mouse', 40, 8));
    expect(s.calls).toEqual(['down:mouse:10,4', 'move:40', 'up']);
  });

  it('second finger cancels the tool and pinch-zooms', () => {
    const s = setup();
    s.r.down(ev(1, 'touch', 100, 100));
    s.r.down(ev(2, 'touch', 200, 100));
    s.r.move(ev(2, 'touch', 300, 100));
    expect(s.calls).toEqual(['down:touch:100,100', 'cancel']);
    expect(s.vp().scale).toBeCloseTo(2);
    // lifting one finger does not restart the tool with the other
    s.r.up(ev(2, 'touch', 300, 100));
    s.r.move(ev(1, 'touch', 150, 100));
    s.r.up(ev(1, 'touch', 150, 100));
    expect(s.calls).toEqual(['down:touch:100,100', 'cancel']);
    vi.advanceTimersByTime(LONG_PRESS_MS * 2);
    expect(s.longPress).toEqual([]);
  });

  it('rejects the palm while the Pencil is down', () => {
    const s = setup();
    s.r.down(ev(1, 'pen', 10, 10));
    expect(s.r.down(ev(2, 'touch', 300, 300))).toBe(false);
    s.r.move(ev(2, 'touch', 320, 300));
    s.r.up(ev(1, 'pen', 10, 10));
    expect(s.calls).toEqual(['down:pen:10,10', 'up']);
  });

  it('long press opens the context menu and cancels the tool; movement prevents it', () => {
    const s = setup();
    s.r.down(ev(1, 'touch', 50, 60));
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(s.longPress).toEqual(['touch@50,60']);
    expect(s.calls).toEqual(['down:touch:50,60', 'cancel']);
    s.r.up(ev(1, 'touch', 50, 60));

    const t = setup();
    t.r.down(ev(1, 'pen', 50, 60));
    t.r.move(ev(1, 'pen', 80, 60));
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(t.longPress).toEqual([]);
  });

  it('middle mouse button and Space+drag pan', () => {
    const s = setup();
    s.r.down(ev(1, 'mouse', 0, 0, { button: 1 }));
    s.r.move(ev(1, 'mouse', 15, -5, { button: 1 }));
    s.r.up(ev(1, 'mouse', 15, -5, { button: 1 }));
    expect(s.vp()).toEqual({ x: 15, y: -5, scale: 1 });
    const sp = setup({ space: true });
    sp.r.down(ev(1, 'mouse', 0, 0));
    sp.r.move(ev(1, 'mouse', 7, 3));
    expect(sp.vp()).toEqual({ x: 7, y: 3, scale: 1 });
    expect(sp.calls).toEqual([]);
  });

  it('ignores right click (handled as context menu)', () => {
    const s = setup();
    expect(s.r.down(ev(1, 'mouse', 0, 0, { button: 2 }))).toBe(false);
    expect(s.calls).toEqual([]);
  });

  it('wheel zooms at the cursor, trackpad scroll pans', () => {
    const s = setup();
    s.r.wheel({ x: 100, y: 100, deltaX: 0, deltaY: -100, deltaMode: 0, ctrlKey: false });
    expect(s.vp().scale).toBeGreaterThan(1);
    const before = s.vp();
    s.r.wheel({ x: 0, y: 0, deltaX: 3.5, deltaY: 7.25, deltaMode: 0, ctrlKey: false });
    expect(s.vp()).toEqual({ ...before, x: before.x - 3.5, y: before.y - 7.25 });
  });
});
