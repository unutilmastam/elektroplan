import { captureMoveOrigin, isEmptyMove, moveRecipe, type MoveOrigin } from '@/domain/editing';
import { panBy, type Vec2 } from '@/domain/geometry';
import { movePointRecipe } from '@/domain/points';
import { labelOffsetRecipe, topologyRecipe } from '@/domain/rooms';
import { entitiesInRect, hitTest, liveSelection, sameRef } from '@/domain/selection';
import { snapToPlan } from '@/domain/snap';
import type { Project } from '@/domain/types';
import { moveWall } from '@/domain/wallEdits';
import { useEditorStore } from '@/store/editorStore';
import { selectCurrentProject, useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { topoOpts } from '../actions';
import { decorationK, PICK_PX, pointRadiusWorld } from '../canvas/decoration';
import {
  commitSketch,
  createRoom,
  createWall,
  placeOpening,
  placeSymbolAt,
  symbolTarget,
} from '../drawActions';
import type { ToolContext } from '../tools/types';

let dragCounter = 0;

type Drag =
  | { kind: 'group'; origin: MoveOrigin }
  | { kind: 'wall'; wallId: string; base: Project }
  | { kind: 'label'; roomId: string; start: Vec2 }
  | { kind: 'point'; pointId: string; base: Project; start: Vec2; pick: number };

/** Tool context backed by the stores (always reads the latest state — no stale closures). */
export function createToolContext(): ToolContext {
  const proj = () => selectCurrentProject(useProjectStore.getState());
  const ed = () => useEditorStore.getState();
  const scale = () => ed().viewport?.scale ?? 1;
  const grid = (p: Project) => (p.settings.snapToGrid ? p.settings.gridSize : 0);
  let drag: Drag | null = null;
  let dragKey = '';

  return {
    hit: (p) => {
      const project = proj();
      if (!project) return null;
      const s = scale();
      return hitTest(project, p.world, {
        tolerance: PICK_PX[p.pointerType] / s,
        pointRadius: pointRadiusWorld(s),
        labelSize: 19 * decorationK(s),
      });
    },
    selection: () => {
      const project = proj();
      return project ? liveSelection(project, ed().selection) : [];
    },
    select: (sel) => {
      const project = proj();
      if (project) ed().select(project, sel);
    },
    entitiesIn: (r) => {
      const project = proj();
      return project ? entitiesInRect(project, r) : [];
    },
    setMarquee: (r) => ed().setMarquee(r),

    beginMove: (hit) => {
      const project = proj();
      if (!project) return false;
      dragKey = `move-${++dragCounter}`;
      if (hit.part === 'label') {
        const room = project.rooms.find((r) => r.id === hit.id)!;
        drag = { kind: 'label', roomId: room.id, start: { ...room.labelOffset } };
        return true;
      }
      const sel = liveSelection(project, ed().selection);
      if (hit.kind === 'point' && sel.length === 1 && sameRef(sel[0]!, hit)) {
        const pt = project.points.find((x) => x.id === hit.id)!;
        drag = {
          kind: 'point',
          pointId: pt.id,
          base: project,
          start: { x: pt.x, y: pt.y },
          pick: 24 / scale(),
        };
        return true;
      }
      if (hit.kind === 'wall' && sel.length === 1 && sameRef(sel[0]!, hit)) {
        drag = { kind: 'wall', wallId: hit.id, base: project };
        return true;
      }
      const origin = captureMoveOrigin(project, sel);
      if (isEmptyMove(origin)) {
        drag = null;
        return false;
      }
      drag = { kind: 'group', origin };
      return true;
    },
    moveTo: (delta, free = false) => {
      const project = proj();
      if (!drag || !project) return;
      const store = useProjectStore.getState();
      const now = new Date().toISOString();
      if (drag.kind === 'point') {
        const at = { x: drag.start.x + delta.x, y: drag.start.y + delta.y };
        store.apply(
          'Nuqtani siljitish',
          movePointRecipe(drag.base, drag.pointId, at, { tolerance: drag.pick, free }, now),
          dragKey,
        );
      } else if (drag.kind === 'label') {
        const off = { x: drag.start.x + delta.x, y: drag.start.y + delta.y };
        store.apply('Nom joyi', labelOffsetRecipe(drag.roomId, off, now), dragKey);
      } else if (drag.kind === 'wall') {
        const next = moveWall(drag.base, drag.wallId, delta, grid(drag.base), topoOpts());
        store.apply('Devorni surish', topologyRecipe(next), dragKey);
      } else {
        store.apply('Siljitish', moveRecipe(drag.origin, delta, grid(project), now), dragKey);
      }
    },
    endMove: () => {
      drag = null;
      useProjectStore.getState().seal();
      const project = proj();
      if (project) ed().select(project, liveSelection(project, ed().selection));
    },
    panBy: (dx, dy) => {
      const vp = ed().viewport;
      if (vp) ed().setViewport(panBy(vp, dx, dy));
    },
    doubleTap: (hit) => {
      if (hit.kind === 'room') useUiStore.getState().requestRename(hit.id);
    },

    snap: (p, from) => {
      const project = proj();
      if (!project) return p.world;
      // corners attract within 14 px, but never less than ~half a grid cell (rooms line up even when zoomed in)
      const g = grid(project);
      return snapToPlan(project, p.world, { tolerance: Math.max(14 / scale(), g * 0.6), grid: g, from })
        .point;
    },
    px: (n) => n / scale(),
    setDraft: (d) => ed().setDraft(d),
    setHover: (h) => ed().setHover(h),
    createRoom,
    createWall,
    commitSketch: (stroke) => commitSketch(stroke),
    placeOpening: (p, kind) => placeOpening(p.world, scale(), PICK_PX[p.pointerType], kind),
    activeSymbol: () => ed().activeSymbolId,
    symbolPreview: (p) => {
      const symbolId = ed().activeSymbolId;
      const t = symbolTarget(p.world, PICK_PX[p.pointerType], p.shift);
      if (!t) return { kind: 'symbol', symbolId, at: p.world, rotation: 0, valid: false };
      return {
        kind: 'symbol',
        symbolId,
        at: t.pos,
        rotation: t.kind === 'wall' ? t.rotation : 0,
        valid: true,
      };
    },
    placeSymbol: (p) => placeSymbolAt(p.world, PICK_PX[p.pointerType], p.shift),
  };
}
