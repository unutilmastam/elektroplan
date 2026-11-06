'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';
import { RealDefs } from '../real/RealDefs';
import { PART_GROUPS, PartArt, type PartId } from './PartArt';

type Group = keyof typeof PART_GROUPS;

/** "Detallar": every part of an installation with a realistic picture, what it is for and where it goes. */
export function PartsCatalog() {
  const p = uz.wiring.parts;
  const [group, setGroup] = useState<Group | 'all'>('all');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const ids = (Object.keys(PART_GROUPS) as Group[])
    .filter((g) => group === 'all' || g === group)
    .flatMap((g) => PART_GROUPS[g].map((id) => ({ id, g })))
    .filter(({ id }) => !query || `${p.items[id].n} ${p.items[id].t}`.toLowerCase().includes(query));
  return (
    <GlassPanel className="flex flex-col gap-3 p-3 sm:p-4" data-testid="parts-catalog">
      <div>
        <h2 className="text-[17px] font-semibold">{p.title}</h2>
        <p className="text-[13.5px] text-text-muted">{p.hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-[220px] flex-1 basis-[260px] items-center gap-2 rounded-lg border border-white/12 bg-[#0a1222] px-3">
          <Search size={16} className="shrink-0 text-text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={p.search}
            aria-label={p.search}
            className="min-w-0 flex-1 bg-transparent text-base outline-none sm:text-[14px]"
          />
        </label>
        <div role="tablist" className="flex flex-wrap gap-1">
          {(['all', ...Object.keys(PART_GROUPS)] as Array<Group | 'all'>).map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={group === g}
              onClick={() => setGroup(g)}
              className={cn(
                'h-9 rounded-lg px-3 text-[13.5px]',
                group === g
                  ? 'bg-primary text-white'
                  : 'border border-white/12 text-text-muted hover:bg-white/[0.05]',
              )}
            >
              {g === 'all'
                ? `${uz.wiring.parts.tab} · ${Object.values(PART_GROUPS).flat().length}`
                : p.groups[g]}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2.5">
        {ids.map(({ id, g }) => (
          <li
            key={id}
            className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
            data-testid="part-card"
          >
            <svg viewBox="0 0 260 200" className="h-auto w-full bg-[#1f2329]" aria-hidden>
              <RealDefs />
              <PartArt id={id as PartId} />
            </svg>
            <div className="flex flex-col gap-1 p-3">
              <span className="text-[11.5px] tracking-wide text-text-dim uppercase">{p.groups[g]}</span>
              <h3 className="text-[15px] font-semibold">{p.items[id].n}</h3>
              <p className="text-[13.5px] text-text-muted">{p.items[id].t}</p>
            </div>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
