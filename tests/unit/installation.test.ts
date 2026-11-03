import { describe, expect, it } from 'vitest';
import { applyRecipe, emptyHistory, record, undo } from '@/domain/history';
import {
  advance,
  nextOpenPoint,
  pointHistory,
  roomProgress,
  setStatusRecipe,
  workOrder,
} from '@/domain/installation';
import { ProjectSchema } from '@/domain/schemas';
import { buildDemoProject } from '@/features/dashboard/demoProject';

const T = '2026-11-03T12:00:00.000Z';
const demo = buildDemoProject();

describe('installation', () => {
  it('sets status and logs who/when (from → to); unchanged is a no-op', () => {
    const p = demo.points.find((x) => x.status === 'pending')!;
    const r = applyRecipe(demo, 'status', setStatusRecipe(p.id, 'in_progress', 't1', T));
    const np = r.next.points.find((x) => x.id === p.id)!;
    expect(np).toMatchObject({ status: 'in_progress', statusChangedAt: T });
    expect(r.next.installLog).toEqual([
      { id: 't1', pointId: p.id, userId: null, fromStatus: 'pending', toStatus: 'in_progress', createdAt: T },
    ]);
    expect(applyRecipe(r.next, 'same', setStatusRecipe(p.id, 'in_progress', 't2', T)).entry).toBeNull();
    expect(ProjectSchema.safeParse(r.next).success).toBe(true);
    expect(undo(r.next, record(emptyHistory(), r.entry!))!.state).toEqual(demo);
  });

  it('advance: pending → in progress → completed', () => {
    expect(advance('pending')).toBe('in_progress');
    expect(advance('in_progress')).toBe('completed');
    expect(advance('completed')).toBe('completed');
  });

  it('room progress sums to the project progress', () => {
    const rp = roomProgress(demo);
    expect(rp.map((r) => r.room.name)).toEqual(['Zal', 'Yotoqxona', 'Oshxona', 'Vanna', 'Balkon', 'Koridor']);
    expect(rp.reduce((n, r) => n + r.total, 0)).toBe(30);
    expect(rp.reduce((n, r) => n + r.completed, 0)).toBe(21);
    expect(rp.find((r) => r.room.name === 'Balkon')!.percent).toBe(0);
  });

  it('work order: rooms in list order, wall points before ceiling points, by distance', () => {
    const zal = demo.rooms[0]!;
    const order = workOrder(demo, zal.id);
    expect(order.at(-1)!.wallId).toBeNull();
    const west = order.filter((x) => x.wallId === order[0]!.wallId).map((x) => x.distanceFromCornerCm);
    expect(west).toEqual([...west].sort((a, b) => a! - b!));
    expect(workOrder(demo, null, true).every((x) => x.status !== 'completed')).toBe(true);
  });

  it('next open point walks forward and wraps; null when everything is done', () => {
    const first = nextOpenPoint(demo, null)!;
    expect(first.status).not.toBe('completed');
    const second = nextOpenPoint(demo, first.id)!;
    expect(second.id).not.toBe(first.id);
    const done = { ...demo, points: demo.points.map((x) => ({ ...x, status: 'completed' as const })) };
    expect(nextOpenPoint(done, null)).toBeNull();
    const balkon = demo.rooms.find((r) => r.name === 'Balkon')!;
    expect(nextOpenPoint(demo, null, balkon.id)!.roomId).toBe(balkon.id);
  });

  it('history per point, newest first', () => {
    const p = demo.points[0]!;
    let doc = applyRecipe(demo, 'a', setStatusRecipe(p.id, 'pending', 'a', '2026-11-03T10:00:00.000Z')).next;
    doc = applyRecipe(doc, 'b', setStatusRecipe(p.id, 'completed', 'b', '2026-11-03T11:00:00.000Z')).next;
    expect(pointHistory(doc, p.id).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('older saved projects without a log still load', () => {
    const { installLog: _drop, ...old } = demo;
    void _drop;
    const r = ProjectSchema.safeParse(old);
    expect(r.success && r.data.installLog).toEqual([]);
  });
});
