'use client';

import { useId } from 'react';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

/** House outline + lightning bolt, orange → gold gradient (DESIGN_SYSTEM §3). */
export function LogoMark({ size = 72, className }: { size?: number; className?: string }) {
  const gid = `logo-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 88 72" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M10 34 L44 6 L78 34 M18 28 V66 H70 V28 M62 12 V22"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M48 24 L33 46 H44 L40 62 L56 38 H45 Z" fill={`url(#${gid})`} />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center', compact ? 'gap-0' : 'gap-1')}>
      <LogoMark size={compact ? 44 : 82} />
      {compact ? null : (
        <>
          <div className="text-[27px] leading-tight font-bold tracking-[-0.01em]">
            <span className="text-white">{uz.app.nameElektro}</span>
            <span className="text-primary-hi">{uz.app.namePlan}</span>
          </div>
          <div className="text-[14px] text-text-muted">{uz.app.subtitle}</div>
        </>
      )}
    </div>
  );
}
