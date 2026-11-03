import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type GlassPanelProps = HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'aside' | 'header' | 'nav' };

/** Glass surface from DESIGN_SYSTEM §2. */
export function GlassPanel({ as: Tag = 'section', className, ...props }: GlassPanelProps) {
  return <Tag className={cn('glass', className)} {...props} />;
}
