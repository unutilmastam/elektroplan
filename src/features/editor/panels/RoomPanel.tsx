'use client';

import { Copy, House, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ColorSwatches } from '@/components/common/ColorSwatches';
import { TextField } from '@/components/common/TextField';
import { Button } from '@/components/ui/button';
import { ROOM_COLORS } from '@/domain/rooms';
import type { Room } from '@/domain/types';
import { countOf } from '@/i18n/plural';
import { uz } from '@/i18n/uz';
import { useCurrentProject } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { deleteSelection, duplicateSelectedRoom, renameRoom, setRoomColor } from '../actions';
import { PanelShell } from './PanelShell';

const SWATCHES = ROOM_COLORS.map((value, i) => ({
  value,
  get label() {
    return uz.room.colorNames[i] ?? value;
  },
}));

/** "Tanlangan xona": name, colour, copy, delete. Double tap on a room focuses the name. */
export function RoomPanel({ room, showTitle }: { room: Room; showTitle: boolean }) {
  const project = useCurrentProject();
  const [name, setName] = useState(room.name);
  const input = useRef<HTMLInputElement>(null);
  const renameRequest = useUiStore((s) => s.renameRequest);
  useEffect(() => setName(room.name), [room.id, room.name]);
  useEffect(() => {
    if (renameRequest?.roomId === room.id) {
      input.current?.focus();
      input.current?.select();
    }
  }, [renameRequest, room.id]);
  const points = project?.points.filter((p) => p.deletedAt === null && p.roomId === room.id).length ?? 0;
  const commit = () => (name.trim() ? renameRoom(room.id, name) : setName(room.name));

  return (
    <PanelShell icon={House} title={uz.room.panelTitle} showTitle={showTitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
          input.current?.blur();
        }}
      >
        <TextField
          ref={input}
          label={uz.room.name}
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
        />
      </form>
      <div className="flex flex-col gap-2.5">
        <span className="text-[14px]">{uz.room.color}</span>
        <ColorSwatches swatches={SWATCHES} value={room.color} onChange={(c) => setRoomColor(room.id, c)} />
      </div>
      <p className="tabular text-[14px] text-text-muted">{countOf(points, uz.room.points)}</p>
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-1">
        <Button variant="danger" className="h-11 px-2" onClick={() => deleteSelection()}>
          <Trash2 size={18} aria-hidden />
          {uz.room.delete}
        </Button>
        <Button className="h-11 px-2" onClick={() => duplicateSelectedRoom(room.id)}>
          <Copy size={18} aria-hidden />
          {uz.room.duplicate}
        </Button>
      </div>
    </PanelShell>
  );
}
