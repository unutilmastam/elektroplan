'use client';

import { FileDown, Folder, Pencil, Play, Save } from 'lucide-react';
import Link from 'next/link';
import { NextPhase } from '@/components/common/Hint';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';

/** Top header: project name, customer, address + Saqlash / Eksport PDF / Montaj rejimi. */
export function ProjectHeader() {
  const project = useProjectStore((s) => s.project);
  const name = project?.name || uz.header.newProject;
  const installHref = project ? `/install/?id=${encodeURIComponent(project.id)}` : '/install/';
  return (
    <GlassPanel
      as="header"
      className="flex shrink-0 items-center gap-3 rounded-[14px] px-2.5 py-2 md:px-3 md:py-2.5 lg:rounded-[16px] lg:px-3.5 lg:py-3"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-[#0e1a33] md:h-12 md:w-12 lg:h-[54px] lg:w-[54px] lg:rounded-[12px]">
        <Folder
          className="h-6 w-6 text-primary-hi md:h-7 md:w-7 lg:h-8 lg:w-8"
          fill="currentColor"
          strokeWidth={1.3}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <h1 className="truncate text-[17px] sm:text-[18px] leading-tight font-semibold md:text-[22px] lg:text-[26px]">
            {name}
          </h1>
          <NextPhase className="hidden sm:inline-flex">
            <button
              type="button"
              disabled
              aria-label={uz.header.editProject}
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted disabled:opacity-80"
            >
              <Pencil size={18} aria-hidden />
            </button>
          </NextPhase>
        </div>
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
      </div>
      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <NextPhase>
          <Button
            disabled
            aria-label={uz.header.save}
            className="w-11 px-0 md:w-auto md:px-4 lg:h-[52px] lg:px-4 lg:text-[16px]"
          >
            <Save size={22} aria-hidden />
            <span className="hidden md:inline">{uz.header.save}</span>
          </Button>
        </NextPhase>
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
