'use client';

import { AlertTriangle, Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { useProjectStore, type SaveState } from '@/store/projectStore';

const time = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

const LABEL: Record<SaveState, string> = {
  get saved() {
    return uz.generic.saved;
  },
  get dirty() {
    return uz.generic.unsaved;
  },
  get saving() {
    return uz.generic.saving;
  },
  get error() {
    return uz.generic.saveFailed;
  },
};

/** "Saqlash": shows the autosave state and writes pending edits immediately when pressed. */
export function SaveButton({ disabled, className }: { disabled: boolean; className?: string }) {
  const state = useProjectStore((s) => s.saveState);
  const at = useProjectStore((s) => s.lastSavedAt);
  const flush = useProjectStore((s) => s.flush);
  const Icon =
    state === 'saving' ? Loader2 : state === 'error' ? AlertTriangle : state === 'saved' && at ? Check : Save;
  return (
    <Button
      disabled={disabled}
      onClick={() => void flush()}
      aria-label={`${uz.header.save} — ${LABEL[state]}`}
      title={at ? uz.generic.savedAt.replace('{time}', time(at)) : uz.generic.saveNow}
      data-save-state={state}
      className={cn(className, state === 'error' && 'border-danger/60 text-[#ff8a8a]')}
    >
      <Icon
        size={22}
        aria-hidden
        className={cn(state === 'saving' && 'animate-spin', state === 'saved' && at && 'text-success')}
      />
      <span className="hidden md:inline">{state === 'saved' && !at ? uz.header.save : LABEL[state]}</span>
    </Button>
  );
}
