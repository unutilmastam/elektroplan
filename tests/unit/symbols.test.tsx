import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SYMBOL_BAR, SYMBOL_IDS, SYMBOL_MORE, SYMBOLS } from '@/features/symbols/catalog';
import { SymbolIcon } from '@/features/symbols/SymbolIcon';
import { uz } from '@/i18n/uz';

describe('symbol catalog', () => {
  it('has all 12 symbols with names and glyphs', () => {
    expect(SYMBOL_IDS).toHaveLength(12);
    for (const id of SYMBOL_IDS) {
      expect(SYMBOLS[id].id).toBe(id);
      expect(uz.symbols[id].length).toBeGreaterThan(0);
      expect(SYMBOLS[id].glyph.length).toBeGreaterThan(0);
    }
  });
  it('splits symbols between the bar and the "Boshqa" menu without overlap', () => {
    expect([...SYMBOL_BAR, ...SYMBOL_MORE].sort()).toEqual([...SYMBOL_IDS].sort());
  });
  it('renders an SVG badge per symbol', () => {
    for (const id of SYMBOL_IDS) {
      const { container, unmount } = render(<SymbolIcon id={id} size={24} />);
      expect(container.querySelector('svg')).not.toBeNull();
      expect(container.querySelectorAll('path').length).toBe(SYMBOLS[id].glyph.length);
      unmount();
    }
  });
});
