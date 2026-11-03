'use client';

import { useState, type FormEvent } from 'react';
import { TextField } from '@/components/common/TextField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { LIMITS, validateProjectInfo, type FieldErrors, type ProjectInfo } from '@/domain/schemas';
import { uz } from '@/i18n/uz';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: ProjectInfo;
  onSubmit: (info: ProjectInfo) => Promise<void> | void;
}

const EMPTY: ProjectInfo = { name: '', customerName: '', address: '' };

/** Create / edit project (nom, buyurtmachi, manzil). Validated with zod; errors in Uzbek. */
export function ProjectFormDialog({ open, onOpenChange, mode, initial, onSubmit }: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        {/* Remount the form each time it opens so it starts from `initial`. */}
        {open ? (
          <ProjectForm
            mode={mode}
            initial={initial ?? EMPTY}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  mode,
  initial,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial: ProjectInfo;
  onSubmit: (info: ProjectInfo) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ProjectInfo>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const field = (k: keyof ProjectInfo) => ({
    value: values[k],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [k]: e.target.value }));
      if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
    },
    error: errors[k] ? uz.validation[errors[k]] : undefined,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = validateProjectInfo(values);
    if (!r.ok) return setErrors(r.errors);
    setBusy(true);
    try {
      await onSubmit(r.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="pr-10">
        <DialogTitle>{mode === 'create' ? uz.projects.createTitle : uz.projects.editTitle}</DialogTitle>
        {mode === 'create' ? (
          <DialogDescription className="mt-1">{uz.projects.emptyText}</DialogDescription>
        ) : null}
      </div>
      <TextField
        label={uz.projects.name}
        placeholder={uz.projects.namePlaceholder}
        autoFocus
        maxLength={LIMITS.name + 20}
        autoComplete="off"
        {...field('name')}
      />
      <TextField
        label={uz.projects.customer}
        hint={uz.projects.optional}
        placeholder={uz.projects.customerPlaceholder}
        maxLength={LIMITS.customer + 20}
        autoComplete="off"
        {...field('customerName')}
      />
      <TextField
        label={uz.projects.address}
        hint={uz.projects.optional}
        placeholder={uz.projects.addressPlaceholder}
        maxLength={LIMITS.address + 20}
        autoComplete="off"
        {...field('address')}
      />
      <div className="mt-1 grid grid-cols-2 gap-3">
        <Button type="button" onClick={onCancel}>
          {uz.projects.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {mode === 'create' ? uz.projects.submitCreate : uz.projects.submitSave}
        </Button>
      </div>
    </form>
  );
}
