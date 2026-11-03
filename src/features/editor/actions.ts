import { boundsOf, fitViewport, zoomAt } from '@/domain/geometry';
import { uuidv7 } from '@/domain/ids';
import {
  deleteSelection as deleteFromProject,
  duplicateRoom,
  renameRoomRecipe,
  roomColorRecipe,
  topologyRecipe,
} from '@/domain/rooms';
import { splitWall } from '@/domain/wallEdits';
import { liveSelection, plainRef, selectAll } from '@/domain/selection';
import { uz } from '@/i18n/uz';
import { useUiStore } from '@/store/uiStore';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';

/** Editor commands shared by toolbar, keyboard, context menu and panels. */

const project = () => selectCurrentProject(useProjectStore.getState());

/** After undo/redo/delete the selection may point at removed entities — keep only live ones. */
function refreshSelection() {
  const p = project();
  const ed = useEditorStore.getState();
  if (p) ed.select(p, liveSelection(p, ed.selection));
}

/** ids + timestamp for topology edits */
export const topoOpts = () => ({ makeId: () => uuidv7(), now: new Date().toISOString() });

export function deleteSelection(): boolean {
  const p = project();
  if (!p) return false;
  const sel = liveSelection(p, useEditorStore.getState().selection).map(plainRef);
  if (sel.length === 0) return false;
  const r = deleteFromProject(p, sel, topoOpts());
  if (r.refused)
    useUiStore
      .getState()
      .notify(r.refused === 'exterior' ? uz.walls.cannotDeleteExterior : uz.walls.cannotMerge);
  const ok = useProjectStore.getState().apply('O‘chirish', topologyRecipe(r.project));
  if (ok) useEditorStore.getState().clearSelection();
  return ok;
}

export function undo() {
  useProjectStore.getState().undo();
  refreshSelection();
}

export function redo() {
  useProjectStore.getState().redo();
  refreshSelection();
}

export function selectEverything() {
  const p = project();
  if (p) useEditorStore.getState().select(p, selectAll(p));
}

/** Zoom around the canvas centre (toolbar +/−, keyboard). */
export function zoomBy(factor: number) {
  const ed = useEditorStore.getState();
  if (!ed.viewport) return;
  const { width, height } = ed.canvasSize;
  ed.setViewport(zoomAt(ed.viewport, factor, { x: width / 2, y: height / 2 }));
}

/** Room list "ko'z": fit the view to one room and select it. */
export function focusRoom(roomId: string) {
  const p = project();
  const ed = useEditorStore.getState();
  const room = p?.rooms.find((r) => r.id === roomId && r.deletedAt === null);
  if (!p || !room) return;
  const b = boundsOf(room.vertices);
  const { width, height } = ed.canvasSize;
  if (b && width > 0) {
    const toolbar = width < 600 ? 52 : width < 1000 ? 64 : 80;
    const v = fitViewport(b, width - toolbar, height, Math.max(40, Math.min(width, height) * 0.12));
    ed.setViewport({ ...v, x: v.x + toolbar, scale: Math.min(v.scale, 4) });
  }
  ed.select(p, [{ kind: 'room', id: roomId }]);
}

export function renameRoom(roomId: string, name: string) {
  const trimmed = name.trim().slice(0, 60);
  if (trimmed)
    useProjectStore.getState().apply('Nomlash', renameRoomRecipe(roomId, trimmed, new Date().toISOString()));
}

export function setRoomColor(roomId: string, color: string) {
  useProjectStore.getState().apply('Rang', roomColorRecipe(roomId, color, new Date().toISOString()));
}

export function duplicateSelectedRoom(roomId: string) {
  const p = project();
  if (!p) return;
  const src = p.rooms.find((r) => r.id === roomId);
  if (!src) return;
  const id = uuidv7();
  const grid = p.settings.snapToGrid ? p.settings.gridSize : 0;
  const next = duplicateRoom(
    p,
    roomId,
    { id, name: `${src.name} ${uz.projects.copySuffix}` },
    grid,
    topoOpts(),
  );
  useProjectStore.getState().apply('Nusxa', topologyRecipe(next));
  const after = project();
  if (after) useEditorStore.getState().select(after, [{ kind: 'room', id }]);
}

export function splitSelectedWall(wallId: string) {
  const p = project();
  if (!p) return;
  const grid = p.settings.snapToGrid ? p.settings.gridSize : 0;
  useProjectStore
    .getState()
    .apply('Devorni bo‘lish', topologyRecipe(splitWall(p, wallId, 0.5, grid, topoOpts())));
  refreshSelection();
}
