import { create } from 'zustand';

/** Which project dialog is open. Any button can open one; `ProjectDialogs` (in AppShell) renders it. */
type ProjectDialog =
  { kind: 'create' } | { kind: 'edit'; id: string } | { kind: 'delete'; id: string } | null;

/** PHASE 19: workspace layout (per device, remembered in localStorage). */
const LAYOUT_KEY = 'elektroplan:layout';
export const BOTTOM_MIN = 120;
interface Layout {
  /** bottom row (rooms / wall view / status) height in px; 0 = folded away */
  bottomHeight: number;
  /** height to restore when unfolding */
  bottomLast: number;
}
function readLayout(): Layout {
  const d: Layout = { bottomHeight: -1, bottomLast: -1 }; // -1 = the layout's own default
  try {
    const v = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? 'null') as Partial<Layout> | null;
    const ok = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= -1 && n < 4000;
    return v && ok(v.bottomHeight) && ok(v.bottomLast) ? { ...d, ...v } : d;
  } catch {
    return d;
  }
}
function saveLayout(l: Layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(l));
  } catch {
    // private mode: the layout is just not remembered
  }
}

interface UiState {
  /** PHASE 19: the plan fills the workspace (side and bottom panels hidden) */
  planExpanded: boolean;
  setPlanExpanded: (v: boolean) => void;
  layout: Layout;
  loadLayout: () => void;
  setBottomHeight: (h: number) => void;
  toggleBottom: () => void;
  dialog: ProjectDialog;
  openCreate: () => void;
  openEdit: (id: string) => void;
  openDelete: (id: string) => void;
  closeDialog: () => void;
  /** bumps when "Xususiyatlar" is chosen; compact layouts open the point panel */
  propertiesRequest: number;
  requestProperties: () => void;
  /** short message shown at the bottom (e.g. why an action was refused) */
  notice: { id: number; text: string } | null;
  notify: (text: string) => void;
  clearNotice: () => void;
  /** bumps with a room id to focus its name field (double tap on a room) */
  renameRequest: { id: number; roomId: string } | null;
  requestRename: (roomId: string) => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  planExpanded: false,
  setPlanExpanded: (planExpanded) => set({ planExpanded }),
  layout: { bottomHeight: -1, bottomLast: -1 },
  loadLayout: () => set({ layout: readLayout() }),
  setBottomHeight: (h) => {
    const height = h === -1 ? -1 : h < BOTTOM_MIN ? 0 : Math.round(h);
    const layout = { bottomHeight: height, bottomLast: height !== 0 ? height : get().layout.bottomLast };
    saveLayout(layout);
    set({ layout });
  },
  toggleBottom: () => {
    const { bottomHeight, bottomLast } = get().layout;
    get().setBottomHeight(bottomHeight === 0 ? (bottomLast > 0 ? bottomLast : -1) : 0);
  },
  dialog: null,
  openCreate: () => set({ dialog: { kind: 'create' } }),
  openEdit: (id) => set({ dialog: { kind: 'edit', id } }),
  openDelete: (id) => set({ dialog: { kind: 'delete', id } }),
  closeDialog: () => set({ dialog: null }),
  propertiesRequest: 0,
  requestProperties: () =>
    set((s) => ({ propertiesRequest: s.propertiesRequest + 1, planExpanded: false })),
  notice: null,
  notify: (text) => set((s) => ({ notice: { id: (s.notice?.id ?? 0) + 1, text } })),
  clearNotice: () => set({ notice: null }),
  renameRequest: null,
  requestRename: (roomId) =>
    set((s) => ({
      renameRequest: { id: (s.renameRequest?.id ?? 0) + 1, roomId },
      propertiesRequest: s.propertiesRequest + 1,
      planExpanded: false,
    })),
}));
