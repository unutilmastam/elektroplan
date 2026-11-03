/**
 * Demo house used to compare the UI with docs/design/reference-dashboard.png.
 * Only reachable with `?demo=1` in development (or when NEXT_PUBLIC_ENABLE_DEMO=1).
 */
import { polygonCentroid } from '@/domain/geometry';
import type {
  ElectricalPoint,
  Opening,
  PointStatus,
  Project,
  Room,
  SymbolId,
  Vec2,
  Wall,
} from '@/domain/types';
import { deriveWallsFromRooms, findWallByEndpoints, pointOnWall } from '@/domain/walls';
import { SYMBOLS } from '@/features/symbols/catalog';

const NOW = '2026-11-03T09:00:00.000Z';
const O = { x: 383, y: 223 };
const P = (x: number, y: number): Vec2 => ({ x: x - O.x, y: y - O.y });
const stamp = { createdAt: NOW, updatedAt: NOW, deletedAt: null };

type RoomSeed = [id: string, name: string, vertices: Array<[number, number]>];
const ROOM_SEEDS: RoomSeed[] = [
  [
    'r-zal',
    'Zal',
    [
      [383, 437],
      [615, 437],
      [615, 483],
      [770, 483],
      [810, 525],
      [810, 683],
      [383, 683],
    ],
  ],
  [
    'r-yotoq',
    'Yotoqxona',
    [
      [383, 223],
      [695, 223],
      [695, 420],
      [695, 437],
      [615, 437],
      [383, 437],
    ],
  ],
  [
    'r-oshxona',
    'Oshxona',
    [
      [878, 223],
      [1183, 223],
      [1183, 478],
      [975, 478],
      [878, 420],
    ],
  ],
  [
    'r-vanna',
    'Vanna',
    [
      [695, 223],
      [878, 223],
      [878, 420],
      [695, 420],
    ],
  ],
  [
    'r-balkon',
    'Balkon',
    [
      [975, 478],
      [1183, 478],
      [1183, 683],
      [975, 683],
    ],
  ],
  [
    'r-koridor',
    'Koridor',
    [
      [615, 437],
      [695, 437],
      [695, 420],
      [878, 420],
      [975, 478],
      [975, 683],
      [810, 683],
      [810, 525],
      [770, 483],
      [615, 483],
    ],
  ],
];

const LABELS: Record<string, [number, number]> = {
  'r-zal': [596, 540],
  'r-yotoq': [538, 295],
  'r-oshxona': [1036, 295],
  'r-vanna': [780, 295],
  'r-balkon': [1094, 558],
  'r-koridor': [867, 483],
};

function buildRooms(): Room[] {
  return ROOM_SEEDS.map(([id, name, vs], order) => {
    const vertices = vs.map(([x, y]) => P(x, y));
    const c = polygonCentroid(vertices);
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

type Seg = [number, number, number, number];
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

interface PointSeed {
  room: string;
  symbol: SymbolId;
  status: PointStatus;
  wall?: Seg;
  /** reference-pixel position used to find t (wall points) or x/y (ceiling points) */
  at: [number, number];
  /** explicit distance from the wall's left corner, plan units ≈ cm */
  dist?: number;
  height?: number;
  description?: string;
  color?: string;
  id?: string;
}

const ZAL_WEST: Seg = [383, 683, 383, 437];
const POINT_SEEDS: PointSeed[] = [
  // Zal
  { room: 'r-zal', symbol: 'ceiling-light', status: 'completed', at: [596, 584] },
  {
    room: 'r-zal',
    symbol: 'socket-double',
    status: 'completed',
    wall: ZAL_WEST,
    at: [0, 0],
    dist: 60,
    height: 30,
  },
  {
    id: 'p-tv-socket',
    room: 'r-zal',
    symbol: 'socket-single',
    status: 'completed',
    wall: ZAL_WEST,
    at: [0, 0],
    dist: 120,
    height: 30,
    description: 'Televizor uchun',
  },
  { room: 'r-zal', symbol: 'tv', status: 'completed', wall: ZAL_WEST, at: [0, 0], dist: 150, height: 110 },
  {
    room: 'r-zal',
    symbol: 'socket-triple',
    status: 'completed',
    wall: ZAL_WEST,
    at: [0, 0],
    dist: 200,
    height: 30,
  },
  { room: 'r-zal', symbol: 'socket-double', status: 'completed', wall: [810, 683, 383, 683], at: [742, 683] },
  { room: 'r-zal', symbol: 'switch-single', status: 'completed', wall: [810, 525, 810, 683], at: [810, 636] },
  // Yotoqxona
  { room: 'r-yotoq', symbol: 'ceiling-light', status: 'completed', at: [537, 339] },
  {
    room: 'r-yotoq',
    symbol: 'socket-double',
    status: 'completed',
    wall: [383, 223, 695, 223],
    at: [410, 223],
  },
  {
    room: 'r-yotoq',
    symbol: 'socket-double',
    status: 'completed',
    wall: [695, 223, 695, 420],
    at: [695, 345],
  },
  {
    room: 'r-yotoq',
    symbol: 'socket-double',
    status: 'completed',
    wall: [383, 437, 383, 223],
    at: [383, 398],
  },
  {
    room: 'r-yotoq',
    symbol: 'switch-single',
    status: 'in_progress',
    wall: [695, 223, 695, 420],
    at: [695, 405],
  },
  // Vanna
  { room: 'r-vanna', symbol: 'ceiling-light', status: 'completed', at: [780, 330] },
  {
    room: 'r-vanna',
    symbol: 'socket-double',
    status: 'completed',
    wall: [695, 420, 695, 223],
    at: [695, 265],
  },
  {
    room: 'r-vanna',
    symbol: 'custom',
    status: 'pending',
    wall: [695, 223, 878, 223],
    at: [848, 223],
    color: '#3b8bff',
    description: 'Kir yuvish mashinasi',
  },
  {
    room: 'r-vanna',
    symbol: 'socket-double',
    status: 'completed',
    wall: [878, 223, 878, 420],
    at: [878, 346],
  },
  {
    room: 'r-vanna',
    symbol: 'socket-double',
    status: 'completed',
    wall: [878, 420, 695, 420],
    at: [723, 420],
  },
  // Oshxona
  { room: 'r-oshxona', symbol: 'ceiling-light', status: 'completed', at: [1036, 342] },
  {
    room: 'r-oshxona',
    symbol: 'socket-double',
    status: 'completed',
    wall: [878, 420, 878, 223],
    at: [878, 253],
  },
  {
    room: 'r-oshxona',
    symbol: 'socket-double',
    status: 'completed',
    wall: [878, 420, 878, 223],
    at: [878, 293],
  },
  { room: 'r-oshxona', symbol: 'ac', status: 'in_progress', wall: [878, 223, 1183, 223], at: [1078, 223] },
  {
    room: 'r-oshxona',
    symbol: 'socket-double',
    status: 'completed',
    wall: [1183, 223, 1183, 478],
    at: [1183, 295],
  },
  {
    room: 'r-oshxona',
    symbol: 'socket-double',
    status: 'completed',
    wall: [1183, 223, 1183, 478],
    at: [1183, 398],
  },
  {
    room: 'r-oshxona',
    symbol: 'switch-single',
    status: 'pending',
    wall: [1183, 478, 975, 478],
    at: [998, 478],
  },
  // Koridor
  { room: 'r-koridor', symbol: 'ceiling-light', status: 'completed', at: [867, 526] },
  {
    room: 'r-koridor',
    symbol: 'switch-single',
    status: 'pending',
    wall: [975, 478, 975, 683],
    at: [975, 520],
  },
  {
    room: 'r-koridor',
    symbol: 'socket-single',
    status: 'pending',
    wall: [810, 683, 810, 525],
    at: [810, 640],
  },
  // Balkon
  { room: 'r-balkon', symbol: 'ceiling-light', status: 'pending', at: [1094, 599] },
  {
    room: 'r-balkon',
    symbol: 'switch-single',
    status: 'pending',
    wall: [975, 683, 975, 478],
    at: [975, 617],
  },
  {
    room: 'r-balkon',
    symbol: 'socket-double',
    status: 'pending',
    wall: [1183, 683, 975, 683],
    at: [1160, 683],
  },
];

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

/** [kind, wall, centre, width, room the door opens into ('!' prefix = opens away from that room)] */
type OpeningSeed = [kind: Opening['kind'], wall: Seg, centre: [number, number], width: number, into?: string];
const OPENING_SEEDS: OpeningSeed[] = [
  ['window', [383, 223, 695, 223], [529, 223], 150],
  ['window', [695, 223, 878, 223], [768, 223], 70],
  ['window', [878, 223, 1183, 223], [1040, 223], 110],
  ['window', [383, 437, 383, 223], [383, 330], 75],
  ['window', [1183, 223, 1183, 478], [1183, 345], 75],
  ['window', [810, 683, 383, 683], [625, 683], 100],
  ['window', [1183, 683, 975, 683], [1090, 683], 90],
  ['door', [615, 437, 695, 437], [652, 437], 46, 'r-yotoq'],
  ['door', [695, 420, 878, 420], [800, 420], 52, '!r-vanna'],
  ['door', [878, 420, 975, 478], [926, 449], 54, 'r-oshxona'],
  ['door', [770, 483, 810, 525], [790, 504], 50, '!r-zal'],
  ['door', [975, 478, 975, 683], [975, 565], 52, '!r-balkon'],
  ['door', [810, 683, 975, 683], [905, 683], 64, '!r-koridor'],
];

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
