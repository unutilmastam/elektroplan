'use client';

import { Box } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useEditorStore } from '@/store/editorStore';
import { useCurrentProject } from '@/store/projectStore';

// the 3D code (WebGL, textures) loads only when someone opens it
const Room3DView = dynamic(() => import('./Room3DView'), { ssr: false });

/** "3D" on the plan: opens the room you are looking at (the selected one, else the first) in 3D. */
export function Room3DButton({ className }: { className?: string }) {
  const project = useCurrentProject();
  const [open, setOpen] = useState(false);
  const selected = useEditorStore((s) => s.selectedRoomId);
  if (!project || !project.rooms.some((r) => r.deletedAt === null)) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={uz.room3d.open}
        title={uz.room3d.open}
        data-testid="open-3d"
        className={cn(
          'glass absolute top-2 z-10 flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-[13.5px] font-semibold text-text hover:text-white sm:top-2.5 lg:h-10',
          className,
        )}
      >
        <Box size={17} aria-hidden />
        3D
      </button>
      {open ? <Room3DView project={project} roomId={selected} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
