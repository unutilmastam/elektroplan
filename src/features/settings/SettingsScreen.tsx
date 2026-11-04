'use client';

import { ChevronRight, PenLine, Shapes, Wand2, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { AccountRow } from '@/features/auth/AccountRow';
import { AppSettings, BackupSettings } from '@/features/offline-library';
import { OfflineBadge } from '@/features/offline-library/ConnectionBadge';
import { useSettingsStore } from '@/store/settingsStore';
import { ProjectDefaults } from './ProjectDefaults';

function SwitchRow({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-4 rounded-xl px-3 py-3">
      <Icon size={24} className="mt-0.5 shrink-0 text-primary-hi" aria-hidden />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-[16px] font-medium">
          {label}
        </label>
        <p className="mt-1 text-[14px] text-text-muted">{hint}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative mt-0.5 h-8 w-[52px] shrink-0 rounded-full transition-colors duration-150',
          value ? 'bg-primary' : 'bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-150',
            value && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}

/** Sozlamalar: per-device preferences (stored in IndexedDB meta, work offline). */
export function SettingsScreen() {
  const penOnly = useSettingsStore((s) => s.penOnly);
  const autoStraighten = useSettingsStore((s) => s.autoStraighten);
  const update = useSettingsStore((s) => s.update);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-5 py-4">
        <h1 className="flex-1 text-[22px] font-semibold lg:text-[26px]">{uz.settings.title}</h1>
        <OfflineBadge />
      </GlassPanel>
      <AccountRow />
      <GlassPanel className="flex flex-col gap-1 p-2">
        <h2 className="px-3 pt-2 pb-1 text-[13px] font-medium tracking-wide text-text-dim uppercase">
          {uz.settings.device}
        </h2>
        <SwitchRow
          icon={PenLine}
          label={uz.settings.penOnly}
          hint={uz.settings.penOnlyHint}
          value={penOnly}
          onChange={(v) => void update({ penOnly: v })}
        />
        <SwitchRow
          icon={Wand2}
          label={uz.settings.autoStraighten}
          hint={uz.settings.autoStraightenHint}
          value={autoStraighten}
          onChange={(v) => void update({ autoStraighten: v })}
        />
      </GlassPanel>
      <ProjectDefaults />
      <BackupSettings />
      <AppSettings />
      <GlassPanel className="flex flex-col gap-1 p-2">
        <h2 className="px-3 pt-2 pb-1 text-[13px] font-medium tracking-wide text-text-dim uppercase">
          {uz.settings.library}
        </h2>
        <Link
          href="/settings/symbols/"
          className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-white/[0.04]"
        >
          <Shapes size={24} className="shrink-0 text-primary-hi" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-medium">{uz.symbols.gallery}</div>
            <p className="mt-1 text-[14px] text-text-muted">{uz.symbols.galleryHint}</p>
          </div>
          <ChevronRight size={20} className="text-text-muted" aria-hidden />
        </Link>
      </GlassPanel>
      <p className="px-2 text-[14px] text-text-muted">{uz.settings.more}</p>
    </div>
  );
}
