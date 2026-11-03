import { uuidv7 } from '@/domain/ids';
import {
  addOpening,
  addRoom,
  addWalls,
  nextRoomName,
  replaceWalls,
  setRoomVertices,
  topologyRecipe,
} from '@/domain/rooms';
import { hitTest } from '@/domain/selection';
import { straightenSketch } from '@/domain/sketch';
import { planAnchors } from '@/domain/snap';
import type { Opening, Room, Vec2 } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUiStore } from '@/store/uiStore';
import { topoOpts } from './actions';

/** Drawing commands used by the Phase 4 tools. Each is one (or, for sketches, two) undo steps. */

const project = () => selectCurrentProject(useProjectStore.getState());
const apply = (label: string, next: Parameters<typeof topologyRecipe>[0]) =>
  useProjectStore.getState().apply(label, topologyRecipe(next));

const OPENING_WIDTH: Record<Opening['kind'], number> = { door: 80, window: 120 };

export function createRoom(vertices: Vec2[], shape: Room['shape']) {
  const p = project();
  if (!p) return;
  const id = uuidv7();
  apply('Xona', addRoom(p, vertices, shape, { id, name: nextRoomName(p, uz.room.defaultName) }, topoOpts()));
  const after = project();
  if (after) useEditorStore.getState().select(after, [{ kind: 'room', id }]);
}

export function createWall(a: Vec2, b: Vec2) {
  const p = project();
  if (!p) return;
  const { project: next, ids } = addWalls(p, [a, b], topoOpts());
  apply('Devor', next);
  const after = project();
  if (after && ids[0]) useEditorStore.getState().select(after, [{ kind: 'wall', id: ids[0] }]);
}

/**
 * Freehand: first the raw (simplified) sketch is recorded, then — if enabled — the straightened version,
 * so a single "Bekor qilish" shows the original drawing.
 */
export function commitSketch(stroke: Vec2[]) {
  const p = project();
  const vp = useEditorStore.getState().viewport;
  if (!p || !vp) return;
  const grid = p.settings.snapToGrid ? p.settings.gridSize : 0;
  const walls = p.walls.filter((w) => w.deletedAt === null);
  const r = straightenSketch(stroke, { scale: vp.scale, grid, anchors: planAnchors(p), walls });
  if (!r) return;
  const straighten = useSettingsStore.getState().autoStraighten;
  if (r.kind === 'room') {
    const id = uuidv7();
    const raw = addRoom(p, r.raw, 'polygon', { id, name: nextRoomName(p, uz.room.defaultName) }, topoOpts());
    apply('Qo‘lda chizish', raw);
    if (straighten) apply('Tekislash', setRoomVertices(project()!, id, r.vertices, r.shape, topoOpts()));
    const after = project();
    if (after) useEditorStore.getState().select(after, [{ kind: 'room', id }]);
  } else {
    const first = addWalls(p, r.raw, topoOpts());
    apply('Qo‘lda chizish', first.project);
    if (straighten) apply('Tekislash', replaceWalls(project()!, first.ids, r.points, topoOpts()));
  }
}

export function placeOpening(world: Vec2, scale: number, pickPx: number, kind: Opening['kind']) {
  const p = project();
  if (!p) return;
  const walls = { ...p, points: [], rooms: [], openings: [] };
  const hit = hitTest(walls, world, { tolerance: pickPx / scale, pointRadius: 0 });
  if (!hit || hit.kind !== 'wall') {
    useUiStore.getState().notify(uz.opening.placeHint);
    return;
  }
  const wall = p.walls.find((w) => w.id === hit.id)!;
  const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y) || 1;
  const t =
    ((world.x - wall.a.x) * (wall.b.x - wall.a.x) + (world.y - wall.a.y) * (wall.b.y - wall.a.y)) /
    (len * len);
  const id = uuidv7();
  apply(
    kind === 'door' ? uz.opening.door : uz.opening.window,
    addOpening(p, wall.id, t, kind, OPENING_WIDTH[kind], id),
  );
  const after = project();
  if (after) useEditorStore.getState().select(after, [{ kind: 'opening', id }]);
}
