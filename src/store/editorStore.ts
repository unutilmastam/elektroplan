import { create } from 'zustand';
import type { Viewport } from '@/domain/geometry';
import type { SymbolId } from '@/domain/types';

export type ToolId = 'select' | 'marquee' | 'pan';

interface EditorState {
  tool: ToolId;
  activeSymbolId: SymbolId;
  viewport: Viewport | null;
  /** bumps when the canvas should re-fit the plan (Ekranga sig'dirish) */
  fitRequest: number;
  selectedPointId: string | null;
  selectedRoomId: string | null;
  selectedWallId: string | null;
  setActiveSymbol: (id: SymbolId) => void;
  setViewport: (v: Viewport) => void;
  requestFit: () => void;
  selectRoom: (id: string | null) => void;
  setSelection: (
    s: Partial<Pick<EditorState, 'selectedPointId' | 'selectedRoomId' | 'selectedWallId'>>,
  ) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  tool: 'select',
  activeSymbolId: 'socket-single',
  viewport: null,
  fitRequest: 0,
  selectedPointId: null,
  selectedRoomId: null,
  selectedWallId: null,
  setActiveSymbol: (id) => set({ activeSymbolId: id }),
  setViewport: (viewport) => set({ viewport }),
  requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),
  selectRoom: (id) => set({ selectedRoomId: id }),
  setSelection: (sel) => set(sel),
}));
