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
}

export const useUiStore = create<UiState>()((set) => ({
  dialog: null,
  openCreate: () => set({ dialog: { kind: 'create' } }),
  openEdit: (id) => set({ dialog: { kind: 'edit', id } }),
  openDelete: (id) => set({ dialog: { kind: 'delete', id } }),
  closeDialog: () => set({ dialog: null }),
}));
