'use client';

import { ChevronDown, ChevronUp, PlugZap, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '@/store/uiStore';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { ProgressCard } from '@/features/installation/ProgressCard';
import { PropertiesPanel } from '@/features/editor/panels/PropertiesPanel';
import { RoomList } from '@/features/rooms/RoomList';
import { WallViewPanel } from '@/features/wall-view/WallViewPanel';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

type TabKey = 'point' | 'rooms' | 'wall' | 'status';
const TABS: TabKey[] = ['point', 'rooms', 'wall', 'status'];

/**
 * <1024px bottom area. Tablet (600–1023): always-open tabs (rooms / wall / status).
 * Phone (<600) and short screens (phone in landscape): bottom sheet — tab bar always visible, content expands on tap.
 */
export function CompactPanels() {
  const [tab, setTab] = useState<TabKey>('rooms');
  const [open, setOpen] = useState(false);
  useOnPropertiesRequest(() => {
    // phone: open the sheet on "Nuqta"; tablet uses the slide-over instead
    if (window.matchMedia('(max-width: 599px), (max-height: 520px)').matches) {
      setTab('point');
      setOpen(true);
    }
  });

  const pick = (t: TabKey) => {
    if (t === tab) setOpen((o) => !o);
    else {
      setTab(t);
      setOpen(true);
    }
  };

  return (
    <GlassPanel
      className={cn(
        'flex shrink-0 flex-col overflow-hidden rounded-[14px] md:hidden sm:h-[268px]',
        open ? 'h-[46dvh] short:h-[72dvh]!' : 'h-auto short:h-auto!',
      )}
      aria-label={uz.mobile.sheet}
    >
      <div role="tablist" className="flex shrink-0 items-center gap-1 border-b border-white/[0.07] p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => pick(t)}
            className={cn(
              'h-10 flex-1 rounded-[9px] text-[14px] font-medium transition-colors duration-150',
              t === 'point' && 'sm:hidden',
              tab === t ? 'bg-primary text-white' : 'text-text-muted hover:bg-white/[0.05]',
            )}
          >
            {uz.mobile.tabs[t]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? uz.mobile.collapse : uz.mobile.expand}
          className="flex h-10 w-10 items-center justify-center rounded-[9px] text-text-muted sm:hidden short:flex!"
        >
          {open ? <ChevronDown size={20} aria-hidden /> : <ChevronUp size={20} aria-hidden />}
        </button>
      </div>
      <div className={cn('min-h-0 flex-1', open ? 'block' : 'hidden sm:block short:hidden!')} role="tabpanel">
        {tab === 'point' ? <PropertiesPanel showTitle={false} className="sm:hidden" /> : null}
        {tab === 'rooms' || tab === 'point' ? (
          <div className={cn('h-full', tab === 'point' && 'hidden sm:block')}>
            <RoomList showTitle={false} />
          </div>
        ) : null}
        {tab === 'wall' ? <WallViewPanel showTitle={false} /> : null}
        {tab === 'status' ? <ProgressCard showTitle={false} /> : null}
      </div>
    </GlassPanel>
  );
}

/** Tablet (600–1023) slide-over for "Tanlangan nuqta", toggled from the canvas corner. */
export function PointSlideOver() {
  const [open, setOpen] = useState(false);
  useOnPropertiesRequest(() => setOpen(true));
  return (
    <div className="hidden sm:block md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={uz.point.openPanel}
        aria-expanded={open}
        className={cn(
          'glass absolute top-2.5 right-2.5 flex h-11 w-11 items-center justify-center rounded-[12px] text-primary-hi',
          open && 'hidden',
        )}
      >
        <PlugZap size={22} aria-hidden />
      </button>
      <GlassPanel
        as="aside"
        aria-label={uz.point.panelTitle}
        className={cn(
          'absolute top-2.5 right-2.5 bottom-2.5 w-[300px] overflow-hidden transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-[calc(100%+16px)]',
        )}
        style={{ background: 'rgba(14, 22, 40, 0.94)' }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={uz.point.closePanel}
          className="absolute top-2.5 right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:text-text"
        >
          <X size={20} aria-hidden />
        </button>
        <PropertiesPanel />
      </GlassPanel>
    </div>
  );
}

/** Runs `fn` whenever "Xususiyatlar" is requested (context menu). */
function useOnPropertiesRequest(fn: () => void) {
  const req = useUiStore((s) => s.propertiesRequest);
  const first = useRef(req);
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    if (req !== first.current) cb.current();
  }, [req]);
}
