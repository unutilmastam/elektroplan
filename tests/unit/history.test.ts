import { describe, expect, it } from 'vitest';
import { applyRecipe, emptyHistory, record, redo, seal, undo, type History } from '@/domain/history';

type Doc = { n: number; items: Array<{ id: string; v: number }> };
const base: Doc = { n: 0, items: [{ id: 'a', v: 1 }] };

function step(doc: Doc, h: History, recipe: (d: Doc) => void, key: string | null = null) {
  const { next, entry } = applyRecipe(doc, 'test', recipe, key);
  return { doc: next, h: entry ? record(h, entry) : h };
}

describe('history', () => {
  it('records, undoes and redoes', () => {
    let { doc, h } = step(base, emptyHistory(), (d) => {
      d.n = 1;
    });
    ({ doc, h } = step(doc, h, (d) => {
      d.items.push({ id: 'b', v: 2 });
    }));
    expect(h.past).toHaveLength(2);
    const u1 = undo(doc, h)!;
    expect(u1.state.items).toHaveLength(1);
    const u2 = undo(u1.state, u1.history)!;
    expect(u2.state).toEqual(base);
    expect(undo(u2.state, u2.history)).toBeNull();
    const r1 = redo(u2.state, u2.history)!;
    const r2 = redo(r1.state, r1.history)!;
    expect(r2.state).toEqual(doc);
    expect(redo(r2.state, r2.history)).toBeNull();
  });

  it('ignores no-op recipes', () => {
    const { next, entry } = applyRecipe(base, 'noop', () => undefined);
    expect(next).toBe(base);
    expect(entry).toBeNull();
  });

  it('coalesces a drag into one undo step, and seal() ends it', () => {
    let doc = base;
    let h = emptyHistory();
    for (let i = 1; i <= 10; i++) ({ doc, h } = step(doc, h, (d) => void (d.items[0]!.v = i), 'drag-1'));
    expect(h.past).toHaveLength(1);
    expect(undo(doc, h)!.state).toEqual(base);
    h = seal(h);
    ({ doc, h } = step(doc, h, (d) => void (d.items[0]!.v = 99), 'drag-1'));
    expect(h.past).toHaveLength(2);
    expect(undo(doc, h)!.state.items[0]!.v).toBe(10);
  });

  it('a new change clears redo', () => {
    let { doc, h } = step(base, emptyHistory(), (d) => void (d.n = 1));
    const u = undo(doc, h)!;
    ({ doc, h } = step(u.state, u.history, (d) => void (d.n = 5)));
    expect(h.future).toHaveLength(0);
    expect(doc.n).toBe(5);
  });

  it('keeps at most 200 steps', () => {
    let doc = base;
    let h = emptyHistory();
    for (let i = 0; i < 250; i++) ({ doc, h } = step(doc, h, (d) => void (d.n = i + 1)));
    expect(h.past).toHaveLength(200);
    let s = { state: doc, history: h };
    for (let i = 0; i < 200; i++) s = undo(s.state, s.history)!;
    expect(s.state.n).toBe(50);
  });

  it('does not mutate the input state', () => {
    const frozen = structuredClone(base);
    step(frozen, emptyHistory(), (d) => void (d.items[0]!.v = 42));
    expect(frozen.items[0]!.v).toBe(1);
  });
});
