import {
  classifyWheel,
  distance,
  panBy,
  pinchViewport,
  screenToWorld,
  wheelZoomFactor,
  zoomAt,
  type Vec2,
  type Viewport,
} from '@/domain/geometry';
import type { PointerKind, Tool, ToolPointer } from '../tools/types';

/** Minimal pointer event shape (DOM PointerEvent fits; tests pass plain objects). */
export interface RawPointer {
  pointerId: number;
  pointerType: string;
  /** canvas-relative screen position */
  x: number;
  y: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export interface RawWheel {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
}

export interface RouterDeps {
  getViewport: () => Viewport;
  setViewport: (v: Viewport) => void;
  /** tool for this pointer type (finger may get a pan-only tool in "Faqat Pencil" mode) */
  toolFor: (kind: PointerKind) => Tool;
  /** true while Space is held (temporary pan) */
  spaceHeld: () => boolean;
  onLongPress: (screen: Vec2, world: Vec2, kind: PointerKind) => void;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (h: unknown) => void;
}

export const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

type Gesture =
  | { kind: 'none' }
  | { kind: 'tool'; id: number; tool: Tool; pointerType: PointerKind; downAt: Vec2 }
  | { kind: 'pan'; id: number; last: Vec2 }
  | { kind: 'pinch'; a: number; b: number; start: Viewport; a0: Vec2; b0: Vec2 }
  /** after a pinch, leftover fingers are ignored until all are lifted */
  | { kind: 'ignore' };

const kindOf = (t: string): PointerKind => (t === 'pen' ? 'pen' : t === 'touch' ? 'touch' : 'mouse');

/**
 * Routes raw pointers to: two-finger pinch/pan, mouse middle-button / Space pan, or the active tool.
 * Palm rejection: while the Pencil is down, finger touches are ignored. Long press (touch/pen) → context menu.
 */
export class GestureRouter {
  private pointers = new Map<number, { p: Vec2; kind: PointerKind }>();
  private gesture: Gesture = { kind: 'none' };
  private longPress: unknown = null;
  private penDown = false;

  constructor(private deps: RouterDeps) {}

  private toolPointer(e: RawPointer): ToolPointer {
    const screen = { x: e.x, y: e.y };
    return {
      screen,
      world: screenToWorld(this.deps.getViewport(), screen),
      pointerType: kindOf(e.pointerType),
      shift: e.shiftKey,
      toggle: e.ctrlKey || e.metaKey,
    };
  }

  private touches(): number[] {
    return [...this.pointers.entries()].filter(([, v]) => v.kind === 'touch').map(([id]) => id);
  }

  private cancelLongPress() {
    if (this.longPress !== null) this.deps.clearTimer(this.longPress);
    this.longPress = null;
  }

  private cancelTool() {
    this.cancelLongPress();
    if (this.gesture.kind === 'tool') this.gesture.tool.onCancel();
  }

  /** Returns true when the event was consumed (caller should capture the pointer). */
  down(e: RawPointer): boolean {
    const kind = kindOf(e.pointerType);
    if (kind === 'touch' && this.penDown) return false; // palm while drawing with Pencil
    if (kind === 'mouse' && e.button === 2) return false; // right click → contextmenu event
    this.pointers.set(e.pointerId, { p: { x: e.x, y: e.y }, kind });
    if (kind === 'pen') this.penDown = true;

    const touches = this.touches();
    if (kind === 'touch' && touches.length >= 2) {
      this.cancelTool();
      const [a, b] = touches as [number, number];
      this.gesture = {
        kind: 'pinch',
        a,
        b,
        start: this.deps.getViewport(),
        a0: this.pointers.get(a)!.p,
        b0: this.pointers.get(b)!.p,
      };
      return true;
    }
    if (this.gesture.kind !== 'none') return this.gesture.kind !== 'ignore';

    if ((kind === 'mouse' && e.button === 1) || this.deps.spaceHeld()) {
      this.gesture = { kind: 'pan', id: e.pointerId, last: { x: e.x, y: e.y } };
      return true;
    }
    const tool = this.deps.toolFor(kind);
    this.gesture = { kind: 'tool', id: e.pointerId, tool, pointerType: kind, downAt: { x: e.x, y: e.y } };
    tool.onDown(this.toolPointer(e));
    if (kind !== 'mouse') {
      this.longPress = this.deps.setTimer(() => {
        this.longPress = null;
        if (this.gesture.kind !== 'tool' || this.gesture.id !== e.pointerId) return;
        const at = this.pointers.get(e.pointerId)?.p ?? { x: e.x, y: e.y };
        this.gesture.tool.onCancel();
        this.gesture = { kind: 'ignore' };
        this.deps.onLongPress(at, screenToWorld(this.deps.getViewport(), at), kind);
      }, LONG_PRESS_MS);
    }
    return true;
  }

  move(e: RawPointer): void {
    const ptr = this.pointers.get(e.pointerId);
    if (!ptr) return;
    ptr.p = { x: e.x, y: e.y };
    const g = this.gesture;
    if (g.kind === 'pinch') {
      if (e.pointerId !== g.a && e.pointerId !== g.b) return;
      const a1 = this.pointers.get(g.a)?.p;
      const b1 = this.pointers.get(g.b)?.p;
      if (a1 && b1) this.deps.setViewport(pinchViewport(g.start, g.a0, g.b0, a1, b1));
    } else if (g.kind === 'pan' && g.id === e.pointerId) {
      this.deps.setViewport(panBy(this.deps.getViewport(), e.x - g.last.x, e.y - g.last.y));
      g.last = { x: e.x, y: e.y };
    } else if (g.kind === 'tool' && g.id === e.pointerId) {
      if (this.longPress !== null && distance(g.downAt, ptr.p) > LONG_PRESS_SLOP) this.cancelLongPress();
      g.tool.onMove(this.toolPointer(e));
    }
  }

  up(e: RawPointer, cancelled = false): void {
    const ptr = this.pointers.get(e.pointerId);
    if (!ptr) return;
    this.pointers.delete(e.pointerId);
    if (ptr.kind === 'pen') this.penDown = false;
    const g = this.gesture;
    if (g.kind === 'tool' && g.id === e.pointerId) {
      this.cancelLongPress();
      if (cancelled) g.tool.onCancel();
      else g.tool.onUp(this.toolPointer(e));
      this.gesture = { kind: 'none' };
    } else if (g.kind === 'pan' && g.id === e.pointerId) {
      this.gesture = { kind: 'none' };
    } else if (g.kind === 'pinch' && (e.pointerId === g.a || e.pointerId === g.b)) {
      this.gesture = this.pointers.size > 0 ? { kind: 'ignore' } : { kind: 'none' };
    } else if (g.kind === 'ignore' && this.pointers.size === 0) {
      this.gesture = { kind: 'none' };
    }
  }

  wheel(e: RawWheel): void {
    const v = this.deps.getViewport();
    if (classifyWheel(e) === 'zoom')
      this.deps.setViewport(zoomAt(v, wheelZoomFactor(e.deltaY, e.deltaMode), { x: e.x, y: e.y }));
    else this.deps.setViewport(panBy(v, -e.deltaX, -e.deltaY));
  }

  /** Window blur / tool switch: drop everything in progress. */
  reset(): void {
    this.cancelTool();
    this.pointers.clear();
    this.penDown = false;
    this.gesture = { kind: 'none' };
  }
}
