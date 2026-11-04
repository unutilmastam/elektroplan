'use client';

import { FolderPlus, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { filterAndSortProjects, uniqueName, type ProjectSort } from '@/domain/projectList';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { OfflineBadge } from '@/features/offline-library/ConnectionBadge';
import { exportBackup } from '@/features/offline-library/backupActions';
import { ProjectCard } from './ProjectCard';

const SORTS: ProjectSort[] = ['updated', 'created', 'name', 'progress'];

/** "Loyihalar" page: list from IndexedDB, search, sort, CRUD actions. Works offline. */
export function ProjectsScreen() {
  const status = useProjectStore((s) => s.status);
  const projects = useProjectStore((s) => s.projects);
  const duplicate = useProjectStore((s) => s.duplicate);
  const { openCreate, openEdit, openDelete } = useUiStore();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ProjectSort>('updated');
  const list = useMemo(() => filterAndSortProjects(projects, query, sort), [projects, query, sort]);
  const liveCount = useMemo(() => projects.filter((p) => p.deletedAt === null).length, [projects]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-4 py-3 lg:px-5 lg:py-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold lg:text-[26px]">{uz.projects.title}</h1>
          <p className="tabular text-[14px] text-text-muted">
            {liveCount} {uz.projects.count}
          </p>
        </div>
        <OfflineBadge />
        <Button variant="primary" onClick={openCreate} className="lg:h-[52px] lg:px-5 lg:text-[16px]">
          <Plus size={20} aria-hidden />
          {uz.projects.create}
        </Button>
      </GlassPanel>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <label className="glass flex h-12 shrink-0 items-center sm:flex-1 gap-2.5 rounded-[12px] px-3.5">
          <Search size={20} className="text-text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={uz.projects.search}
            aria-label={uz.projects.searchLabel}
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-dim"
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ProjectSort)}
          aria-label={uz.projects.sortLabel}
          className="glass h-12 rounded-[12px] px-3.5 text-base text-text outline-none sm:w-[220px]"
        >
          {SORTS.map((s) => (
            <option key={s} value={s} className="bg-panel-solid">
              {uz.projects.sort[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
        {status === 'loading' || status === 'idle' ? (
          <p className="py-10 text-center text-text-muted">{uz.projects.loading}</p>
        ) : status === 'error' ? (
          <p role="alert" className="py-10 text-center text-[#ff7b7b]">
            {uz.projects.loadError}
          </p>
        ) : liveCount === 0 ? (
          <GlassPanel className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 px-6 py-10 text-center">
            <FolderPlus size={44} className="text-primary-hi" aria-hidden />
            <h2 className="text-[18px] font-semibold">{uz.projects.emptyTitle}</h2>
            <p className="text-[15px] text-text-muted">{uz.projects.emptyText}</p>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={20} aria-hidden />
              {uz.projects.create}
            </Button>
          </GlassPanel>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-text-muted">{uz.projects.noResults}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:gap-3.5 xl:grid-cols-3">
            {list.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={() => openEdit(p.id)}
                onDuplicate={() =>
                  void duplicate(p.id, uniqueName(`${p.name} ${uz.projects.copySuffix}`, projects))
                }
                onDelete={() => openDelete(p.id)}
                onBackup={() => void exportBackup(p.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
