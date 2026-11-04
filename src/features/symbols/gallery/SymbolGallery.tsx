'use client';

import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GlassPanel } from '@/components/layout/GlassPanel';
import { Button } from '@/components/ui/button';
import type { SymbolCategory } from '@/domain/types';
import { uz } from '@/i18n/uz';
import { SYMBOL_COLORS, SYMBOL_IDS, SYMBOLS } from '../catalog';
import { SymbolIcon } from '../SymbolIcon';

const ZoomStrip = dynamic(() => import('./ZoomStrip'), { ssr: false });

const SIZES = [16, 24, 32, 48, 64] as const;
const COLORS = [
  SYMBOL_COLORS.blue,
  SYMBOL_COLORS.red,
  SYMBOL_COLORS.green,
  SYMBOL_COLORS.yellow,
  SYMBOL_COLORS.purple,
];
const ZOOM_LABELS = ['50%', '100%', '200%', '400%'];
const CATEGORIES: SymbolCategory[] = ['socket', 'switch', 'data', 'lighting', 'climate', 'custom'];

/** Sozlamalar → Belgilar galereyasi: every symbol from the single catalog, at sizes, colours and zoom levels. */
export function SymbolGallery() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:p-2.5 lg:gap-3.5 lg:p-3.5">
      <GlassPanel as="header" className="flex shrink-0 items-center gap-3 px-4 py-3 lg:px-5 lg:py-4">
        <Button asChild size="icon" className="shrink-0" aria-label={uz.settings.title}>
          <Link href="/settings/">
            <ArrowLeft size={20} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold lg:text-[26px]">{uz.symbols.gallery}</h1>
          <p className="text-[14px] text-text-muted">{uz.symbols.galleryHint}</p>
        </div>
      </GlassPanel>

      {CATEGORIES.map((cat) => {
        const ids = SYMBOL_IDS.filter((id) => SYMBOLS[id].category === cat);
        return (
          <GlassPanel key={cat} className="flex shrink-0 flex-col gap-3 p-4">
            <h2 className="text-[13px] font-medium tracking-wide text-text-dim uppercase">
              {uz.symbols.category[cat]}
            </h2>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ids.map((id) => (
                <li
                  key={id}
                  data-testid="gallery-symbol"
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0b1322]/70 p-3"
                >
                  <div className="flex items-center gap-3">
                    <SymbolIcon id={id} size={40} title={uz.symbols[id]} />
                    <div className="min-w-0">
                      <div className="font-medium">{uz.symbols[id]}</div>
                      <div className="font-mono text-[12px] text-text-dim">{id}</div>
                    </div>
                    <div className="ml-auto text-text">
                      <SymbolIcon id={id} size={28} variant="glyph" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-3" aria-label={uz.symbols.sizes}>
                    {SIZES.map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <SymbolIcon id={id} size={s} />
                        <span className="tabular text-[11px] text-text-dim">{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2" aria-label={uz.symbols.colors}>
                    {COLORS.map((c) => (
                      <SymbolIcon key={c} id={id} size={28} color={c} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </GlassPanel>
        );
      })}

      <GlassPanel className="flex shrink-0 flex-col gap-3 p-4">
        <h2 className="text-[13px] font-medium tracking-wide text-text-dim uppercase">{uz.symbols.zoom}</h2>
        <div className="no-scrollbar overflow-x-auto">
          <div className="grid w-[560px] grid-cols-4 text-center text-[13px] text-text-muted">
            {ZOOM_LABELS.map((z) => (
              <span key={z}>{z}</span>
            ))}
          </div>
          <div className="w-[560px]" data-testid="zoom-strip">
            <ZoomStrip ids={SYMBOL_IDS} />
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
