'use client';

import { useRouter } from 'next/navigation';
import { uz } from '@/i18n/uz';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { ProjectFormDialog } from './ProjectFormDialog';

/** Single mount point for create / edit / delete project dialogs. */
export function ProjectDialogs() {
  const router = useRouter();
  const dialog = useUiStore((s) => s.dialog);
  const close = useUiStore((s) => s.closeDialog);
  const target = useProjectStore((s) =>
    dialog && dialog.kind !== 'create'
      ? (s.projects.find((p) => p.id === dialog.id && p.deletedAt === null) ?? null)
      : null,
  );
  const create = useProjectStore((s) => s.create);
  const updateInfo = useProjectStore((s) => s.updateInfo);
  const remove = useProjectStore((s) => s.remove);

  const formOpen = dialog?.kind === 'create' || (dialog?.kind === 'edit' && target !== null);

  return (
    <>
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={(o) => !o && close()}
        mode={dialog?.kind === 'edit' ? 'edit' : 'create'}
        initial={
          target
            ? { name: target.name, customerName: target.customerName, address: target.address }
            : undefined
        }
        onSubmit={async (info) => {
          if (dialog?.kind === 'edit' && target) {
            await updateInfo(target.id, info);
            close();
          } else {
            const id = await create(info);
            close();
            router.push(`/editor/?id=${encodeURIComponent(id)}`);
          }
        }}
      />
      <ConfirmDeleteDialog
        name={dialog?.kind === 'delete' && target ? target.name || uz.header.newProject : null}
        onCancel={close}
        onConfirm={async () => {
          if (target) await remove(target.id);
          close();
        }}
      />
    </>
  );
}
