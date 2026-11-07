import { create } from 'zustand';
import { WiringDocSchema, type WiringDoc } from '@/domain/schemas';
import type { BoxInput, BoxSwitch } from '@/domain/wiring/junctionBox';
import type { PanelInput, PanelLine } from '@/domain/wiring/panel';
import type { Joins } from '@/domain/wiring/boxCheck';
import { getMeta, setMeta } from '@/infra/idb/projectRepo';

/** PHASE 21: the wiring workbench (board + junction box), saved on this device so it works offline. */
const KEY = 'wiring';
let seq = 0;
export const wid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const DEFAULT_DOC: WiringDoc = {
  panel: { phases: 1, allocatedKw: 10, lines: [] },
  box: {
    switches: [
      { id: 'a', keys: 2, lamps: [1, 1] },
      { id: 'b', keys: 1, lamps: [1] },
    ],
  },
  manual: [],
  clamps: [],
};

interface WiringState extends WiringDoc {
  loaded: boolean;
  load: () => Promise<void>;
  setPanel: (p: Partial<PanelInput>) => void;
  addLine: (l: Omit<PanelLine, 'id'>) => void;
  updateLine: (id: string, patch: Partial<PanelLine>) => void;
  removeLine: (id: string) => void;
  setLines: (lines: PanelLine[]) => void;
  setBox: (box: BoxInput) => void;
  updateSwitch: (id: string, patch: Partial<BoxSwitch>) => void;
  setManual: (joins: Joins) => void;
  setClamps: (clamps: WiringDoc['clamps']) => void;
}

export const useWiringStore = create<WiringState>()((set, get) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  // changed before the saved copy finished loading (a slow first IndexedDB open): keep the new work
  let dirty = false;
  const write = () => {
    timer = null;
    const { panel, box, manual, clamps } = get();
    void setMeta(KEY, { panel, box, manual, clamps } satisfies WiringDoc).catch(() => undefined);
  };
  // at most 300 ms after the first unsaved change (a stream of changes must not keep postponing it)
  const save = () => {
    dirty = true;
    if (!timer) timer = setTimeout(write, 300);
  };
  if (typeof window !== 'undefined')
    window.addEventListener('pagehide', () => {
      if (!timer) return;
      clearTimeout(timer);
      write();
    });
  const patch = (p: Partial<WiringDoc>) => {
    set(p);
    save();
  };
  return {
    ...DEFAULT_DOC,
    loaded: false,
    load: async () => {
      const doc = await getMeta(KEY, (v) => {
        const r = WiringDocSchema.safeParse(v);
        return r.success ? r.data : null;
      }).catch(() => null);
      if (dirty) set({ loaded: true });
      else set({ ...(doc ?? DEFAULT_DOC), loaded: true });
    },
    setPanel: (p) => patch({ panel: { ...get().panel, ...p } }),
    addLine: (l) =>
      patch({ panel: { ...get().panel, lines: [...get().panel.lines, { ...l, id: wid('line') }] } }),
    updateLine: (id, p) =>
      patch({
        panel: { ...get().panel, lines: get().panel.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) },
      }),
    removeLine: (id) =>
      patch({ panel: { ...get().panel, lines: get().panel.lines.filter((l) => l.id !== id) } }),
    setLines: (lines) => patch({ panel: { ...get().panel, lines } }),
    // a changed box invalidates the hand-made joins
    setBox: (box) => patch({ box, manual: [], clamps: [] }),
    updateSwitch: (id, p) =>
      patch({
        box: { switches: get().box.switches.map((s) => (s.id === id ? { ...s, ...p } : s)) },
        manual: [],
        clamps: [],
      }),
    setManual: (manual) => patch({ manual }),
    setClamps: (clamps) => patch({ clamps }),
  };
});
