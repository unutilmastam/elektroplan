import { describe, expect, it } from 'vitest';
import { computeProgress } from '@/domain/progress';
import { pickDefaultWallId, selectRoomStats, selectWallElevation } from '@/domain/selectors';
import { buildDemoProject, DEMO_SELECTED_POINT_ID } from '@/features/dashboard/demoProject';

describe('demo project + selectors', () => {
  const project = buildDemoProject();

  it('builds a consistent reference house', () => {
    expect(project.rooms.map((r) => r.name)).toEqual([
      'Zal',
      'Yotoqxona',
      'Oshxona',
      'Vanna',
      'Balkon',
      'Koridor',
    ]);
    expect(project.points.find((p) => p.id === DEMO_SELECTED_POINT_ID)).toMatchObject({
      mountHeightCm: 30,
      distanceFromCornerCm: 120,
      description: 'Televizor uchun',
    });
    for (const p of project.points)
      if (p.wallId) expect(project.walls.some((w) => w.id === p.wallId)).toBe(true);
  });

  it('reports 70% progress like the reference', () => {
    expect(computeProgress(project.points).percent).toBe(70);
  });

  it('counts points per room in list order', () => {
    const stats = selectRoomStats(project);
    expect(stats[0]).toMatchObject({ room: { name: 'Zal' }, pointCount: 7 });
    expect(stats.reduce((n, s) => n + s.pointCount, 0)).toBe(project.points.length);
  });

  it('picks the busiest wall and builds its elevation', () => {
    const zal = project.rooms[0]!;
    const wallId = pickDefaultWallId(project, zal.id)!;
    const el = selectWallElevation(project, wallId, zal.id)!;
    expect(el.direction).toBe('west');
    expect(el.points.map((p) => Math.round(p.distance))).toEqual([60, 120, 150, 200]);
    expect(selectWallElevation(project, 'missing')).toBeNull();
  });
});
