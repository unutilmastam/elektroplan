import { applyPatches, enablePatches, produceWithPatches, type Draft, type Patch } from 'immer';

enablePatches();

/**
 * Undo/redo with immer patches (ARCHITECTURE §4.5). Pure: every function returns new values.
 * The same patches will later feed the sync outbox.
 */
export interface HistoryEntry {
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
  /** consecutive entries with the same key merge into one (e.g. one drag = one undo step) */
  coalesceKey: string | null;
}

export interface History {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export const HISTORY_LIMIT = 200;

export const emptyHistory = (): History => ({ past: [], future: [] });

export interface Applied<T> {
  next: T;
  entry: HistoryEntry | null;
}

/** Runs an immer recipe; returns the next state and its history entry (null when nothing changed). */
export function applyRecipe<T extends object>(
  state: T,
  label: string,
  recipe: (draft: Draft<T>) => void,
  coalesceKey: string | null = null,
): Applied<T> {
  const [next, patches, inversePatches] = produceWithPatches(state, recipe);
  if (patches.length === 0) return { next: state, entry: null };
  return { next: next as T, entry: { label, patches, inversePatches, coalesceKey } };
}

/** Pushes an entry, merging with the previous one when both share a coalesce key. Clears redo. */
export function record(history: History, entry: HistoryEntry, limit = HISTORY_LIMIT): History {
  const top = history.past[history.past.length - 1];
  if (top && entry.coalesceKey !== null && top.coalesceKey === entry.coalesceKey) {
    const merged: HistoryEntry = {
      ...top,
      patches: [...top.patches, ...entry.patches],
      inversePatches: [...entry.inversePatches, ...top.inversePatches],
    };
    return { past: [...history.past.slice(0, -1), merged], future: [] };
  }
  const past = [...history.past, entry];
  return { past: past.length > limit ? past.slice(past.length - limit) : past, future: [] };
}

/** Ends coalescing for the top entry (the next change with the same key starts a new step). */
export function seal(history: History): History {
  const top = history.past[history.past.length - 1];
  if (!top || top.coalesceKey === null) return history;
  return { ...history, past: [...history.past.slice(0, -1), { ...top, coalesceKey: null }] };
}

export function undo<T extends object>(state: T, history: History): { state: T; history: History } | null {
  const top = history.past[history.past.length - 1];
  if (!top) return null;
  return {
    state: applyPatches(state, top.inversePatches) as T,
    history: { past: history.past.slice(0, -1), future: [{ ...top, coalesceKey: null }, ...history.future] },
  };
}

export function redo<T extends object>(state: T, history: History): { state: T; history: History } | null {
  const next = history.future[0];
  if (!next) return null;
  return {
    state: applyPatches(state, next.patches) as T,
    history: { past: [...history.past, next], future: history.future.slice(1) },
  };
}
