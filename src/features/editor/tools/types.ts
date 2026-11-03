import type { Bounds, Vec2 } from '@/domain/geometry';
import type { Opening, Room, SymbolId } from '@/domain/types';
import type { DraftShape } from '@/store/editorStore';
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
  /** starts dragging (`hit` = what was pressed: a label, a single wall, or the selection); false = nothing moves */
  beginMove: (hit: EntityRef) => boolean;
  /** total world delta since beginMove (one undo step per drag) */
  moveTo: (delta: Vec2, free?: boolean) => void;
  endMove: () => void;
  /** screen-pixel pan */
  panBy: (dx: number, dy: number) => void;
  /** double tap / double click on an entity (rooms: rename) */
  doubleTap: (hit: EntityRef) => void;

  // ── drawing (Phase 4) ──
  /** snapped world position: existing corner → wall → 45° from `from` → grid */
  snap: (p: ToolPointer, from?: Vec2) => Vec2;
  /** screen px → world units at the current zoom */
  px: (n: number) => number;
  setDraft: (d: DraftShape | null) => void;
  setHover: (p: Vec2 | null) => void;
  createRoom: (vertices: Vec2[], shape: Room['shape']) => void;
  createWall: (a: Vec2, b: Vec2) => void;
  commitSketch: (stroke: Vec2[], pointerType: PointerKind) => void;
  placeOpening: (p: ToolPointer, kind: Opening['kind']) => void;
  /** the symbol picked in the symbol bar */
  activeSymbol: () => SymbolId;
  /** where the picked symbol would go (snapped to a wall / room) for the preview */
  symbolPreview: (p: ToolPointer) => DraftShape;
  /** tap with the placement tool (Shift = free, no wall) */
  placeSymbol: (p: ToolPointer) => void;
}

/** A tool is a small pointer state machine (ARCHITECTURE §4.1). */
export interface Tool {
  onDown: (p: ToolPointer) => void;
  onMove: (p: ToolPointer) => void;
  onUp: (p: ToolPointer) => void;
  onCancel: () => void;
  /** pointer moving without pressing (mouse, Pencil hover) */
  onHover?: (p: ToolPointer) => void;
  /** keyboard / on-screen command; true when handled */
  onKey?: (key: 'Enter' | 'Escape' | 'Backspace') => boolean;
}

/** Movement (screen px) before a press becomes a drag. Fingers wobble more than mice. */
export const dragSlop = (t: PointerKind) => (t === 'mouse' ? 4 : t === 'pen' ? 6 : 10);
