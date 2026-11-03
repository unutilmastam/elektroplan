import { create } from 'zustand';
import type { Project } from '@/domain/types';

/** Minimal Phase 1 store: holds the open project. CRUD + history arrive in Phases 2–3. */
interface ProjectState {
  project: Project | null;
  projectCount: number;
  load: (project: Project, projectCount: number) => void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  project: null,
  projectCount: 0,
  load: (project, projectCount) => set({ project, projectCount }),
}));
