import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Title row + scrollable body shared by the right-hand property panels. */
export function PanelShell({
  icon: Icon,
  title,
  showTitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  showTitle: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showTitle ? (
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-2.5 lg:px-5 lg:pt-4 lg:pb-4">
          <Icon size={22} className="text-primary-hi" aria-hidden />
          <h2 className="text-[16px] font-semibold lg:text-[17px]">{title}</h2>
        </div>
      ) : null}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 max-sm:gap-2.5 max-sm:px-3 max-sm:py-2.5 lg:py-4">
        {children}
      </div>
    </div>
  );
}
