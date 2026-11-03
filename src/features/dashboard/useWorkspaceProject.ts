'use client';

import { useEffect } from 'react';
import { createEmptyProject } from '@/domain/project';
import { pickDefaultWallId } from '@/domain/selectors';
import { uz } from '@/i18n/uz';
import { useEditorStore } from '@/store/editorStore';
import { useProjectStore } from '@/store/projectStore';

/**
 * Demo data is available in development, or when explicitly enabled at build time.
 * Kept as an inline constant expression so production builds drop the demo chunk entirely.
 */
const DEMO_ENABLED = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO === '1';

/**
 * Loads the workspace project. Phase 1: `?demo=1` → reference house, otherwise a blank project.
 * (Projects from IndexedDB arrive in Phase 2.)
 */
export function useWorkspaceProject() {
  const load = useProjectStore((s) => s.load);
  const setSelection = useEditorStore((s) => s.setSelection);
  useEffect(() => {
    if (useProjectStore.getState().project) return;
    let cancelled = false;
    if (DEMO_ENABLED && new URLSearchParams(window.location.search).get('demo') === '1') {
      void import('./demoProject').then(({ buildDemoProject, DEMO_PROJECT_COUNT, DEMO_SELECTED_POINT_ID }) => {
        if (cancelled) return;
        const demo = buildDemoProject();
        const zal = demo.rooms[0]?.id ?? null;
        load(demo, DEMO_PROJECT_COUNT);
        setSelection({
          selectedPointId: DEMO_SELECTED_POINT_ID,
          selectedRoomId: zal,
          selectedWallId: zal ? pickDefaultWallId(demo, zal) : null,
        });
      });
    } else {
      load(createEmptyProject('local-new', uz.header.newProject, new Date().toISOString()), 0);
    }
    return () => {
      cancelled = true;
    };
  }, [load, setSelection]);
}
