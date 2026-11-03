'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { uz } from '@/i18n/uz';

interface HintProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/** Hover tooltip for an enabled control. */
export function Hint({ label, children, side = 'bottom' }: HintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

interface NextPhaseProps {
  children: ReactNode;
  side?: HintProps['side'];
  className?: string;
}

/**
 * Wraps a DISABLED control that belongs to a later phase and shows "Keyingi bosqichda".
 * The wrapper span receives hover/focus because disabled buttons swallow pointer events.
 */
export function NextPhase({ children, side = 'bottom', className }: NextPhaseProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          title={uz.generic.nextPhase}
          className={className ?? 'inline-flex'}
          data-next-phase=""
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{uz.generic.nextPhase}</TooltipContent>
    </Tooltip>
  );
}
