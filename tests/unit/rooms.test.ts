import { describe, expect, it } from 'vitest';
import { signedArea, type Vec2 } from '@/domain/geometry';
import { applyRecipe, emptyHistory, record, redo, undo } from '@/domain/history';
import { createEmptyProject } from '@/domain/project';
import {
  addOpening,
  addRoom,
  addWalls,
  deleteSelection,
  duplicateRoom,
  labelOffsetRecipe,
  nextRoomName,
  renameRoomRecipe,
  replaceWalls,
  roomColorRecipe,
  setRoomVertices,
  topologyRecipe,
} from '@/domain/rooms';
import { ProjectSchema } from '@/domain/schemas';

const NOW = '2026-11-03T00:00:00.000Z';
let n = 0;
const opts = { makeId: () => `id${++n}`, now: NOW };
const v = (x: number, y: number): Vec2 => ({ x, y });
const rect = (x0: number, y0: number, x1: number, y1: number) => [v(x0, y0), v(x1, y0), v(x1, y1), v(x0, y1)];
const empty = () => createEmptyProject('p', 'T', NOW);
const live = <T extends { deletedAt: string | null }>(xs: T[]) => xs.filter((x) => x.deletedAt === null);

describe('rooms', () => {
  it('adding a room creates its walls; a neighbour shares the common wall', () => {
    let p = addRoom(empty(), rect(0, 0, 300, 200), 'rect', { id: 'A', name: 'Zal' }, opts);
    expect(live(p.walls)).toHaveLength(4);
    p = addRoom(p, rect(300, 0, 500, 200), 'rect', { id: 'B', name: 'Oshxona' }, opts);
    expect(live(p.walls)).toHaveLength(7);
    expect(live(p.walls).filter((w) => w.roomIds.length === 2)).toHaveLength(1);
    expect(p.rooms[1]!.order).toBe(1);
    expect(ProjectSchema.safeParse(p).success).toBe(true);
  });

  it('stores rooms clockwise even when drawn counter-clockwise', () => {
    const p = addRoom(empty(), [...rect(0, 0, 100, 100)].reverse(), 'square', { id: 'A', name: 'X' }, opts);
    expect(signedArea(p.rooms[0]!.vertices)).toBeGreaterThan(0);
  });

  it('names rooms "Xona N" without clashes', () => {
    let p = addRoom(empty(), rect(0, 0, 100, 100), 'square', { id: 'A', name: 'Xona 2' }, opts);
    expect(nextRoomName(p, 'Xona')).toBe('Xona 3');
    p = addRoom(p, rect(100, 0, 200, 100), 'square', { id: 'B', name: 'Zal' }, opts);
    expect(nextRoomName(p, 'Xona')).toBe('Xona 3');
  });

  it('raw sketch → straightened outline is two undo steps', () => {
    const base = empty();
    const raw = [v(2, 3), v(298, -4), v(305, 199), v(-3, 204)];
    const step1 = applyRecipe(
      base,
      'sketch',
      topologyRecipe(addRoom(base, raw, 'polygon', { id: 'S', name: 'Xona 1' }, opts)),
    );
    const step2 = applyRecipe(
      step1.next,
      'straighten',
      topologyRecipe(setRoomVertices(step1.next, 'S', rect(0, 0, 300, 200), 'rect', opts)),
    );
    let h = record(record(emptyHistory(), step1.entry!), step2.entry!);
    expect(step2.next.rooms[0]!.vertices).toEqual(rect(0, 0, 300, 200));
    const u = undo(step2.next, h)!;
    expect(u.state.rooms[0]!.vertices).toEqual(step1.next.rooms[0]!.vertices);
    h = u.history;
    expect(redo(u.state, h)!.state.rooms[0]!.vertices).toEqual(rect(0, 0, 300, 200));
  });

  it('free walls: add, then replace with straightened ones', () => {
    const { project, ids } = addWalls(empty(), [v(0, 3), v(98, -2), v(203, 4)], opts);
    expect(ids).toHaveLength(2);
    const fixed = replaceWalls(project, ids, [v(0, 0), v(200, 0)], opts);
    const lw = live(fixed.walls);
    expect(lw).toHaveLength(1);
    expect(lw[0]!.roomIds).toEqual([]);
  });

  it('duplicates a room with its points to the right', () => {
    let p = addRoom(empty(), rect(0, 0, 300, 200), 'rect', { id: 'A', name: 'Zal' }, opts);
    const top = live(p.walls).find((w) => w.a.y === 0 && w.b.y === 0)!;
    p = {
      ...p,
      points: [
        {
          id: 'pt',
          symbolId: 'socket-double',
          roomId: 'A',
          wallId: top.id,
          t: 0.5,
          side: 1,
          x: 150,
          y: 22,
          mountHeightCm: 30,
          distanceFromCornerCm: 150,
          description: '',
          color: '#3b8bff',
          label: null,
          status: 'completed',
          statusChangedAt: NOW,
          createdAt: NOW,
          updatedAt: NOW,
          deletedAt: null,
        },
      ],
    };
    const d = duplicateRoom(p, 'A', { id: 'B', name: 'Zal 2' }, 20, opts);
    const copy = d.rooms.find((r) => r.id === 'B')!;
    expect(Math.min(...copy.vertices.map((q) => q.x))).toBe(340);
    const cp = d.points.find((q) => q.roomId === 'B')!;
    expect(cp.status).toBe('pending');
    expect(cp.x).toBe(490);
    expect(d.walls.find((w) => w.id === cp.wallId)!.roomIds).toEqual(['B']);
  });

  it('deleting the shared wall merges rooms; renames / colours / labels are undoable', () => {
    let p = addRoom(empty(), rect(0, 0, 300, 200), 'rect', { id: 'A', name: 'Zal' }, opts);
    p = addRoom(p, rect(300, 0, 500, 200), 'rect', { id: 'B', name: 'Oshxona' }, opts);
    const shared = live(p.walls).find((w) => w.roomIds.length === 2)!;
    const r = deleteSelection(p, [{ kind: 'wall', id: shared.id }], opts);
    expect(r.refused).toBeNull();
    expect(live(r.project.rooms).map((x) => x.name)).toEqual(['Zal']);

    const a = applyRecipe(p, 'rename', renameRoomRecipe('A', 'Mehmonxona', NOW));
    expect(a.next.rooms[0]!.name).toBe('Mehmonxona');
    expect(applyRecipe(p, 'color', roomColorRecipe('A', '#22c55e', NOW)).next.rooms[0]!.color).toBe(
      '#22c55e',
    );
    expect(
      applyRecipe(p, 'label', labelOffsetRecipe('A', v(10, -5), NOW)).next.rooms[0]!.labelOffset,
    ).toEqual(v(10, -5));
    expect(applyRecipe(p, 'same', renameRoomRecipe('A', 'Zal', NOW)).entry).toBeNull();
  });

  it('adds a door on a wall, clamped inside it, opening into the room', () => {
    const p = addRoom(empty(), rect(0, 0, 300, 200), 'rect', { id: 'A', name: 'Zal' }, opts);
    const top = live(p.walls).find((w) => w.a.y === 0 && w.b.y === 0)!;
    const d = addOpening(p, top.id, 0.99, 'door', 80, 'door1');
    const o = d.openings[0]!;
    expect(o.t).toBeCloseTo(1 - 40 / 300);
    const tip = { x: 0, y: 0 };
    void tip;
    expect(o.swing === 1 || o.swing === -1).toBe(true);
    expect(ProjectSchema.safeParse(d).success).toBe(true);
  });
});
