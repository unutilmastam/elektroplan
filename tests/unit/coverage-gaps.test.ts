import { describe, expect, it } from 'vitest';
import { LoginFormSchema, normalizeLogin, RegisterFormSchema } from '@/domain/auth';
import { mergeProjects } from '@/domain/merge';
import { createEmptyProject } from '@/domain/project';
import { filterAndSortProjects } from '@/domain/projectList';
import { snapToPlan } from '@/domain/snap';
import { reconcile } from '@/domain/topology';
import type { ElectricalPoint, Project, Room, Vec2 } from '@/domain/types';
import { deleteWalls } from '@/domain/wallEdits';

/** PHASE 13: edge cases that the feature tests did not reach (domain coverage ≥ 90 %). */
const NOW = '2026-11-04T00:00:00.000Z';
let n = 0;
const opts = { makeId: () => `c${++n}`, now: NOW };
const v = (x: number, y: number): Vec2 => ({ x, y });
const room = (id: string, vs: Vec2[], order = 0): Room => ({
  id,
  name: id,
  color: '#0d1628',
  shape: 'polygon',
  vertices: vs,
  labelOffset: v(0, 0),
  order,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
});
const build = (rooms: Room[], extra: Partial<Project> = {}): Project => {
  const p = { ...createEmptyProject('p', 'T', NOW), rooms, ...extra };
  return { ...p, ...reconcile(p, opts) };
};
const live = (p: Project) => p.walls.filter((w) => w.deletedAt === null);

describe('auth: login normalisation (mirrors server/lib/Auth.php)', () => {
  it.each([
    ['+998 90 123-45-67', '+998901234567'],
    ['901234567', '+998901234567'],
    ['(90) 123 45 67', '+998901234567'],
    ['+7 916 000 11 22', '+79160001122'],
  ])('phone %s', (raw, value) => expect(normalizeLogin(raw)).toEqual({ kind: 'phone', value }));
  it('email is lower-cased; junk is refused', () => {
    expect(normalizeLogin('  Usta@Mail.UZ ')).toEqual({ kind: 'email', value: 'usta@mail.uz' });
    for (const bad of ['12345', 'a@b', '@x.uz', '', '+1234567890123456'])
      expect(normalizeLogin(bad)).toBeNull();
  });
  it('form schemas report Uzbek error codes', () => {
    const r = RegisterFormSchema.safeParse({ name: ' ', login: 'x', password: '123' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.map((i) => i.message).sort()).toEqual([
        'login_invalid',
        'name_required',
        'password_short',
      ]);
    expect(LoginFormSchema.safeParse({ login: '901234567', password: '12345678' }).success).toBe(true);
  });
});

describe('snapToPlan', () => {
  const p = build([room('A', [v(0, 0), v(300, 0), v(300, 200), v(0, 200)])]);
  it('corner first, then a wall (sliding to the grid on an axis-aligned wall)', () => {
    expect(snapToPlan(p, v(3, 4), { tolerance: 10, grid: 20 })).toEqual({ point: v(0, 0), kind: 'corner' });
    expect(snapToPlan(p, v(147, 5), { tolerance: 10, grid: 20 })).toEqual({ point: v(140, 0), kind: 'wall' });
    expect(snapToPlan(p, v(296, 93), { tolerance: 10, grid: 20 })).toEqual({
      point: v(300, 100),
      kind: 'wall',
    });
    // near the wall end the grid slide lands on the corner
    expect(snapToPlan(p, v(9, 192), { tolerance: 12, grid: 20 }).kind).toBe('corner');
  });
  it('angle snapping from the previous point: lines up with an existing corner, else 45° on the grid', () => {
    const from = v(400, 300);
    const horiz = snapToPlan(p, v(302, 303), { tolerance: 10, grid: 20, from });
    expect(horiz).toEqual({ point: v(300, 300), kind: 'angle' }); // x of the room corner
    const vert = snapToPlan(p, v(403, 213), { tolerance: 10, grid: 20, from });
    expect(vert.kind).toBe('angle');
    expect(vert.point.x).toBe(400);
    const diag = snapToPlan(p, v(462, 363), { tolerance: 10, grid: 20, from });
    expect(diag).toEqual({ point: v(460, 360), kind: 'angle' });
  });
  it('no grid -> free; grid but nothing near -> grid', () => {
    expect(snapToPlan(p, v(613, 517), { tolerance: 5, grid: 0 })).toEqual({
      point: v(613, 517),
      kind: 'free',
    });
    expect(snapToPlan(p, v(613, 517), { tolerance: 5, grid: 20 })).toEqual({
      point: v(620, 520),
      kind: 'grid',
    });
    expect(snapToPlan(p, v(150, 3), { tolerance: 10, grid: 0 })).toEqual({ point: v(150, 0), kind: 'wall' });
  });
});

describe('deleteWalls: edge cases', () => {
  it('rooms touching along two walls (L-shape neighbour) are not merged automatically', () => {
    const A = room('A', [v(0, 0), v(300, 0), v(300, 100), v(200, 100), v(200, 200), v(0, 200)], 0);
    const B = room('B', [v(300, 0), v(400, 0), v(400, 200), v(200, 200), v(200, 100), v(300, 100)], 1);
    const p = build([A, B]);
    const shared = live(p).filter((w) => w.roomIds.length === 2);
    expect(shared.length).toBeGreaterThanOrEqual(2);
    expect(deleteWalls(p, [shared[0]!.id], opts)).toEqual({ ok: false, reason: 'complex' });
  });

  it('merging rooms drawn in opposite directions; points of the removed room move over', () => {
    const A = room('A', [v(0, 0), v(300, 0), v(300, 200), v(0, 200)], 0);
    const B = room('B', [v(300, 200), v(500, 200), v(500, 0), v(300, 0)], 1); // clockwise the other way
    const base = build([A, B]);
    const shared = live(base).find((w) => w.roomIds.length === 2)!;
    const pt: ElectricalPoint = {
      id: 'pt',
      symbolId: 'switch-single',
      roomId: 'B',
      wallId: shared.id,
      t: 0.5,
      side: 1,
      x: 310,
      y: 100,
      mountHeightCm: 90,
      distanceFromCornerCm: 100,
      description: '',
      color: '#ef4444',
      label: null,
      status: 'pending',
      statusChangedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    const withPt = {
      ...base,
      points: [pt],
      openings: [{ id: 'o', wallId: shared.id, kind: 'door' as const, t: 0.5, width: 80, swing: 1 as const }],
    };
    const r = deleteWalls(withPt, [shared.id, 'missing-wall'], opts);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.project.rooms.filter((x) => x.deletedAt === null).map((x) => x.id)).toEqual(['A']);
    expect(r.project.points[0]).toMatchObject({ roomId: 'A', wallId: null, t: null });
    expect(r.project.openings).toEqual([]);
  });

  it('a free wall with a point and a door: the point stays (detached), the door goes', () => {
    const p = build([]);
    const free = {
      id: 'f',
      a: v(0, 0),
      b: v(200, 0),
      thickness: 12,
      roomIds: [],
      name: null,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    const pt = {
      id: 'p1',
      symbolId: 'socket-single' as const,
      roomId: 'r',
      wallId: 'f',
      t: 0.5,
      side: 1 as const,
      x: 100,
      y: 5,
      mountHeightCm: 30,
      distanceFromCornerCm: 100,
      description: '',
      color: '#3b8bff',
      label: null,
      status: 'pending' as const,
      statusChangedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    const r = deleteWalls(
      {
        ...p,
        walls: [free],
        points: [pt],
        openings: [{ id: 'o', wallId: 'f', kind: 'window', t: 0.5, width: 60, swing: 1 }],
      },
      ['f'],
      opts,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.project.points[0]).toMatchObject({ wallId: null, t: null });
    expect(r.project.openings).toEqual([]);
  });
});

describe('merge: openings and settings conflicts', () => {
  const base = {
    ...createEmptyProject('m', 'M', NOW),
    openings: [{ id: 'o', wallId: 'w', kind: 'door' as const, t: 0.5, width: 80, swing: 1 as const }],
  };
  it('door changed differently on both devices: the newer project wins, reported', () => {
    const local = {
      ...base,
      updatedAt: '2026-11-04T01:00:00.000Z',
      openings: [{ ...base.openings[0]!, t: 0.2 }],
    };
    const remote = {
      ...base,
      updatedAt: '2026-11-04T02:00:00.000Z',
      openings: [{ ...base.openings[0]!, width: 90 }],
    };
    const r = mergeProjects(base, local, remote, { topology: opts });
    expect(r.project.openings[0]).toMatchObject({ t: 0.5, width: 90 });
    expect(r.conflicts).toContainEqual({ entity: 'opening', id: 'o', fields: ['t', 'width'] });
    const r2 = mergeProjects(base, { ...local, updatedAt: '2026-11-04T03:00:00.000Z' }, remote, {
      topology: opts,
    });
    expect(r2.project.openings[0]!.t).toBe(0.2);
  });
  it('same setting changed on both: newer project wins; without a base the newer side wins too', () => {
    const local = {
      ...base,
      updatedAt: '2026-11-04T03:00:00.000Z',
      settings: { ...base.settings, gridSize: 10 },
    };
    const remote = {
      ...base,
      updatedAt: '2026-11-04T02:00:00.000Z',
      settings: { ...base.settings, gridSize: 50 },
    };
    expect(mergeProjects(base, local, remote, { topology: opts }).project.settings.gridSize).toBe(10);
    expect(mergeProjects(null, remote, local, { topology: opts }).project.settings.gridSize).toBe(10);
  });
});

describe('project list sorting', () => {
  const p = (id: string, name: string, at: string, done = 0) => ({
    ...createEmptyProject(id, name, at),
    points: Array.from({ length: 2 }, (_, i) => ({
      id: `${id}${i}`,
      symbolId: 'socket-single' as const,
      roomId: 'r',
      wallId: null,
      t: null,
      side: 1 as const,
      x: 0,
      y: 0,
      mountHeightCm: 30,
      distanceFromCornerCm: null,
      description: '',
      color: '#3b8bff',
      label: null,
      status: (i < done ? 'completed' : 'pending') as 'completed' | 'pending',
      statusChangedAt: null,
      createdAt: at,
      updatedAt: at,
      deletedAt: null,
    })),
  });
  it('ties fall back to the last change; progress sorts by percent', () => {
    const list = [
      p('a', 'Uy', '2026-11-01T00:00:00.000Z', 2),
      p('b', 'uy', '2026-11-03T00:00:00.000Z'),
      p('c', 'Ofis', '2026-11-02T00:00:00.000Z', 1),
    ];
    expect(filterAndSortProjects(list, '', 'name').map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(filterAndSortProjects(list, '', 'progress').map((x) => x.id)).toEqual(['a', 'c', 'b']);
    expect(filterAndSortProjects(list, '', 'created').map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
});
