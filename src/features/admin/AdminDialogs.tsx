'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { uz } from '@/i18n/uz';

export function ConfirmDialog({
  text,
  onYes,
  onNo,
}: {
  text: string | null;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Dialog open={text !== null} onOpenChange={(o) => !o && onNo()}>
      <DialogContent>
        <DialogTitle className="text-[18px] font-semibold">{uz.admin.title}</DialogTitle>
        <DialogDescription className="text-[15px] text-text-muted">{text}</DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onNo}>{uz.admin.no}</Button>
          <Button variant="primary" onClick={onYes}>
            {uz.admin.yes}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The temporary password, shown once, with a copy button. */
export function TempPasswordDialog({
  value,
  name,
  onClose,
}: {
  value: string | null;
  name: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open={value !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="temp-password">
        <DialogTitle className="text-[18px] font-semibold">{uz.admin.tempTitle}</DialogTitle>
        <DialogDescription className="text-[15px] text-text-muted">
          {uz.admin.tempText.replace('{name}', name)}
        </DialogDescription>
        <div
          className="mt-3 rounded-xl border border-white/15 bg-[#0a1222] px-4 py-4 text-center font-mono text-[26px] font-semibold tracking-wider select-all"
          data-testid="temp-password-value"
        >
          {value}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => {
              if (!value) return;
              void navigator.clipboard?.writeText(value).then(
                () => setCopied(true),
                () => undefined,
              );
            }}
          >
            <Copy size={16} aria-hidden />
            {copied ? uz.admin.copied : uz.admin.copy}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setCopied(false);
              onClose();
            }}
          >
            {uz.admin.done}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
