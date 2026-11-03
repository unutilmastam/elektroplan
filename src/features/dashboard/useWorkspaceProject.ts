'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { recentProjects } from '@/domain/projectList';
import { useEditorStore } from '@/store/editorStore';
import { useProjectStore } from '@/store/projectStore';

/**
 * Demo data is available in development, or when explicitly enabled at build time.
 * Kept as an inline constant expression so production builds never load the demo chunk.
 */
const DEMO_ENABLED = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO === '1';

export type WorkspaceMode = 'home' | 'editor';

/**
 * Chooses the project for the workspace (pages read IndexedDB only, via projectStore):
 *  - `?demo=1` (dev) → reference house;
 *  - editor → `?id=`;
 *  - home → last opened project, else the most recently updated one, else none.
 */
export function useWorkspaceProject(mode: WorkspaceMode): { notFound: boolean } {
  const params = useSearchParams();
  const demoRequested = DEMO_ENABLED && params.get('demo') === '1';
  const idParam = mode === 'editor' ? params.get('id') : null;
  const status = useProjectStore((s) => s.status);
  const currentId = useProjectStore((s) => s.currentId);
  const select = useEditorStore((s) => s.select);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const requestFit = useEditorStore((s) => s.requestFit);
  const [notFound, setNotFound] = useState(false);
  const demoLoaded = useRef(false);

  useEffect(() => {
    if (!demoRequested || demoLoaded.current) return;
    demoLoaded.current = true;
    void import('./demoProject').then(({ buildDemoProject, DEMO_PROJECT_COUNT, DEMO_SELECTED_POINT_ID }) => {
      const demo = buildDemoProject();
      useProjectStore.getState().loadDemo(demo, DEMO_PROJECT_COUNT);
      select(demo, [{ kind: 'point', id: DEMO_SELECTED_POINT_ID }]);
    });
  }, [demoRequested, select]);

  useEffect(() => {
    if (demoRequested || status !== 'ready') return;
    const { projects, lastOpenedId, open } = useProjectStore.getState();
    const live = (id: string | null) =>
      id !== null && projects.some((p) => p.id === id && p.deletedAt === null);
    if (mode === 'editor' && idParam !== null) {
      setNotFound(!live(idParam));
      open(live(idParam) ? idParam : null);
      return;
    }
    setNotFound(false);
    const cur = useProjectStore.getState().currentId;
    if (live(cur)) return;
    open(live(lastOpenedId) ? lastOpenedId : (recentProjects(projects, 1)[0]?.id ?? null));
  }, [demoRequested, status, mode, idParam]);

  // A different project → clear selection and re-fit the plan.
  useEffect(() => {
    if (demoRequested) return;
    clearSelection();
    requestFit();
  }, [currentId, demoRequested, clearSelection, requestFit]);

  return { notFound };
}
