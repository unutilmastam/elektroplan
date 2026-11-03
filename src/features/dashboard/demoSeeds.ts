/** Seed data for the demo house (reference-image pixel coordinates). */
import type { Opening, PointStatus, SymbolId } from '@/domain/types';

export type Seg = [number, number, number, number];
export type RoomSeed = [id: string, name: string, vertices: Array<[number, number]>];
export const ROOM_SEEDS: RoomSeed[] = [
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

export const LABELS: Record<string, [number, number]> = {
  'r-zal': [596, 540],
  'r-yotoq': [538, 295],
  'r-oshxona': [1036, 295],
  'r-vanna': [780, 295],
  'r-balkon': [1094, 558],
  'r-koridor': [867, 483],
};

export interface PointSeed {
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

export const ZAL_WEST: Seg = [383, 683, 383, 437];
export const POINT_SEEDS: PointSeed[] = [
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

/** [kind, wall, centre, width, room the door opens into ('!' prefix = opens away from that room)] */
export type OpeningSeed = [
  kind: Opening['kind'],
  wall: Seg,
  centre: [number, number],
  width: number,
  into?: string,
];
export const OPENING_SEEDS: OpeningSeed[] = [
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
