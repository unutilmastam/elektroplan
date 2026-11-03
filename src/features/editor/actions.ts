import { deleteSelectionRecipe } from '@/domain/editing';
import { zoomAt } from '@/domain/geometry';
import { liveSelection, selectAll } from '@/domain/selection';
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

export function deleteSelection(): boolean {
  const p = project();
  if (!p) return false;
  const sel = liveSelection(p, useEditorStore.getState().selection);
  if (sel.length === 0) return false;
  const ok = useProjectStore
    .getState()
    .apply('O‘chirish', deleteSelectionRecipe(sel, new Date().toISOString()));
  useEditorStore.getState().clearSelection();
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
