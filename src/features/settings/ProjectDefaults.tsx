'use client';

import { useEffect } from 'react';
import { NumberField } from '@/components/common/NumberField';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { sealEdit, setDefaultHeights } from '@/features/editor/actions';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';

/** Default mount heights of the last opened project (rozetka 30, viklyuchatel 90 by default). */
export function ProjectDefaults() {
  const status = useProjectStore((s) => s.status);
  const project = useProjectStore(
    (s) => s.projects.find((p) => p.id === (s.currentId ?? s.lastOpenedId) && p.deletedAt === null) ?? null,
  );
  // settings edit the project directly, so make it the open one
  useEffect(() => {
    const s = useProjectStore.getState();
    if (status === 'ready' && project && s.currentId !== project.id && !s.demo) s.open(project.id);
  }, [status, project]);
  if (!project) return null;
  const set = (patch: { defaultSocketHeightCm?: number; defaultSwitchHeightCm?: number }) =>
    setDefaultHeights(patch);
  return (
    <GlassPanel className="flex flex-col gap-3 p-4" data-testid="project-defaults">
      <h2 className="text-[13px] font-medium tracking-wide text-text-dim uppercase">
        {uz.settings.project}: <span className="text-text normal-case">{project.name}</span>
      </h2>
      <p className="text-[14px] text-text-muted">{uz.settings.projectHint}</p>
      <div className="flex max-w-sm flex-col gap-2.5">
        <NumberField
          label={uz.settings.socketHeight}
          value={project.settings.defaultSocketHeightCm}
          unit={uz.point.cm}
          max={300}
          onChange={(v) => v !== null && set({ defaultSocketHeightCm: v })}
          onCommit={sealEdit}
        />
        <NumberField
          label={uz.settings.switchHeight}
          value={project.settings.defaultSwitchHeightCm}
          unit={uz.point.cm}
          max={300}
          onChange={(v) => v !== null && set({ defaultSwitchHeightCm: v })}
          onCommit={sealEdit}
        />
      </div>
    </GlassPanel>
  );
}
