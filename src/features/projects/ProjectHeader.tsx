'use client';

import { FileDown, Pencil, Play } from 'lucide-react';
import Link from 'next/link';
import { Hint, NextPhase } from '@/components/common/Hint';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { useCurrentProject, useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { RecentProjectsMenu } from './RecentProjectsMenu';
import { SaveButton } from './SaveButton';

/** Top header: project name, customer, address + Saqlash / Eksport PDF / Montaj rejimi. */
export function ProjectHeader() {
  const project = useCurrentProject();
  const isDemo = useProjectStore((s) => s.demo !== null);
  const openEdit = useUiStore((s) => s.openEdit);
  const editable = project !== null && !isDemo;
  const name = project ? project.name || uz.header.newProject : uz.projects.noProject;
  const installHref = project ? `/install/?id=${encodeURIComponent(project.id)}` : '/install/';
  return (
    <GlassPanel
      as="header"
      className="flex shrink-0 items-center gap-3 rounded-[14px] px-2.5 py-2 md:px-3 md:py-2.5 lg:rounded-[16px] lg:px-3.5 lg:py-3"
    >
      <RecentProjectsMenu />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <h1 className="truncate text-[17px] sm:text-[18px] leading-tight font-semibold md:text-[22px] lg:text-[26px]">
            {name}
          </h1>
          {editable ? (
            <Hint label={uz.header.editProject}>
              <button
                type="button"
                onClick={() => openEdit(project.id)}
                aria-label={uz.header.editProject}
                className="hidden h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-white/[0.06] hover:text-text sm:flex"
              >
                <Pencil size={18} aria-hidden />
              </button>
            </Hint>
          ) : null}
        </div>
        {project ? (
          <div className="mt-0.5 flex min-w-0 items-center gap-3 truncate text-[12.5px] text-text-muted md:text-[14px] lg:mt-1 lg:text-[16px]">
            <span className="truncate">
              <span className="hidden sm:inline">{uz.header.customer}: </span>
              <span className="text-text/90">{project?.customerName || uz.header.empty}</span>
            </span>
            <span className="h-4 w-px shrink-0 bg-white/25" aria-hidden />
            <span className="truncate">
              <span className="hidden sm:inline">{uz.header.address}: </span>
              <span className="text-text/90">{project?.address || uz.header.empty}</span>
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <SaveButton
          disabled={!editable}
          className="w-11 px-0 md:w-auto md:min-w-[150px] md:px-4 lg:h-[52px] lg:px-4 lg:text-[16px]"
        />
        <NextPhase>
          <Button
            disabled
            aria-label={uz.header.exportPdf}
            className="w-11 px-0 md:w-auto md:px-4 lg:h-[52px] lg:px-4 lg:text-[16px]"
          >
            <FileDown size={22} aria-hidden />
            <span className="hidden md:inline">{uz.header.exportPdf}</span>
          </Button>
        </NextPhase>
        <Button
          asChild
          variant="primary"
          className="w-11 px-0 sm:w-auto sm:px-4 lg:h-[52px] lg:px-5 lg:text-[16px]"
        >
          <Link href={installHref} aria-label={uz.header.installMode}>
            <span className="hidden sm:inline">{uz.header.installMode}</span>
            <Play size={18} fill="currentColor" aria-hidden />
          </Link>
        </Button>
      </div>
    </GlassPanel>
  );
}
