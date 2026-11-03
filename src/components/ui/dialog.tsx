'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { uz } from '@/i18n/uz';
import { cn } from '@/lib/cn';

/** shadcn/ui-style dialog. On phones it docks to the bottom like a sheet (thumb-friendly). */
export const Dialog = DialogPrimitive.Root;
export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title ref={ref} className={cn('text-[19px] font-semibold', className)} {...props} />
  );
});
export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-[15px] text-text-muted', className)}
      {...props}
    />
  );
});

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'glass fixed z-50 flex max-h-[92dvh] flex-col overflow-y-auto p-5 outline-none',
          'inset-x-0 bottom-0 rounded-b-none bg-panel-solid/95 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(480px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[16px]',
          className,
        )}
        style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={uz.generic.close}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:text-text"
        >
          <X size={20} aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
