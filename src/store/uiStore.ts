import { create } from 'zustand';

/** Which project dialog is open. Any button can open one; `ProjectDialogs` (in AppShell) renders it. */
type ProjectDialog =
  { kind: 'create' } | { kind: 'edit'; id: string } | { kind: 'delete'; id: string } | null;

interface UiState {
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

export const useUiStore = create<UiState>()((set) => ({
  dialog: null,
  openCreate: () => set({ dialog: { kind: 'create' } }),
  openEdit: (id) => set({ dialog: { kind: 'edit', id } }),
  openDelete: (id) => set({ dialog: { kind: 'delete', id } }),
  closeDialog: () => set({ dialog: null }),
  propertiesRequest: 0,
  requestProperties: () => set((s) => ({ propertiesRequest: s.propertiesRequest + 1 })),
  notice: null,
  notify: (text) => set((s) => ({ notice: { id: (s.notice?.id ?? 0) + 1, text } })),
  clearNotice: () => set({ notice: null }),
  renameRequest: null,
  requestRename: (roomId) =>
    set((s) => ({
      renameRequest: { id: (s.renameRequest?.id ?? 0) + 1, roomId },
      propertiesRequest: s.propertiesRequest + 1,
    })),
}));
