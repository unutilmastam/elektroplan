'use client';

import { Copy, Folder, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Hint } from '@/components/common/Hint';
import { Button } from '@/components/ui/button';
import type { ProjectSummary } from '@/domain/projectList';
import { uz } from '@/i18n/uz';
import { formatDateTime } from '@/lib/format';

interface ProjectCardProps {
  project: ProjectSummary;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Hint label={label} side="top">
      <Button variant={danger ? 'danger' : 'secondary'} size="icon" aria-label={label} onClick={onClick}>
        {children}
      </Button>
    </Hint>
  );
}

/** One project in the "Loyihalar" list. */
export function ProjectCard({ project: p, onEdit, onDuplicate, onDelete }: ProjectCardProps) {
  const href = `/editor/?id=${encodeURIComponent(p.id)}`;
  return (
    <li className="glass flex flex-col gap-3 p-4" data-testid="project-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-[#0e1a33]">
          <Folder className="h-6 w-6 text-primary-hi" fill="currentColor" strokeWidth={1.3} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold">
            <Link href={href} className="hover:text-primary-hi">
              {p.name}
            </Link>
          </h2>
          <p className="truncate text-[14px] text-text-muted">
            {[p.customerName, p.address].filter(Boolean).join(' · ') || uz.header.empty}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-muted">
        <span className="tabular">
          {p.roomCount} {uz.projects.rooms}
        </span>
        <span className="tabular">
          {p.pointCount} {uz.projects.points}
        </span>
        <span className="tabular">
          {uz.projects.updated}: {formatDateTime(p.updatedAt)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={p.percent}
          aria-label={uz.status.title}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4ade80] to-[#16a34a]"
            style={{ width: `${p.percent}%` }}
          />
        </div>
        <span className="tabular w-10 text-right text-[14px] font-medium">{p.percent}%</span>
      </div>
      <div className="flex items-center gap-2" aria-label={uz.projects.actions}>
        <Button asChild variant="primary" className="flex-1">
          <Link href={href}>{uz.projects.open}</Link>
        </Button>
        <IconAction label={uz.projects.edit} onClick={onEdit}>
          <Pencil size={18} aria-hidden />
        </IconAction>
        <IconAction label={uz.projects.duplicate} onClick={onDuplicate}>
          <Copy size={18} aria-hidden />
        </IconAction>
        <IconAction label={uz.projects.delete} onClick={onDelete} danger>
          <Trash2 size={18} aria-hidden />
        </IconAction>
      </div>
    </li>
  );
}
