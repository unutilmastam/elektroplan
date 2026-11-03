'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface AnchoredMenuProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  width: number;
  label: string;
  children: ReactNode;
  /** below the anchor (default) or to its right (vertical toolbars) */
  placement?: 'below' | 'right';
}

/**
 * Floating menu under an anchor, portalled to <body> so scroll containers don't clip it.
 * Closes on outside pointer, Escape and resize.
 */
export function AnchoredMenu({
  anchorRef,
  open,
  onClose,
  width,
  label,
  children,
  placement = 'below',
}: AnchoredMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return setPos(null);
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    if (placement === 'right')
      setPos({
        left: Math.min(r.right + 8, window.innerWidth - width - 8),
        top: Math.max(8, Math.min(r.top, window.innerHeight - 360)),
      });
    else setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), top: r.bottom + 6 });
  }, [open, anchorRef, width, placement]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !anchorRef.current?.contains(t)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', esc);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', esc);
      window.removeEventListener('resize', onClose);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;
  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      className="glass fixed z-50 flex flex-col gap-1 p-2"
      style={{ left: pos.left, top: pos.top, width, background: 'rgba(14, 22, 40, 0.96)' }}
    >
      {children}
    </div>,
    document.body,
  );
}
