import { Construction } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { uz } from '@/i18n/uz';
import { AppShell } from './AppShell';
import { GlassPanel } from './GlassPanel';

/** Route that exists (navigation works) but whose feature belongs to a later phase. */
export function PlaceholderPage({
  title,
  text,
  later = true,
}: {
  title: string;
  text: string;
  later?: boolean;
}) {
  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 sm:p-2.5 lg:p-3.5">
        <GlassPanel as="header" className="flex shrink-0 items-center px-5 py-4">
          <h1 className="text-[22px] font-semibold lg:text-[26px]">{title}</h1>
        </GlassPanel>
        <GlassPanel className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Construction size={44} className="text-primary-hi" aria-hidden />
          <p className="max-w-md text-[16px] text-text-muted">{text}</p>
          {later ? (
            <span className="rounded-full bg-primary/20 px-3 py-1 text-[13px] text-primary-hi">
              {uz.generic.nextPhase}
            </span>
          ) : null}
          <Button asChild variant="secondary">
            <Link href="/">{uz.pages.backHome}</Link>
          </Button>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
