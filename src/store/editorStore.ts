import { create } from 'zustand';
import type { Bounds, Vec2, Viewport } from '@/domain/geometry';
import { focusForSelection } from '@/domain/selectors';
import type { PanelFocus, Selection } from '@/domain/selection';
import type { Project, SymbolId } from '@/domain/types';

export type DrawToolId = 'room-rect' | 'room-square' | 'room-polygon' | 'sketch' | 'wall' | 'door' | 'window';
export type ToolId = 'select' | 'marquee' | 'pan' | 'place' | DrawToolId;
export const DRAW_TOOLS: DrawToolId[] = [
  'room-rect',
  'room-square',
  'room-polygon',
  'sketch',
  'wall',
  'door',
  'window',
];
export const isDrawTool = (t: ToolId): t is DrawToolId => (DRAW_TOOLS as string[]).includes(t);

/** In-progress drawing shown on the canvas (world units). */
export type DraftShape =
  | { kind: 'rect'; a: Vec2; b: Vec2 }
  | { kind: 'polygon'; points: Vec2[]; cursor: Vec2 | null; closable: boolean }
  | { kind: 'wall'; a: Vec2; b: Vec2 }
  | { kind: 'stroke'; points: Vec2[] }
  | { kind: 'symbol'; symbolId: SymbolId; at: Vec2 };

export interface ContextMenuState {
  /** screen position relative to the canvas */
  x: number;
  y: number;
}

interface EditorState {
  tool: ToolId;
  activeSymbolId: SymbolId;
  viewport: Viewport | null;
  /** bumps when the canvas should re-fit the plan (Ekranga sig'dirish) */
  fitRequest: number;
  selection: Selection;
  /** what the side panels show (derived from the selection, or set by the room list) */
  selectedPointId: string | null;
  selectedRoomId: string | null;
  selectedWallId: string | null;
  /** live marquee rectangle in world units while dragging */
  marquee: Bounds | null;
  contextMenu: ContextMenuState | null;
  draft: DraftShape | null;
  /** snapped position under the Pencil / mouse before touching (hover) */
  hover: Vec2 | null;
  /** last draw tool, shown on the toolbar's draw button */
  lastDrawTool: DrawToolId;
  setDraft: (d: DraftShape | null) => void;
  setHover: (p: Vec2 | null) => void;
  canvasSize: { width: number; height: number };
  setCanvasSize: (w: number, h: number) => void;
  setTool: (t: ToolId) => void;
  setActiveSymbol: (id: SymbolId) => void;
  setViewport: (v: Viewport) => void;
  requestFit: () => void;
  /** replaces the selection and refocuses the panels */
  select: (project: Project, sel: Selection) => void;
  /** direct panel focus (room list, demo) without changing the canvas selection kind */
  setFocus: (f: Partial<PanelFocus>, sel?: Selection) => void;
  clearSelection: () => void;
  setMarquee: (r: Bounds | null) => void;
  openContextMenu: (m: ContextMenuState | null) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  tool: 'select',
  activeSymbolId: 'socket-single',
  viewport: null,
  fitRequest: 0,
  selection: [],
  selectedPointId: null,
  selectedRoomId: null,
  selectedWallId: null,
  marquee: null,
  contextMenu: null,
  draft: null,
  hover: null,
  lastDrawTool: 'room-rect',
  setDraft: (draft) => set({ draft }),
  setHover: (hover) => set((s) => (s.hover === hover ? s : { hover })),
  canvasSize: { width: 0, height: 0 },
  setCanvasSize: (width, height) =>
    set((s) =>
      s.canvasSize.width === width && s.canvasSize.height === height ? s : { canvasSize: { width, height } },
    ),
  setTool: (tool) =>
    set((s) => ({
      tool,
      marquee: null,
      draft: null,
      hover: null,
      lastDrawTool: isDrawTool(tool) ? tool : s.lastDrawTool,
    })),
  /** picking a symbol switches to the placement tool */
  setActiveSymbol: (id) =>
    set({ activeSymbolId: id, tool: 'place', draft: null, hover: null, marquee: null }),
  setViewport: (viewport) => set({ viewport }),
  requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),
  select: (project, selection) => {
    const f = focusForSelection(project, selection);
    set({ selection, selectedPointId: f.pointId, selectedRoomId: f.roomId, selectedWallId: f.wallId });
  },
  setFocus: (f, sel) =>
    set((s) => ({
      selection: sel ?? s.selection,
      selectedPointId: f.pointId === undefined ? s.selectedPointId : f.pointId,
      selectedRoomId: f.roomId === undefined ? s.selectedRoomId : f.roomId,
      selectedWallId: f.wallId === undefined ? s.selectedWallId : f.wallId,
    })),
  clearSelection: () =>
    set({
      selection: [],
      selectedPointId: null,
      selectedRoomId: null,
      selectedWallId: null,
      contextMenu: null,
    }),
  setMarquee: (marquee) => set({ marquee }),
  openContextMenu: (contextMenu) => set({ contextMenu }),
}));
