import type { Bounds, Vec2 } from '@/domain/geometry';
import type { EntityRef, Selection } from '@/domain/selection';

export type PointerKind = 'mouse' | 'touch' | 'pen';

export interface ToolPointer {
  world: Vec2;
  screen: Vec2;
  pointerType: PointerKind;
  /** Shift — add to selection */
  shift: boolean;
  /** Ctrl / Cmd — toggle in selection */
  toggle: boolean;
}

/** Everything a tool may do. Implemented by the canvas (stores); faked in unit tests. */
export interface ToolContext {
  hit: (p: ToolPointer) => EntityRef | null;
  selection: () => Selection;
  select: (sel: Selection) => void;
  entitiesIn: (r: Bounds) => Selection;
  setMarquee: (r: Bounds | null) => void;
  /** starts dragging the selection; false when nothing in it can move */
  beginMove: () => boolean;
  /** total world delta since beginMove (one undo step per drag) */
  moveTo: (delta: Vec2) => void;
  endMove: () => void;
  /** screen-pixel pan */
  panBy: (dx: number, dy: number) => void;
}

/** A tool is a small pointer state machine (ARCHITECTURE §4.1). */
export interface Tool {
  onDown: (p: ToolPointer) => void;
  onMove: (p: ToolPointer) => void;
  onUp: (p: ToolPointer) => void;
  onCancel: () => void;
}

/** Movement (screen px) before a press becomes a drag. Fingers wobble more than mice. */
export const dragSlop = (t: PointerKind) => (t === 'mouse' ? 4 : t === 'pen' ? 6 : 10);
