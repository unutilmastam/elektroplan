import { rayToSurface, type Scene3D } from '@/domain/house3d';
import { uuidv7 } from '@/domain/ids';
import { addPointRecipe } from '@/domain/points';
import { hitScene, newFixturePoint } from '@/domain/room3dEdit';
import type { Project, SymbolId } from '@/domain/types';
import { SYMBOLS } from '@/features/symbols';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { ray, type Cam } from './camera';

/** PHASE 25 — a tap in 3D with a symbol picked: the socket / switch / lamp goes where the finger points. */
export function placeFixture3D(
  project: Project,
  scene: Scene3D,
  symbolId: SymbolId,
  cam: Cam,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const d = ray(cam, x, y, w, h);
  const ceiling = SYMBOLS[symbolId].placement === 'ceiling';
  const hit = hitScene(project, cam.eye, d, ceiling);
  // only what you can see: not a wall behind another wall
  const seen = hit && hit.dist <= rayToSurface(scene.quads, cam.eye, d) + 3;
  const point =
    hit && seen
      ? newFixturePoint(project, symbolId, SYMBOLS[symbolId], hit, uuidv7(), new Date().toISOString())
      : null;
  if (!point) {
    useUiStore.getState().notify(ceiling ? uz.room3d.placeCeiling : uz.room3d.placeWall);
    return;
  }
  useProjectStore.getState().apply(uz.symbols[symbolId], addPointRecipe(point));
}
