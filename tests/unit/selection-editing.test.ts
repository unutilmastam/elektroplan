import { describe, expect, it } from 'vitest';
import { captureMoveOrigin, isEmptyMove, movableRoomIds, moveRecipe } from '@/domain/editing';
import { applyRecipe, emptyHistory, record, undo } from '@/domain/history';
import { deleteSelection, topologyRecipe } from '@/domain/rooms';
import {
  entitiesInRect,
  hitTest,
  liveSelection,
  mergeSelection,
  panelFocus,
  selectAll,
  toggleRef,
} from '@/domain/selection';
import { buildDemoProject } from '@/features/dashboard/demoProject';

const T = '2026-11-03T12:00:00.000Z';
const project = buildDemoProject();
const zal = project.rooms.find((r) => r.name === 'Zal')!;
const tvSocket = project.points.find((p) => p.description === 'Televizor uchun')!;
const opts = { tolerance: 4, pointRadius: 12 };

describe('selection helpers', () => {
  it('toggles and merges refs', () => {
    const a = { kind: 'room' as const, id: 'a' };
    const b = { kind: 'point' as const, id: 'b' };
    expect(toggleRef([a], b)).toEqual([a, b]);
    expect(toggleRef([a, b], a)).toEqual([b]);
    expect(mergeSelection([a], [a, b])).toEqual([a, b]);
  });

  it('hit-tests points before walls before rooms', () => {
    expect(hitTest(project, { x: tvSocket.x + 3, y: tvSocket.y }, opts)).toEqual({
      kind: 'point',
      id: tvSocket.id,
    });
    const wall = project.walls.find((w) => w.roomIds.includes(zal.id) && w.a.y === w.b.y)!;
    const mid = { x: (wall.a.x + wall.b.x) / 2, y: wall.a.y + 2 };
    expect(hitTest(project, mid, opts)).toEqual({ kind: 'wall', id: wall.id });
    const c = { x: zal.vertices[0]!.x + 100, y: zal.vertices[0]!.y + 120 };
    expect(hitTest(project, c, opts)).toEqual({ kind: 'room', id: zal.id });
    expect(hitTest(project, { x: -500, y: -500 }, opts)).toBeNull();
  });

  it('selects everything inside a marquee', () => {
    const all = selectAll(project);
    expect(all.filter((r) => r.kind === 'room')).toHaveLength(6);
    expect(all.filter((r) => r.kind === 'point')).toHaveLength(project.points.length);
    const xs = zal.vertices.map((v) => v.x);
    const ys = zal.vertices.map((v) => v.y);
    const inZal = entitiesInRect(project, {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    });
    expect(inZal.some((r) => r.kind === 'room' && r.id === zal.id)).toBe(true);
    expect(inZal.some((r) => r.kind === 'point' && r.id === tvSocket.id)).toBe(true);
  });

  it('derives panel focus from the selection', () => {
    expect(panelFocus(project, [{ kind: 'point', id: tvSocket.id }])).toEqual({
      pointId: tvSocket.id,
      roomId: zal.id,
      wallId: tvSocket.wallId,
    });
    const wall = project.walls.find((w) => w.id === tvSocket.wallId)!;
    expect(panelFocus(project, [{ kind: 'wall', id: wall.id }])).toEqual({
      pointId: null,
      roomId: zal.id,
      wallId: wall.id,
    });
    expect(panelFocus(project, [{ kind: 'room', id: zal.id }])).toEqual({
      pointId: null,
      roomId: zal.id,
      wallId: null,
    });
    expect(panelFocus(project, [])).toEqual({ pointId: null, roomId: null, wallId: null });
  });
});

describe('delete (undoable, topology-aware)', () => {
  let n = 0;
  const opts = { makeId: () => `new-${++n}`, now: T };
  const del = (sel: Parameters<typeof deleteSelection>[1]) => deleteSelection(project, sel, opts);

  it('deletes a point and undo restores it exactly', () => {
    const r = del([{ kind: 'point', id: tvSocket.id }]);
    const { next, entry } = applyRecipe(project, 'delete', topologyRecipe(r.project));
    expect(next.points.find((p) => p.id === tvSocket.id)!.deletedAt).toBe(T);
    expect(liveSelection(next, [{ kind: 'point', id: tvSocket.id }])).toEqual([]);
    expect(entry!.patches.length).toBeLessThan(5); // element-wise patches, not whole arrays
    expect(undo(next, record(emptyHistory(), entry!))!.state).toEqual(project);
  });

  it('deleting a room removes its points and private walls; shared walls stay for the neighbour', () => {
    const { project: next } = del([{ kind: 'room', id: zal.id }]);
    expect(next.rooms.find((r) => r.id === zal.id)!.deletedAt).toBe(T);
    expect(next.points.filter((p) => p.roomId === zal.id).every((p) => p.deletedAt === T)).toBe(true);
    const liveWalls = next.walls.filter((w) => w.deletedAt === null);
    expect(liveWalls.some((w) => w.roomIds.includes(zal.id))).toBe(false);
    const yotoq = project.rooms.find((r) => r.name === 'Yotoqxona')!;
    const shared = project.walls.find((w) => w.roomIds.includes(zal.id) && w.roomIds.includes(yotoq.id))!;
    expect(next.walls.find((w) => w.id === shared.id)!.deletedAt).toBeNull();
  });

  it('an outer wall cannot be deleted alone; a door can', () => {
    const r = del([{ kind: 'wall', id: tvSocket.wallId! }]);
    expect(r.refused).toBe('exterior');
    const door = project.openings[project.openings.length - 1]!;
    expect(del([{ kind: 'opening', id: door.id }]).project.openings).toHaveLength(
      project.openings.length - 1,
    );
  });
});

describe('move (undoable, coalesced)', () => {
  it('slides a wall point along its wall, keeping its inset', () => {
    const wall = project.walls.find((w) => w.id === tvSocket.wallId)!; // vertical Zal west wall
    const origin = captureMoveOrigin(project, [{ kind: 'point', id: tvSocket.id }]);
    const { next } = applyRecipe(project, 'move', moveRecipe(origin, { x: 300, y: -40 }, 20, T));
    const p = next.points.find((x) => x.id === tvSocket.id)!;
    expect(p.x).toBeCloseTo(tvSocket.x); // cannot leave the wall
    expect(p.y).toBeCloseTo(tvSocket.y - 40);
    expect(p.distanceFromCornerCm).toBe(Math.round(p.t! * Math.abs(wall.b.y - wall.a.y)));
  });

  it('refuses to tear one room out of shared walls, moves the whole plan rigidly with grid snap', () => {
    expect(movableRoomIds(project, [{ kind: 'room', id: zal.id }]).size).toBe(0);
    expect(isEmptyMove(captureMoveOrigin(project, [{ kind: 'room', id: zal.id }]))).toBe(true);
    const origin = captureMoveOrigin(project, selectAll(project));
    let doc = project;
    let h = emptyHistory();
    for (const dx of [3, 9, 27, 33]) {
      const { next, entry } = applyRecipe(doc, 'move', moveRecipe(origin, { x: dx, y: 0 }, 20, T), 'drag-1');
      doc = next;
      if (entry) h = record(h, entry);
    }
    expect(h.past).toHaveLength(1);
    expect(doc.rooms[0]!.vertices[0]!.x).toBe(project.rooms[0]!.vertices[0]!.x + 40);
    expect(doc.walls[0]!.a.x).toBe(project.walls[0]!.a.x + 40);
    expect(undo(doc, h)!.state).toEqual(project);
  });
});
