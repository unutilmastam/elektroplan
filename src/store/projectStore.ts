import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createProject, deleteProject, duplicateProject, updateProjectInfo } from '@/domain/commands';
import {
  applyRecipe,
  emptyHistory,
  record,
  redo as redoHistory,
  seal as sealHistory,
  undo as undoHistory,
  type History,
} from '@/domain/history';
import { uuidv7 } from '@/domain/ids';
import type { Draft, Patch } from 'immer';
import type { ProjectInfo } from '@/domain/schemas';
import type { Project } from '@/domain/types';
import {
  META_LAST_OPENED,
  getMeta,
  loadAllProjects,
  requestPersistentStorage,
  saveProject,
  setMeta,
} from '@/infra/idb/projectRepo';
import { stashUnsaved } from '@/infra/idb/stash';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
/** saved: on disk · dirty: change waiting for the 500 ms pause · saving: writing · error: write failed */
export type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

interface ProjectState {
  status: LoadStatus;
  /** every project known locally, including soft-deleted ones (needed for sync) */
  projects: Project[];
  currentId: string | null;
  lastOpenedId: string | null;
  /** reference house for ?demo=1 (dev) — never persisted */
  demo: Project | null;
  /** reference-image project count shown while the demo is open */
  demoProjectCount: number | null;
  saveError: boolean;
  /** autosave state of the open project (header indicator) */
  saveState: SaveState;
  lastSavedAt: string | null;
  /** projects restored from their last valid snapshot at start-up */
  recoveredCount: number;
  /** undo/redo of the open project (in memory, reset when another project opens) */
  history: History;
  /** undoable plan edit on the open project; same `coalesceKey` merges steps (one drag = one undo) */
  apply: (label: string, recipe: (d: Draft<Project>) => void, coalesceKey?: string | null) => boolean;
  /** ends the current coalescing step (pointer up) */
  seal: () => void;
  undo: () => void;
  redo: () => void;
  /** writes pending edits now; `closing` also journals them synchronously (page hide / unload) */
  flush: (closing?: boolean) => Promise<void>;
  init: () => Promise<void>;
  create: (info: ProjectInfo) => Promise<string>;
  updateInfo: (id: string, info: ProjectInfo) => Promise<void>;
  duplicate: (id: string, name: string) => Promise<string | null>;
  remove: (id: string) => Promise<void>;
  /** writes projects restored from a backup file (already validated and planned by domain/backup) */
  importProjects: (projects: readonly Project[]) => Promise<void>;
  open: (id: string | null) => void;
  loadDemo: (project: Project, projectCount: number) => void;
}

const nowIso = () => new Date().toISOString();
export const EDIT_SAVE_DELAY_MS = 500;
const str = (v: unknown) => (typeof v === 'string' ? v : null);

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => {
    /**
     * Write one project to IndexedDB BEFORE showing the change, so what the user sees is saved
     * (a reload right after an action keeps it). A failed write still updates memory and raises `saveError`.
     */
    const persist = async (p: Project, ops: readonly unknown[]) => {
      const saving = saveProject(p, ops); // starts the IndexedDB transaction right now (page may be closing)
      set((s) => {
        s.saveState = 'saving';
      });
      try {
        await saving;
        set((s) => {
          s.saveError = false;
          s.saveState = pending ? 'dirty' : 'saved';
          s.lastSavedAt = nowIso();
        });
        void requestPersistentStorage();
      } catch {
        set((s) => {
          s.saveError = true;
          s.saveState = 'error';
        });
      }
    };
    /** whole-object op for project-level actions (create / duplicate) */
    const snapshotOp = (p: Project) => [{ op: 'replace', path: [], value: p }];
    const replace = (p: Project) =>
      set((s) => {
        const i = s.projects.findIndex((x) => x.id === p.id);
        if (i >= 0) s.projects[i] = p;
        else s.projects.push(p);
      });
    const find = (id: string) => get().projects.find((p) => p.id === id && p.deletedAt === null);

    /** Plan edits are shown instantly and written after a short pause (full autosave: Phase 8). */
    let pending: Project | null = null;
    /** patches since the last write, appended to the outbox together with the snapshot */
    let pendingOps: Patch[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (p: Project, ops: readonly Patch[]) => {
      if (pending && pending.id !== p.id) void flushPending();
      pending = p;
      pendingOps.push(...ops);
      set((s) => {
        s.saveState = 'dirty';
      });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flushPending(), EDIT_SAVE_DELAY_MS);
    };
    const flushPending = async (closing = false) => {
      if (closing && pending) stashUnsaved(pending, pendingOps);
      if (timer) clearTimeout(timer);
      timer = null;
      const p = pending;
      const ops = pendingOps;
      pending = null;
      pendingOps = [];
      if (p) await persist(p, ops);
    };
    /** Puts a new version of the open project (demo or local) into state. */
    const commit = (next: Project, history: History, ops: readonly Patch[]) => {
      const stamped = { ...next, updatedAt: nowIso() };
      set((s) => {
        s.history = history;
        if (s.demo) s.demo = stamped;
        else {
          const i = s.projects.findIndex((x) => x.id === stamped.id);
          if (i >= 0) s.projects[i] = stamped;
        }
      });
      if (!get().demo) schedule(stamped, ops);
    };
    const current = () => selectCurrentProject(get());

    return {
      status: 'idle',
      projects: [],
      currentId: null,
      lastOpenedId: null,
      demo: null,
      demoProjectCount: null,
      saveError: false,
      saveState: 'saved',
      lastSavedAt: null,
      recoveredCount: 0,
      history: emptyHistory(),

      apply: (label, recipe, coalesceKey = null) => {
        const cur = current();
        if (!cur) return false;
        const { next, entry } = applyRecipe(cur, label, recipe, coalesceKey);
        if (!entry) return false;
        commit(next, record(get().history, entry), entry.patches);
        return true;
      },

      seal: () =>
        set((s) => {
          s.history = sealHistory(s.history);
        }),

      undo: () => {
        const cur = current();
        const top = get().history.past.at(-1);
        const r = cur ? undoHistory(cur, get().history) : null;
        if (r && top) commit(r.state, r.history, top.inversePatches);
      },

      redo: () => {
        const cur = current();
        const next = get().history.future[0];
        const r = cur ? redoHistory(cur, get().history) : null;
        if (r && next) commit(r.state, r.history, next.patches);
      },

      flush: (closing = false) => flushPending(closing),

      init: async () => {
        if (get().status !== 'idle') return;
        set((s) => {
          s.status = 'loading';
        });
        try {
          const [{ projects, recoveredIds }, last] = await Promise.all([
            loadAllProjects(),
            getMeta(META_LAST_OPENED, str),
          ]);
          set((s) => {
            s.projects = projects;
            s.recoveredCount = recoveredIds.length;
            s.lastOpenedId = last;
            s.status = 'ready';
          });
        } catch {
          set((s) => {
            s.status = 'error';
          });
        }
      },

      create: async (info) => {
        const p = createProject(info, uuidv7(), nowIso());
        await persist(p, snapshotOp(p));
        replace(p);
        get().open(p.id);
        return p.id;
      },

      updateInfo: async (id, info) => {
        await flushPending();
        const cur = find(id);
        if (!cur) return;
        const p = updateProjectInfo(cur, info, nowIso());
        await persist(p, [
          { op: 'replace', path: ['name'], value: p.name },
          { op: 'replace', path: ['customerName'], value: p.customerName },
          { op: 'replace', path: ['address'], value: p.address },
        ]);
        replace(p);
      },

      duplicate: async (id, name) => {
        await flushPending();
        const cur = find(id);
        if (!cur) return null;
        const p = duplicateProject(cur, name, () => uuidv7(), nowIso());
        await persist(p, snapshotOp(p));
        replace(p);
        return p.id;
      },

      importProjects: async (projects) => {
        await flushPending();
        for (const p of projects) {
          await persist(p, snapshotOp(p));
          replace(p);
        }
        // the open project was replaced by a newer version: its undo stack no longer applies
        if (projects.some((p) => p.id === get().currentId))
          set((s) => {
            s.history = emptyHistory();
          });
      },

      remove: async (id) => {
        await flushPending();
        const cur = find(id);
        if (!cur) return;
        const p = deleteProject(cur, nowIso());
        await persist(p, [{ op: 'replace', path: ['deletedAt'], value: p.deletedAt }]);
        replace(p);
        set((s) => {
          if (s.currentId === id) s.currentId = null;
          if (s.lastOpenedId === id) s.lastOpenedId = null;
        });
      },

      open: (id) => {
        void flushPending();
        set((s) => {
          if (s.currentId !== id) s.history = emptyHistory();
          s.currentId = id;
          if (id) s.lastOpenedId = id;
        });
        if (id) void setMeta(META_LAST_OPENED, id).catch(() => undefined);
      },

      loadDemo: (project, projectCount) =>
        set((s) => {
          s.demo = project;
          s.demoProjectCount = projectCount;
          s.history = emptyHistory();
        }),
    };
  }),
);

/** The project shown in the workspace: demo (dev) or the open local project. */
export function selectCurrentProject(s: ProjectState): Project | null {
  if (s.demo) return s.demo;
  return s.projects.find((p) => p.id === s.currentId && p.deletedAt === null) ?? null;
}

export function selectLiveProjects(s: ProjectState): Project[] {
  return s.projects.filter((p) => p.deletedAt === null);
}

export const useCurrentProject = () => useProjectStore(selectCurrentProject);
