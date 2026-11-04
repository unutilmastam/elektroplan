import { describe, expect, it } from 'vitest';
import { mergeProjects } from '@/domain/merge';
import { reconcile } from '@/domain/topology';
import { ProjectSchema } from '@/domain/schemas';
import type { ElectricalPoint, Project, Room } from '@/domain/types';

const T = (m: number) => `2026-11-04T10:${String(m).padStart(2, '0')}:00.000Z`;
let n = 0;
const opts = { topology: { makeId: () => `gen-${++n}`, now: T(59) } };

const room = (id: string, x: number, at = T(0)): Room => ({
  id,
  name: id,
  color: '#0d1628',
  shape: 'rect',
  vertices: [
    { x, y: 0 },
    { x: x + 300, y: 0 },
    { x: x + 300, y: 200 },
    { x, y: 200 },
  ],
  labelOffset: { x: 0, y: 0 },
  order: 0,
  createdAt: at,
  updatedAt: at,
  deletedAt: null,
});

const point = (id: string, roomId: string, patch: Partial<ElectricalPoint> = {}): ElectricalPoint => ({
  id,
  symbolId: 'socket-single',
  roomId,
  wallId: null,
  t: null,
  side: 1,
  x: 50,
  y: 50,
  mountHeightCm: 30,
  distanceFromCornerCm: null,
  description: '',
  color: '#3b8bff',
  label: null,
  status: 'pending',
  statusChangedAt: null,
  createdAt: T(0),
  updatedAt: T(0),
  deletedAt: null,
  ...patch,
});

function baseProject(): Project {
  const rooms = [room('rA', 0)];
  const topo = reconcile(
    { rooms, walls: [], points: [], openings: [] },
    { makeId: () => `w${++n}`, now: T(0) },
  );
  return {
    id: 'p1',
    ownerId: 'u1',
    name: 'Uy',
    customerName: 'Aziz',
    address: 'Toshkent',
    revision: 3,
    rooms: topo.rooms,
    walls: topo.walls,
    points: [point('p1', 'rA'), point('p2', 'rA', { x: 80 })],
    openings: [],
    installLog: [],
    settings: {
      gridSize: 20,
      snapToGrid: true,
      defaultSocketHeightCm: 30,
      defaultSwitchHeightCm: 90,
      wallDisplayHeightCm: 270,
    },
    createdAt: T(0),
    updatedAt: T(0),
    deletedAt: null,
  };
}

const edit = (p: Project, f: (d: Project) => void, at: string): Project => {
  const d = structuredClone(p);
  f(d);
  d.updatedAt = at;
  return d;
};
const pt = (p: Project, id: string) => p.points.find((x) => x.id === id)!;

describe('mergeProjects — no conflict', () => {
  it('identical versions: takes the server revision', () => {
    const b = baseProject();
    const r = mergeProjects(b, b, { ...b, revision: 9 }, opts);
    expect(r.project.revision).toBe(9);
    expect(r.conflicts).toEqual([]);
  });

  it('only local changed -> local kept; only remote changed -> remote kept', () => {
    const b = baseProject();
    const local = edit(b, (d) => (d.name = 'Yangi nom'), T(5));
    const remote = edit(b, (d) => (pt(d, 'p1').description = 'kabel 3x2.5'), T(6));
    const r = mergeProjects(b, local, { ...remote, revision: 4 }, opts);
    expect(r.project.name).toBe('Yangi nom');
    expect(pt(r.project, 'p1').description).toBe('kabel 3x2.5');
    expect(r.project.revision).toBe(4);
    expect(r.project.updatedAt).toBe(T(6));
    expect(r.conflicts).toEqual([]);
    expect(ProjectSchema.safeParse(r.project).success).toBe(true);
  });

  it('different fields of the same point edited on two devices: both edits kept', () => {
    const b = baseProject();
    const local = edit(b, (d) => Object.assign(pt(d, 'p1'), { mountHeightCm: 110, updatedAt: T(3) }), T(3));
    const remote = edit(
      b,
      (d) => Object.assign(pt(d, 'p1'), { description: 'TV ostida', updatedAt: T(4) }),
      T(4),
    );
    const p = pt(mergeProjects(b, local, remote, opts).project, 'p1');
    expect(p).toMatchObject({ mountHeightCm: 110, description: 'TV ostida', updatedAt: T(4) });
  });

  it('points / rooms added on each side are all kept (ids are uuids, never clash)', () => {
    const b = baseProject();
    const local = edit(
      b,
      (d) => d.points.push(point('L1', 'rA', { createdAt: T(2), updatedAt: T(2) })),
      T(2),
    );
    const remote = edit(
      b,
      (d) => d.points.push(point('R1', 'rA', { createdAt: T(3), updatedAt: T(3) })),
      T(3),
    );
    const ids = mergeProjects(b, local, remote, opts).project.points.map((p) => p.id);
    expect(ids.sort()).toEqual(['L1', 'R1', 'p1', 'p2']);
  });

  it('settings: field-level three-way', () => {
    const b = baseProject();
    const local = edit(b, (d) => (d.settings.defaultSocketHeightCm = 40), T(2));
    const remote = edit(b, (d) => (d.settings.gridSize = 10), T(3));
    expect(mergeProjects(b, local, remote, opts).project.settings).toMatchObject({
      defaultSocketHeightCm: 40,
      gridSize: 10,
    });
  });
});

describe('mergeProjects — conflicts', () => {
  it('same field changed on both: last writer (entity updatedAt) wins and is reported', () => {
    const b = baseProject();
    const local = edit(b, (d) => Object.assign(pt(d, 'p1'), { mountHeightCm: 110, updatedAt: T(8) }), T(8));
    const remote = edit(b, (d) => Object.assign(pt(d, 'p1'), { mountHeightCm: 60, updatedAt: T(4) }), T(4));
    const r = mergeProjects(b, local, remote, opts);
    expect(pt(r.project, 'p1').mountHeightCm).toBe(110);
    expect(r.conflicts).toEqual([{ entity: 'point', id: 'p1', fields: ['mountHeightCm'] }]);
    // reversed timing -> server value
    const r2 = mergeProjects(
      b,
      { ...local, points: local.points.map((p) => ({ ...p, updatedAt: T(1) })) },
      remote,
      opts,
    );
    expect(pt(r2.project, 'p1').mountHeightCm).toBe(60);
  });

  it('equal timestamps: the server wins (deterministic on every device)', () => {
    const b = baseProject();
    const local = edit(b, (d) => (d.name = 'A'), T(5));
    const remote = edit(b, (d) => (d.name = 'B'), T(5));
    expect(mergeProjects(b, local, remote, opts).project.name).toBe('B');
  });

  it('installation status never goes backwards, even when the older edit marked it done', () => {
    const b = baseProject();
    const done = edit(
      b,
      (d) => Object.assign(pt(d, 'p1'), { status: 'completed', statusChangedAt: T(2), updatedAt: T(2) }),
      T(2),
    );
    const later = edit(
      b,
      (d) => Object.assign(pt(d, 'p1'), { status: 'in_progress', statusChangedAt: T(7), updatedAt: T(7) }),
      T(7),
    );
    for (const [l, r] of [
      [done, later],
      [later, done],
    ] as const) {
      const p = pt(mergeProjects(b, l, r, opts).project, 'p1');
      expect(p.status).toBe('completed');
      expect(p.statusChangedAt).toBe(T(2));
    }
  });

  it('status: one device sets it back on purpose without a conflict -> allowed (correction)', () => {
    const b = edit(baseProject(), (d) => Object.assign(pt(d, 'p1'), { status: 'completed' }), T(1));
    const local = edit(b, (d) => Object.assign(pt(d, 'p1'), { status: 'pending', updatedAt: T(3) }), T(3));
    expect(pt(mergeProjects(b, local, b, opts).project, 'p1').status).toBe('pending');
  });

  it('first sync without a common base: status max, other fields LWW', () => {
    const b = baseProject();
    const local = edit(
      b,
      (d) => Object.assign(pt(d, 'p1'), { status: 'completed', description: 'old', updatedAt: T(2) }),
      T(2),
    );
    const remote = edit(b, (d) => Object.assign(pt(d, 'p1'), { description: 'new', updatedAt: T(5) }), T(5));
    const p = pt(mergeProjects(null, local, remote, opts).project, 'p1');
    expect(p).toMatchObject({ status: 'completed', description: 'new' });
  });

  it('deleted on one device, untouched on the other -> deleted', () => {
    const b = baseProject();
    const local = edit(b, (d) => Object.assign(pt(d, 'p2'), { deletedAt: T(4), updatedAt: T(4) }), T(4));
    const remote = edit(b, (d) => (d.name = 'x'), T(6));
    expect(pt(mergeProjects(b, local, remote, opts).project, 'p2').deletedAt).toBe(T(4));
  });

  it('deleted on one device, edited LATER on the other -> edit wins (point comes back)', () => {
    const b = baseProject();
    const local = edit(b, (d) => Object.assign(pt(d, 'p2'), { deletedAt: T(4), updatedAt: T(4) }), T(4));
    const remote = edit(
      b,
      (d) => Object.assign(pt(d, 'p2'), { description: 'kerak', updatedAt: T(9) }),
      T(9),
    );
    const p = pt(mergeProjects(b, local, remote, opts).project, 'p2');
    expect(p).toMatchObject({ deletedAt: null, description: 'kerak' });
  });

  it('edited on one device, deleted LATER on the other -> newer deletion wins', () => {
    const b = baseProject();
    const local = edit(b, (d) => Object.assign(pt(d, 'p2'), { description: 'x', updatedAt: T(2) }), T(2));
    const remote = edit(b, (d) => Object.assign(pt(d, 'p2'), { deletedAt: T(8), updatedAt: T(8) }), T(8));
    expect(pt(mergeProjects(b, local, remote, opts).project, 'p2').deletedAt).toBe(T(8));
  });

  it('deleted on both -> earliest deletion time', () => {
    const b = baseProject();
    const local = edit(b, (d) => Object.assign(pt(d, 'p2'), { deletedAt: T(4), updatedAt: T(4) }), T(4));
    const remote = edit(b, (d) => Object.assign(pt(d, 'p2'), { deletedAt: T(6), updatedAt: T(6) }), T(6));
    expect(pt(mergeProjects(b, local, remote, opts).project, 'p2').deletedAt).toBe(T(4));
  });

  it('whole project deleted on one device but worked on later on the other -> kept', () => {
    const b = baseProject();
    const local = edit(b, (d) => (d.deletedAt = T(3)), T(3));
    const remote = edit(b, (d) => (d.address = 'Samarqand'), T(7));
    const r = mergeProjects(b, local, remote, opts).project;
    expect(r).toMatchObject({ deletedAt: null, address: 'Samarqand' });
  });

  it('installation log: union of both devices, in time order, no duplicates', () => {
    const b = baseProject();
    const task = (id: string, at: string) => ({
      id,
      pointId: 'p1',
      userId: null,
      fromStatus: 'pending' as const,
      toStatus: 'completed' as const,
      createdAt: at,
    });
    const shared = task('t0', T(1));
    const local = edit(b, (d) => d.installLog.push(shared, task('tL', T(5))), T(5));
    const remote = edit(b, (d) => d.installLog.push(shared, task('tR', T(3))), T(3));
    expect(mergeProjects(b, local, remote, opts).project.installLog.map((t) => t.id)).toEqual([
      't0',
      'tR',
      'tL',
    ]);
  });

  it('openings: added on both kept; removed on one and untouched on the other -> removed', () => {
    const o = (id: string, t = 0.5) => ({
      id,
      wallId: 'w',
      kind: 'door' as const,
      t,
      width: 80,
      swing: 1 as const,
    });
    const b = edit(baseProject(), (d) => d.openings.push(o('o1'), o('o2')), T(1));
    const local = edit(b, (d) => (d.openings = [o('o2'), o('oL')]), T(3)); // removed o1, added oL
    const remote = edit(b, (d) => (d.openings = [o('o1'), o('o2', 0.3), o('oR')]), T(4)); // moved o2, added oR
    const ids = mergeProjects(b, local, remote, opts).project.openings;
    expect(ids.map((x) => x.id).sort()).toEqual(['o2', 'oL', 'oR']);
    expect(ids.find((x) => x.id === 'o2')!.t).toBe(0.3);
  });

  it('openings: removed on one side but moved on the other -> the change is kept', () => {
    const o = (t: number) => ({
      id: 'o1',
      wallId: 'w',
      kind: 'window' as const,
      t,
      width: 80,
      swing: 1 as const,
    });
    const b = edit(baseProject(), (d) => d.openings.push(o(0.5)), T(1));
    const local = edit(b, (d) => (d.openings = []), T(3));
    const remote = edit(b, (d) => (d.openings = [o(0.2)]), T(4));
    expect(mergeProjects(b, local, remote, opts).project.openings).toEqual([o(0.2)]);
  });

  it('both devices drew rooms: walls are rebuilt so every room has its walls', () => {
    const b = baseProject();
    const local = edit(b, (d) => d.rooms.push(room('rL', 300, T(2))), T(2));
    const remote = edit(b, (d) => d.rooms.push(room('rR', -300, T(3))), T(3));
    const r = mergeProjects(b, local, remote, opts).project;
    expect(r.rooms.map((x) => x.id).sort()).toEqual(['rA', 'rL', 'rR']);
    const live = r.walls.filter((w) => w.deletedAt === null);
    for (const id of ['rA', 'rL', 'rR']) expect(live.filter((w) => w.roomIds.includes(id)).length).toBe(4);
    // shared walls between the neighbours
    expect(live.filter((w) => w.roomIds.length === 2)).toHaveLength(2);
    expect(ProjectSchema.safeParse(r).success).toBe(true);
  });

  it('merge is order-independent for disjoint edits (same result on iPad and phone)', () => {
    const b = baseProject();
    const ipad = edit(b, (d) => Object.assign(pt(d, 'p1'), { label: 'A1', updatedAt: T(2) }), T(2));
    const phone = edit(b, (d) => Object.assign(pt(d, 'p2'), { status: 'completed', updatedAt: T(3) }), T(3));
    const x = mergeProjects(b, ipad, phone, opts).project;
    const y = mergeProjects(b, phone, ipad, opts).project;
    expect(x.points).toEqual(y.points);
  });

  it('keeps the server owner when the local copy had none (project attached to an account)', () => {
    const b = { ...baseProject(), ownerId: null };
    const remote = { ...edit(b, (d) => (d.name = 'S'), T(2)), ownerId: 'u9' };
    expect(mergeProjects(b, b, remote, opts).project.ownerId).toBe('u9');
  });
});
