'use client';

import { FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import type { LoadStatus } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';

/** Canvas overlay when no project is open (or `?id=` points to a missing one). */
export function NoProjectState({ notFound, status }: { notFound: boolean; status: LoadStatus }) {
  const openCreate = useUiStore((s) => s.openCreate);
  if (status === 'idle' || status === 'loading')
    return <p className="text-text-muted">{uz.projects.loading}</p>;
  if (status === 'error')
    return (
      <p role="alert" className="text-[#ff7b7b]">
        {uz.projects.loadError}
      </p>
    );
  return (
    <>
      <div className="text-[18px] font-semibold">
        {notFound ? uz.projects.notFound : uz.projects.noProject}
      </div>
      <div className="max-w-sm text-[14px] text-text-muted">
        {notFound ? uz.projects.notFoundHint : uz.projects.noProjectHint}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2.5">
        <Button variant="primary" onClick={openCreate}>
          <Plus size={20} aria-hidden />
          {uz.projects.create}
        </Button>
        <Button asChild>
          <Link href="/projects/">
            <FolderOpen size={20} aria-hidden />
            {uz.projects.all}
          </Link>
        </Button>
      </div>
    </>
  );
}
