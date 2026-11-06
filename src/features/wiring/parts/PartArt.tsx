'use client';

import type { ReactNode } from 'react';
import { boardArt } from './artBoard';
import { boxArt } from './artBox';
import { cableArt } from './artCable';
import { wallArt } from './artWall';

/** PHASE 22 — the picture of each catalogue part (viewBox 260 × 200). Pure SVG, reusing the real parts. */

export type PartId =
  | 'mcb1'
  | 'mcb2'
  | 'mcb3'
  | 'rcd'
  | 'rcbo'
  | 'relay'
  | 'spd'
  | 'isolator'
  | 'contactor'
  | 'impulse'
  | 'timer'
  | 'modsocket'
  | 'meter'
  | 'rail'
  | 'comb'
  | 'nbar'
  | 'pebar'
  | 'enclosure'
  | 'wago412'
  | 'wago413'
  | 'wago415'
  | 'wago2273'
  | 'siz'
  | 'terminal'
  | 'jbox'
  | 'switch1'
  | 'switch2'
  | 'switch3'
  | 'pass'
  | 'dimmer'
  | 'motion'
  | 'socket'
  | 'socket2'
  | 'socketIp44'
  | 'socketStove'
  | 'backbox'
  | 'lamp'
  | 'vvg2'
  | 'vvg3'
  | 'vvg325'
  | 'vvg34'
  | 'vvg36'
  | 'vvg5'
  | 'input'
  | 'pvs'
  | 'corrugated'
  | 'channel'
  | 'clips';

export const PART_GROUPS: Record<'board' | 'box' | 'wall' | 'cable', PartId[]> = {
  board: [
    'mcb1',
    'mcb2',
    'mcb3',
    'rcd',
    'rcbo',
    'relay',
    'spd',
    'isolator',
    'contactor',
    'impulse',
    'timer',
    'modsocket',
    'meter',
    'rail',
    'comb',
    'nbar',
    'pebar',
    'enclosure',
  ],
  box: ['wago412', 'wago413', 'wago415', 'wago2273', 'siz', 'terminal', 'jbox'],
  wall: [
    'switch1',
    'switch2',
    'switch3',
    'pass',
    'dimmer',
    'motion',
    'socket',
    'socket2',
    'socketIp44',
    'socketStove',
    'backbox',
    'lamp',
  ],
  cable: [
    'vvg2',
    'vvg3',
    'vvg325',
    'vvg34',
    'vvg36',
    'vvg5',
    'input',
    'pvs',
    'corrugated',
    'channel',
    'clips',
  ],
};

export function PartArt({ id }: { id: PartId }): ReactNode {
  return boardArt(id) ?? boxArt(id) ?? wallArt(id) ?? cableArt(id);
}
