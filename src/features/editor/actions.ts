import { boundsOf, fitViewport, zoomAt } from '@/domain/geometry';
import { uuidv7 } from '@/domain/ids';
import { setStatusRecipe } from '@/domain/installation';
import { useAuthStore } from '@/store/authStore';
import type { PointStatus } from '@/domain/types';
import {
  addPointRecipe,
  duplicatePoint,
  settingsRecipe,
  updatePointRecipe,
  type PointPatch,
} from '@/domain/points';
import {
  deleteSelection as deleteFromProject,
  duplicateRoom,
  renameRoomRecipe,
  renameWallRecipe,
  roomColorRecipe,
  topologyRecipe,
} from '@/domain/rooms';
import { splitWall } from '@/domain/wallEdits';
import { lengthCm, resizedWall, setWallLength } from '@/domain/dimensions';
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

export function renameWall(wallId: string, name: string) {
  useProjectStore.getState().apply('Nomlash', renameWallRecipe(wallId, name, new Date().toISOString()));
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

/** Optional exact wall length (cm). False when the geometry cannot take it (nothing changes then). */
export function setSelectedWallLength(wallId: string, cm: number): boolean {
  const p = project();
  if (!p) return false;
  const wall = p.walls.find((w) => w.id === wallId);
  if (!wall) return false;
  if (lengthCm(wall.a, wall.b) === cm) return true;
  const next = setWallLength(p, wallId, cm, topoOpts());
  if (next === p) return false;
  useProjectStore.getState().apply('Devor uzunligi', topologyRecipe(next));
  // the wall may come back under a new id after the topology pass: keep the same wall selected
  const after = project();
  if (after && !after.walls.some((w) => w.id === wallId && w.deletedAt === null)) {
    const same = resizedWall(after, wall, cm);
    if (same) {
      useEditorStore.getState().select(after, [{ kind: 'wall', id: same }]);
      return true;
    }
  }
  refreshSelection();
  return true;
}

/** Panel edits on a point; typing in one field stays one undo step (sealed on blur). */
export function updatePoint(pointId: string, patch: PointPatch, field: string) {
  useProjectStore
    .getState()
    .apply('Nuqta', updatePointRecipe(pointId, patch, new Date().toISOString()), `edit-${pointId}-${field}`);
}

export function sealEdit() {
  useProjectStore.getState().seal();
}

export function duplicateSelectedPoint(pointId: string) {
  const p = project();
  if (!p) return;
  const copy = duplicatePoint(p, pointId, uuidv7(), new Date().toISOString());
  if (!copy) return;
  useProjectStore.getState().apply('Nusxa', addPointRecipe(copy));
  const after = project();
  if (after) useEditorStore.getState().select(after, [{ kind: 'point', id: copy.id }]);
}

/** Default heights of the open project (Sozlamalar). */
export function setDefaultHeights(patch: { defaultSocketHeightCm?: number; defaultSwitchHeightCm?: number }) {
  useProjectStore.getState().apply('Sozlamalar', settingsRecipe(patch), 'project-settings');
}

/** Montaj: point status with an InstallationTask log entry (one undo step). */
export function setPointStatus(pointId: string, status: PointStatus) {
  useProjectStore
    .getState()
    .apply(
      'Holat',
      setStatusRecipe(
        pointId,
        status,
        uuidv7(),
        new Date().toISOString(),
        useAuthStore.getState().user?.id ?? null,
      ),
    );
}

/** Select a point and bring it to the middle of the plan (keeps the zoom). */
export function focusPoint(pointId: string) {
  const p = project();
  const ed = useEditorStore.getState();
  const pt = p?.points.find((x) => x.id === pointId && x.deletedAt === null);
  if (!p || !pt) return;
  ed.select(p, [{ kind: 'point', id: pt.id }]);
  const vp = ed.viewport;
  const { width, height } = ed.canvasSize;
  if (!vp || width === 0) return;
  const sx = pt.x * vp.scale + vp.x;
  const sy = pt.y * vp.scale + vp.y;
  const margin = Math.min(width, height) * 0.15;
  if (sx > margin && sx < width - margin && sy > margin && sy < height - margin) return;
  ed.setViewport({ ...vp, x: width / 2 - pt.x * vp.scale, y: height / 2 - pt.y * vp.scale });
}
