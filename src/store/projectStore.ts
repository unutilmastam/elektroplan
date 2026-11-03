import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createProject, deleteProject, duplicateProject, updateProjectInfo } from '@/domain/commands';
import { uuidv7 } from '@/domain/ids';
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

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

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
  init: () => Promise<void>;
  create: (info: ProjectInfo) => Promise<string>;
  updateInfo: (id: string, info: ProjectInfo) => Promise<void>;
  duplicate: (id: string, name: string) => Promise<string | null>;
  remove: (id: string) => Promise<void>;
  open: (id: string | null) => void;
  loadDemo: (project: Project, projectCount: number) => void;
}

const nowIso = () => new Date().toISOString();
const str = (v: unknown) => (typeof v === 'string' ? v : null);

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => {
    /**
     * Write one project to IndexedDB BEFORE showing the change, so what the user sees is saved
     * (a reload right after an action keeps it). A failed write still updates memory and raises `saveError`.
     */
    const persist = async (p: Project) => {
      try {
        await saveProject(p);
        set((s) => {
          s.saveError = false;
        });
        void requestPersistentStorage();
      } catch {
        set((s) => {
          s.saveError = true;
        });
      }
    };
    const replace = (p: Project) =>
      set((s) => {
        const i = s.projects.findIndex((x) => x.id === p.id);
        if (i >= 0) s.projects[i] = p;
        else s.projects.push(p);
      });
    const find = (id: string) => get().projects.find((p) => p.id === id && p.deletedAt === null);

    return {
      status: 'idle',
      projects: [],
      currentId: null,
      lastOpenedId: null,
      demo: null,
      demoProjectCount: null,
      saveError: false,

      init: async () => {
        if (get().status !== 'idle') return;
        set((s) => {
          s.status = 'loading';
        });
        try {
          const [{ projects }, last] = await Promise.all([loadAllProjects(), getMeta(META_LAST_OPENED, str)]);
          set((s) => {
            s.projects = projects;
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
        await persist(p);
        replace(p);
        get().open(p.id);
        return p.id;
      },

      updateInfo: async (id, info) => {
        const cur = find(id);
        if (!cur) return;
        const p = updateProjectInfo(cur, info, nowIso());
        await persist(p);
        replace(p);
      },

      duplicate: async (id, name) => {
        const cur = find(id);
        if (!cur) return null;
        const p = duplicateProject(cur, name, () => uuidv7(), nowIso());
        await persist(p);
        replace(p);
        return p.id;
      },

      remove: async (id) => {
        const cur = find(id);
        if (!cur) return;
        const p = deleteProject(cur, nowIso());
        await persist(p);
        replace(p);
        set((s) => {
          if (s.currentId === id) s.currentId = null;
          if (s.lastOpenedId === id) s.lastOpenedId = null;
        });
      },

      open: (id) => {
        set((s) => {
          s.currentId = id;
          if (id) s.lastOpenedId = id;
        });
        if (id) void setMeta(META_LAST_OPENED, id).catch(() => undefined);
      },

      loadDemo: (project, projectCount) =>
        set((s) => {
          s.demo = project;
          s.demoProjectCount = projectCount;
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
