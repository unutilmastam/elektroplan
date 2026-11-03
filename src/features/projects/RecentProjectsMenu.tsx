'use client';

import { Folder, FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AnchoredMenu } from '@/components/common/AnchoredMenu';
import { recentProjects } from '@/domain/projectList';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';

const item = 'flex h-11 items-center gap-3 rounded-lg px-2.5 text-left text-[15px] hover:bg-white/[0.06]';

/** Header folder tile → "So'nggi loyihalar" (5 most recent) + all projects + new project. */
export function RecentProjectsMenu() {
  const projects = useProjectStore((s) => s.projects);
  const currentId = useProjectStore((s) => s.currentId);
  const openCreate = useUiStore((s) => s.openCreate);
  const recent = useMemo(() => recentProjects(projects, 5), [projects]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={uz.projects.switch}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-[#0e1a33] transition-colors hover:border-white/25 md:h-12 md:w-12 lg:h-[54px] lg:w-[54px] lg:rounded-[12px]"
      >
        <Folder
          className="h-6 w-6 text-primary-hi md:h-7 md:w-7 lg:h-8 lg:w-8"
          fill="currentColor"
          strokeWidth={1.3}
          aria-hidden
        />
      </button>
      <AnchoredMenu anchorRef={ref} open={open} onClose={close} width={300} label={uz.projects.recent}>
        <div className="px-2.5 pt-1 pb-1 text-[12px] font-medium tracking-wide text-text-dim uppercase">
          {uz.projects.recent}
        </div>
        {recent.map((p) => (
          <Link
            key={p.id}
            role="menuitem"
            href={`/editor/?id=${encodeURIComponent(p.id)}`}
            onClick={close}
            aria-current={p.id === currentId ? 'true' : undefined}
            className={`${item} aria-[current]:bg-primary/25`}
          >
            <Folder size={18} className="shrink-0 text-primary-hi" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="tabular text-[13px] text-text-muted">{p.percent}%</span>
          </Link>
        ))}
        <div className="my-1 h-px bg-white/[0.08]" />
        <Link role="menuitem" href="/projects/" onClick={close} className={item}>
          <FolderOpen size={18} className="text-text-muted" aria-hidden />
          {uz.projects.all}
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            close();
            openCreate();
          }}
          className={item}
        >
          <Plus size={18} className="text-text-muted" aria-hidden />
          {uz.projects.create}
        </button>
      </AnchoredMenu>
    </>
  );
}
