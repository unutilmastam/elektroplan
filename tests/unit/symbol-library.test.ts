import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SYMBOL_BAR, SYMBOL_IDS, SYMBOLS } from '@/features/symbols/catalog';
import { createPlaceSymbolTool } from '@/features/editor/tools';
import type { ToolContext, ToolPointer } from '@/features/editor/tools/types';
import type { DraftShape } from '@/store/editorStore';
import { uz } from '@/i18n/uz';

const SPEC_IDS = [
  'socket-single',
  'socket-double',
  'socket-triple',
  'switch-single',
  'switch-double',
  'internet',
  'tv',
  'ceiling-light',
  'led',
  'ac',
  'custom',
];

describe('symbol catalog (single source)', () => {
  it('has exactly the 11 symbols from the spec with every field', () => {
    expect([...SYMBOL_IDS].sort()).toEqual([...SPEC_IDS].sort());
    for (const id of SYMBOL_IDS) {
      const s = SYMBOLS[id];
      expect(s.id).toBe(id);
      expect(s.category).toMatch(/^(socket|switch|data|lighting|climate|custom)$/);
      expect(s.defaultColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.editableProps.length).toBeGreaterThan(0);
      expect(s.glyph.length).toBeGreaterThan(0);
      expect(uz.symbols[id].length).toBeGreaterThan(0);
      if (s.placement === 'wall') expect(s.defaultMountHeightCm).not.toBeNull();
    }
  });

  it('wall heights follow the defaults (sockets 30, switches 90)', () => {
    expect(SYMBOLS['socket-single'].defaultMountHeightCm).toBe(30);
    expect(SYMBOLS['switch-single'].defaultMountHeightCm).toBe(90);
  });

  it('glyphs are valid SVG path data on the 24×24 grid', () => {
    for (const id of SYMBOL_IDS) {
      for (const g of SYMBOLS[id].glyph) {
        expect(g.d).toMatch(/^M/);
        expect(g.d).toMatch(/^[MmLlHhVvCcSsQqAaZz0-9.,\s-]+$/);
        for (const n of g.d.match(/-?\d*\.?\d+/g) ?? []) expect(Math.abs(Number(n))).toBeLessThanOrEqual(24);
      }
    }
  });

  it('only sockets rotate with the wall; lighting uses an outline on the plan', () => {
    expect(
      SYMBOL_IDS.filter((id) => SYMBOLS[id].rotatable).every((id) => SYMBOLS[id].category === 'socket'),
    ).toBe(true);
    expect(SYMBOLS['ceiling-light'].badge).toBe('outline');
    expect(SYMBOL_BAR).toHaveLength(7);
  });
});

describe('no emoji as symbols (CLAUDE.md)', () => {
  it('source files contain no pictographic emoji', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|css)$/.test(name) && /\p{Extended_Pictographic}/u.test(readFileSync(p, 'utf8')))
          offenders.push(p);
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(offenders).toEqual([]);
  });
});

describe('placement tool', () => {
  it('shows the picked symbol under the pointer and places on tap only', () => {
    let draft: DraftShape | null = null;
    const placed: ToolPointer[] = [];
    const ctx = {
      setDraft: (d: DraftShape | null) => void (draft = d),
      activeSymbol: () => 'tv',
      symbolPreview: (q: ToolPointer) => ({
        kind: 'symbol',
        symbolId: 'tv',
        at: q.world,
        rotation: 0,
        valid: true,
      }),
      placeSymbol: (p: ToolPointer) => void placed.push(p),
    } as unknown as ToolContext;
    const t = createPlaceSymbolTool(ctx);
    const p = (x: number): ToolPointer => ({
      world: { x, y: 5 },
      screen: { x, y: 5 },
      pointerType: 'pen',
      shift: false,
      toggle: false,
    });
    t.onHover!(p(10));
    expect(draft).toEqual({ kind: 'symbol', symbolId: 'tv', at: { x: 10, y: 5 }, rotation: 0, valid: true });
    t.onDown(p(20));
    t.onUp(p(22));
    t.onDown(p(20));
    t.onMove(p(90));
    t.onUp(p(90));
    expect(placed).toHaveLength(1);
    t.onCancel();
    expect(draft).toBeNull();
  });
});
