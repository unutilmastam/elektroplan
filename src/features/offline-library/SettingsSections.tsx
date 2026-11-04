'use client';

import {
  CheckCircle2,
  CloudOff,
  Download,
  FolderDown,
  FolderUp,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';
import { usePwaStore } from '@/store/pwaStore';
import { exportBackup, importBackup } from './backupActions';
import { BACKUP_EXT } from '@/domain/backup';

function Row({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Icon size={24} className="mt-0.5 shrink-0 text-primary-hi" aria-hidden />
        <div className="min-w-0">
          <div className="text-[16px] font-medium">{title}</div>
          <p className="mt-1 text-[14px] text-text-muted">{text}</p>
        </div>
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2 pl-10 sm:pl-0">{children}</div> : null}
    </div>
  );
}

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="px-3 pt-2 pb-1 text-[13px] font-medium tracking-wide text-text-dim uppercase">{children}</h2>
);

/** "Ilova": install (Android/Windows prompt, iOS steps) + offline guarantee. */
export function AppSettings() {
  const { platform, standalone, installEvent, install } = usePwaStore();
  const manual =
    platform === 'ios'
      ? uz.pwa.installIos
      : platform === 'android'
        ? uz.pwa.installAndroid
        : uz.pwa.installDesktop;
  return (
    <GlassPanel className="flex flex-col gap-1 p-2">
      <H2>{uz.pwa.app}</H2>
      {standalone ? (
        <Row icon={CheckCircle2} title={uz.pwa.installed} text={uz.pwa.installedHint} />
      ) : (
        <Row
          icon={Download}
          title={uz.pwa.install}
          text={installEvent ? uz.pwa.installHint : `${uz.pwa.installHint} ${manual}`}
        >
          {installEvent ? (
            <Button variant="primary" onClick={() => void install()} data-testid="install-app">
              <Download size={18} aria-hidden />
              {uz.pwa.install}
            </Button>
          ) : null}
        </Row>
      )}
      <Row icon={CloudOff} title={uz.pwa.offlineReady} text={uz.pwa.offlineReadyHint} />
    </GlassPanel>
  );
}

/** "Zaxira nusxa": all projects to a file, restore from a file. */
export function BackupSettings() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const count = useProjectStore((s) => s.projects.filter((p) => p.deletedAt === null).length);
  const run = async (kind: 'export' | 'import', job: () => Promise<void>) => {
    setBusy(kind);
    try {
      await job();
    } finally {
      setBusy(null);
    }
  };
  return (
    <GlassPanel className="flex flex-col gap-1 p-2">
      <H2>{uz.backup.title}</H2>
      <Row icon={FolderDown} title={uz.backup.title} text={uz.backup.hint}>
        <Button
          onClick={() => void run('export', () => exportBackup())}
          disabled={busy !== null || count === 0}
          data-testid="backup-export-all"
        >
          {busy === 'export' ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <FolderDown size={18} aria-hidden />
          )}
          {uz.backup.exportAll}
        </Button>
        <Button onClick={() => input.current?.click()} disabled={busy !== null} data-testid="backup-import">
          {busy === 'import' ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <FolderUp size={18} aria-hidden />
          )}
          {busy === 'import' ? uz.backup.importing : uz.backup.import}
        </Button>
        <input
          ref={input}
          type="file"
          accept={`${BACKUP_EXT},.json,application/json`}
          className="hidden"
          aria-label={uz.backup.import}
          data-testid="backup-file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void run('import', () => importBackup(f));
          }}
        />
      </Row>
    </GlassPanel>
  );
}
