'use client';

import { BrickWall, DoorOpen, Scissors, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TextField } from '@/components/common/TextField';
import { Button } from '@/components/ui/button';
import type { Opening, Wall } from '@/domain/types';
import { formatLength, lengthCm, parseLength } from '@/domain/dimensions';
import { uz } from '@/i18n/uz';
import { useCurrentProject } from '@/store/projectStore';
import { deleteSelection, renameWall, setSelectedWallLength, splitSelectedWall } from '../actions';
import { PanelShell } from './PanelShell';

/** "Tanlangan devor": optional name, which rooms use it, split, delete; move by dragging. */
export function WallPanel({ wall, showTitle }: { wall: Wall; showTitle: boolean }) {
  const project = useCurrentProject();
  const names = wall.roomIds.map((id) => project?.rooms.find((r) => r.id === id)?.name).filter(Boolean);
  const [name, setName] = useState(wall.name ?? '');
  useEffect(() => setName(wall.name ?? ''), [wall.id, wall.name]);
  const commit = () => renameWall(wall.id, name);
  const current = formatLength(lengthCm(wall.a, wall.b), uz.units);
  const [len, setLen] = useState(current);
  const [lenError, setLenError] = useState('');
  useEffect(() => {
    setLen(current);
    setLenError('');
  }, [wall.id, current]);
  const commitLength = () => {
    if (len.trim() === '' || len === current) return setLen(current);
    const cm = parseLength(len);
    if (cm === null) return setLenError(uz.walls.lengthInvalid);
    setLenError('');
    if (!setSelectedWallLength(wall.id, cm)) setLenError(uz.walls.lengthCantChange);
  };
  return (
    <PanelShell icon={BrickWall} title={uz.walls.panelTitle} showTitle={showTitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <TextField
          label={uz.walls.name}
          placeholder={uz.walls.namePlaceholder}
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          data-testid="wall-name"
        />
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commitLength();
        }}
      >
        <TextField
          label={uz.walls.length}
          hint={uz.walls.lengthHint}
          placeholder={uz.walls.lengthPlaceholder}
          value={len}
          inputMode="decimal"
          error={lenError || undefined}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setLen(e.target.value)}
          onBlur={commitLength}
          data-testid="wall-length"
        />
      </form>
      <p className="text-[15px]">
        {wall.roomIds.length === 2 ? uz.walls.shared : wall.roomIds.length === 0 ? uz.walls.free : ''}
        {names.length ? (
          <span className="text-text-muted">
            {wall.roomIds.length === 2 ? ': ' : ''}
            {names.join(' / ')}
          </span>
        ) : null}
      </p>
      <p className="text-[14px] text-text-muted">{uz.walls.moveHint}</p>
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-1">
        <Button variant="danger" className="h-11 px-2" onClick={() => deleteSelection()}>
          <Trash2 size={18} aria-hidden />
          {uz.walls.delete}
        </Button>
        <Button
          className="h-11 px-2"
          aria-label={uz.walls.split}
          title={uz.walls.split}
          onClick={() => splitSelectedWall(wall.id)}
        >
          <Scissors size={18} aria-hidden />
          {uz.walls.splitShort}
        </Button>
      </div>
    </PanelShell>
  );
}

export function OpeningPanel({ opening, showTitle }: { opening: Opening; showTitle: boolean }) {
  return (
    <PanelShell
      icon={DoorOpen}
      title={opening.kind === 'door' ? uz.opening.door : uz.opening.window}
      showTitle={showTitle}
    >
      <p className="text-[14px] text-text-muted">{uz.opening.moveHint}</p>
      <Button variant="danger" className="mt-auto h-11" onClick={() => deleteSelection()}>
        <Trash2 size={18} aria-hidden />
        {uz.opening.delete}
      </Button>
    </PanelShell>
  );
}
