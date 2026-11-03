'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { uz } from '@/i18n/uz';

interface ConfirmDeleteDialogProps {
  name: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Loyihani o'chirish" confirmation. Open while `name` is non-null. */
export function ConfirmDeleteDialog({ name, onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={name !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent role="alertdialog">
        <div className="flex flex-col gap-4 pr-8">
          <DialogTitle>{uz.projects.deleteTitle}</DialogTitle>
          <DialogDescription>{uz.projects.deleteText.replace('{name}', name ?? '')}</DialogDescription>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onCancel}>{uz.projects.cancel}</Button>
            <Button variant="danger" onClick={onConfirm}>
              <Trash2 size={18} aria-hidden />
              {uz.projects.deleteConfirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
