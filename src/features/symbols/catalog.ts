import type { SymbolDef, SymbolId } from '@/domain/types';

/** One glyph part on a 24×24 grid. The same data renders as DOM SVG (SymbolIcon) and Konva Path (plan). */
export interface GlyphPart {
  d: string;
  mode: 'stroke' | 'fill';
}

export interface SymbolVisual {
  /** 'badge' = rounded square filled with the colour; 'outline' = coloured glyph only (plan lyustra). */
  badge: 'badge' | 'outline';
  glyph: GlyphPart[];
  /** on a wall the glyph turns with the wall (sockets read as "8" on vertical walls) */
  rotatable: boolean;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const s = (d: string): GlyphPart => ({ d, mode: 'stroke' });
const f = (d: string): GlyphPart => ({ d, mode: 'fill' });

export const SYMBOL_COLORS = {
  blue: '#3b8bff',
  red: '#ef4444',
  green: '#16a34a',
  yellow: '#facc15',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  grey: '#64748b',
} as const;

const wallProps: SymbolDef['editableProps'] = [
  'mountHeightCm',
  'distanceFromCornerCm',
  'description',
  'color',
];

export const SYMBOLS: Record<SymbolId, SymbolDef & SymbolVisual> = {
  'socket-single': {
    id: 'socket-single',
    category: 'socket',
    defaultColor: SYMBOL_COLORS.blue,
    defaultMountHeightCm: 30,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: true,
    badge: 'badge',
    glyph: [s(circle(12, 12, 7)), f(circle(9.4, 12, 1.5)), f(circle(14.6, 12, 1.5))],
  },
  'socket-double': {
    id: 'socket-double',
    category: 'socket',
    defaultColor: SYMBOL_COLORS.blue,
    defaultMountHeightCm: 30,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: true,
    badge: 'badge',
    glyph: [
      s(circle(7, 12, 4.8)),
      s(circle(17, 12, 4.8)),
      f(circle(5.5, 12, 1.1)),
      f(circle(8.5, 12, 1.1)),
      f(circle(15.5, 12, 1.1)),
      f(circle(18.5, 12, 1.1)),
    ],
  },
  'socket-triple': {
    id: 'socket-triple',
    category: 'socket',
    defaultColor: SYMBOL_COLORS.blue,
    defaultMountHeightCm: 30,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: true,
    badge: 'badge',
    glyph: [
      s(circle(4.6, 12, 3.4)),
      s(circle(12, 12, 3.4)),
      s(circle(19.4, 12, 3.4)),
      f(circle(4.6, 12, 1)),
      f(circle(12, 12, 1)),
      f(circle(19.4, 12, 1)),
    ],
  },
  'switch-single': {
    id: 'switch-single',
    category: 'switch',
    defaultColor: SYMBOL_COLORS.red,
    defaultMountHeightCm: 90,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: false,
    badge: 'badge',
    glyph: [
      s(
        'M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z',
      ),
      f('M9.5 7.5h5v6h-5Z'),
    ],
  },
  'switch-double': {
    id: 'switch-double',
    category: 'switch',
    defaultColor: SYMBOL_COLORS.red,
    defaultMountHeightCm: 90,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: false,
    badge: 'badge',
    glyph: [
      s(
        'M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5Z',
      ),
      s('M12 4.5v15'),
      f('M7 7.5h3v6H7Z'),
      f('M14 7.5h3v6h-3Z'),
    ],
  },
  internet: {
    id: 'internet',
    category: 'data',
    defaultColor: SYMBOL_COLORS.blue,
    defaultMountHeightCm: 30,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: false,
    badge: 'badge',
    glyph: [
      s(circle(12, 12, 8.5)),
      s('M3.5 12h17'),
      s('M12 3.5c-2.6 2.4-3.8 5.3-3.8 8.5s1.2 6.1 3.8 8.5c2.6-2.4 3.8-5.3 3.8-8.5s-1.2-6.1-3.8-8.5Z'),
    ],
  },
  tv: {
    id: 'tv',
    category: 'data',
    defaultColor: SYMBOL_COLORS.purple,
    defaultMountHeightCm: 110,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: false,
    badge: 'badge',
    glyph: [
      s(
        'M4.5 5h15A1.5 1.5 0 0 1 21 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5Z',
      ),
      s('M9 20h6'),
      s('M6.5 8.5h4.5M8.75 8.5v5.5'),
      s('M12.5 8.5l2.25 5.5 2.25-5.5'),
    ],
  },
  'ceiling-light': {
    id: 'ceiling-light',
    category: 'lighting',
    defaultColor: SYMBOL_COLORS.yellow,
    defaultMountHeightCm: null,
    placement: 'ceiling',
    editableProps: ['description', 'color'],
    rotatable: false,
    badge: 'outline',
    glyph: [s(circle(12, 12, 9)), s('M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36')],
  },
  led: {
    id: 'led',
    category: 'lighting',
    defaultColor: SYMBOL_COLORS.yellow,
    defaultMountHeightCm: null,
    placement: 'any',
    editableProps: ['description', 'color'],
    rotatable: false,
    badge: 'badge',
    glyph: [s('M2.5 9h19v6h-19Z'), f('M4.5 11h2.5v2H4.5ZM8.5 11H11v2H8.5ZM13 11h2.5v2H13ZM17 11h2.5v2H17Z')],
  },
  ac: {
    id: 'ac',
    category: 'climate',
    defaultColor: SYMBOL_COLORS.teal,
    defaultMountHeightCm: 220,
    placement: 'wall',
    editableProps: wallProps,
    rotatable: false,
    badge: 'badge',
    glyph: [
      s(
        'M4.5 5h15A1.5 1.5 0 0 1 21 6.5v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 11.5v-5A1.5 1.5 0 0 1 4.5 5Z',
      ),
      s('M6 10h12'),
      s('M8 16v3.5M12 16v4M16 16v3.5'),
    ],
  },
  custom: {
    id: 'custom',
    category: 'custom',
    defaultColor: SYMBOL_COLORS.grey,
    defaultMountHeightCm: null,
    placement: 'any',
    editableProps: ['mountHeightCm', 'distanceFromCornerCm', 'description', 'color', 'label'],
    rotatable: false,
    badge: 'badge',
    glyph: [f(circle(5.5, 12, 2)), f(circle(12, 12, 2)), f(circle(18.5, 12, 2))],
  },
};

export const SYMBOL_IDS = Object.keys(SYMBOLS) as SymbolId[];

/** Order of the top symbol bar (reference); the rest live behind "Boshqa". */
export const SYMBOL_BAR: SymbolId[] = [
  'socket-single',
  'socket-double',
  'switch-single',
  'internet',
  'tv',
  'ceiling-light',
  'led',
];
export const SYMBOL_MORE: SymbolId[] = SYMBOL_IDS.filter((id) => !SYMBOL_BAR.includes(id));
