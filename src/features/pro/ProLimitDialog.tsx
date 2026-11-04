'use client';

import { Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { FREE_PROJECTS } from '@/domain/plan';
import { uz } from '@/i18n/uz';

/** Shown instead of "Yangi loyiha" when the free plan already has its project. */
export function ProLimitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="pro-limit">
        <div className="flex flex-col items-center gap-3 text-center">
          <Crown size={44} className="text-pro-gold" fill="currentColor" strokeWidth={1.3} aria-hidden />
          <DialogTitle className="text-[20px] font-semibold">{uz.pro.limitTitle}</DialogTitle>
          <DialogDescription className="text-[15px] text-text-muted">
            {uz.pro.limitText.replace('{limit}', String(FREE_PROJECTS))}
          </DialogDescription>
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row-reverse">
            <Button asChild variant="gold" size="lg" className="flex-1">
              <Link href="/pro/" onClick={onClose}>
                {uz.pro.open}
              </Link>
            </Button>
            <Button size="lg" className="flex-1" onClick={onClose}>
              {uz.pro.later}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
