/**
 * Demo house used to compare the UI with docs/design/reference-dashboard.png.
 * Only reachable with `?demo=1` in development (or when NEXT_PUBLIC_ENABLE_DEMO=1).
 */
import { labelAnchor, polygonCentroid } from '@/domain/geometry';
import type { ElectricalPoint, Opening, Project, Room, Vec2, Wall } from '@/domain/types';
import { deriveWallsFromRooms, findWallByEndpoints, pointOnWall } from '@/domain/walls';
import { SYMBOLS } from '@/features/symbols/catalog';
import { LABELS, OPENING_SEEDS, POINT_SEEDS, ROOM_SEEDS, type Seg } from './demoSeeds';

const NOW = '2026-11-03T09:00:00.000Z';
const O = { x: 383, y: 223 };
const P = (x: number, y: number): Vec2 => ({ x: x - O.x, y: y - O.y });
const stamp = { createdAt: NOW, updatedAt: NOW, deletedAt: null };

function buildRooms(): Room[] {
  return ROOM_SEEDS.map(([id, name, vs], order) => {
    const vertices = vs.map(([x, y]) => P(x, y));
    const c = labelAnchor(vertices);
    const [lx, ly] = LABELS[id] ?? [0, 0];
    const label = P(lx, ly);
    return {
      id,
      name,
      color: '#0d1628',
      shape: vs.length === 4 ? 'rect' : 'polygon',
      vertices,
      labelOffset: { x: label.x - c.x, y: label.y - c.y },
      order,
      ...stamp,
    };
  });
}

const wallOf = (walls: Wall[], [ax, ay, bx, by]: Seg): Wall => {
  const w = findWallByEndpoints(walls, P(ax, ay), P(bx, by));
  if (!w) throw new Error(`demo wall not found ${ax},${ay}-${bx},${by}`);
  return w;
};

function inwardSide(wall: Wall, room: Room): 1 | -1 {
  const c = polygonCentroid(room.vertices);
  const plus = pointOnWall(wall, 0.5, 1, 10);
  const minus = pointOnWall(wall, 0.5, -1, 10);
  return Math.hypot(plus.x - c.x, plus.y - c.y) <= Math.hypot(minus.x - c.x, minus.y - c.y) ? 1 : -1;
}

function buildPoints(rooms: Room[], walls: Wall[]): ElectricalPoint[] {
  return POINT_SEEDS.map((seed, i): ElectricalPoint => {
    const room = rooms.find((r) => r.id === seed.room)!;
    const def = SYMBOLS[seed.symbol];
    const base = {
      id: seed.id ?? `p-${i + 1}`,
      symbolId: seed.symbol,
      roomId: room.id,
      description: seed.description ?? '',
      color: seed.color ?? def.defaultColor,
      label: null,
      status: seed.status,
      statusChangedAt: seed.status === 'pending' ? null : NOW,
      ...stamp,
    };
    if (!seed.wall) {
      const p = P(seed.at[0], seed.at[1]);
      return {
        ...base,
        wallId: null,
        t: null,
        side: 1,
        x: p.x,
        y: p.y,
        mountHeightCm: null,
        distanceFromCornerCm: null,
      };
    }
    const wall = wallOf(walls, seed.wall);
    const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
    const at = P(seed.at[0], seed.at[1]);
    const proj =
      ((at.x - wall.a.x) * (wall.b.x - wall.a.x) + (at.y - wall.a.y) * (wall.b.y - wall.a.y)) / (len * len);
    const t = seed.dist !== undefined ? seed.dist / len : Math.min(1, Math.max(0, proj));
    const side = inwardSide(wall, room);
    const pos = pointOnWall(wall, t, side, 22);
    return {
      ...base,
      wallId: wall.id,
      t,
      side,
      x: pos.x,
      y: pos.y,
      mountHeightCm: seed.height ?? def.defaultMountHeightCm,
      distanceFromCornerCm: Math.round(t * len),
    };
  });
}

function buildOpenings(rooms: Room[], walls: Wall[]): Opening[] {
  return OPENING_SEEDS.map(([kind, seg, [cx, cy], width, into], i) => {
    const wall = wallOf(walls, seg);
    const c = P(cx, cy);
    const len = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
    const t =
      ((c.x - wall.a.x) * (wall.b.x - wall.a.x) + (c.y - wall.a.y) * (wall.b.y - wall.a.y)) / (len * len);
    const away = into?.startsWith('!') ?? false;
    const room = rooms.find((r) => r.id === into?.replace('!', ''));
    const inward = room ? inwardSide(wall, room) : 1;
    return { id: `o-${i + 1}`, wallId: wall.id, kind, t, width, swing: away ? (-inward as 1 | -1) : inward };
  });
}

export const DEMO_SELECTED_POINT_ID = 'p-tv-socket';
export const DEMO_PROJECT_COUNT = 5;

export function buildDemoProject(): Project {
  const rooms = buildRooms();
  const walls = deriveWallsFromRooms(rooms, 18, (i) => `w-${i + 1}`, NOW);
  return {
    id: 'demo-project',
    ownerId: null,
    name: 'Yangi loyiha',
    customerName: 'Aliyev Aziz',
    address: 'Toshkent',
    revision: 0,
    rooms,
    walls,
    points: buildPoints(rooms, walls),
    openings: buildOpenings(rooms, walls),
    settings: {
      gridSize: 20,
      snapToGrid: true,
      defaultSocketHeightCm: 30,
      defaultSwitchHeightCm: 90,
      wallDisplayHeightCm: 270,
    },
    ...stamp,
  };
}

/** The wall shown in "Devor ko'rinishi" for the demo (Zal west wall, where the TV is). */
export function demoSelectedWallId(project: Project): string | null {
  return findWallByEndpoints(project.walls, P(383, 683), P(383, 437))?.id ?? null;
}
