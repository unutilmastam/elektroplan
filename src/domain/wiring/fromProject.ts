import { CONSUMERS, type ConsumerType } from './catalog';
import type { PanelLine } from './panel';
import type { Project, SymbolId } from '../types';

/**
 * PHASE 21 — board circuits from a drawn plan: kitchen and bathroom sockets get their own circuits, other
 * rooms share socket circuits (≤ 8 outlets each), every air conditioner has its own line, lights are grouped.
 */

const OUTLETS: Partial<Record<SymbolId, number>> = {
  'socket-single': 1,
  'socket-double': 2,
  'socket-triple': 3,
  'socket-quad': 4,
};
const KITCHEN = /oshxona|kuxnya|кухн/i;
const BATH = /hammom|vanna|hojatxona|ванн|санузел|туалет|\bwc\b/i;
export const OUTLETS_PER_LINE = 8;
export const LIGHTS_PER_LINE = 12;

export type Namer = (type: ConsumerType, detail: string) => string;

export function linesFromProject(p: Project, name: Namer, makeId: () => string): PanelLine[] {
  const live = p.points.filter((x) => x.deletedAt === null);
  const rooms = p.rooms.filter((r) => r.deletedAt === null).sort((a, b) => a.order - b.order);
  const line = (type: ConsumerType, detail: string): PanelLine => ({
    id: makeId(),
    type,
    name: name(type, detail),
    powerW: CONSUMERS[type].powerW,
  });
  const out: PanelLine[] = [];
  let shared: string[] = [];
  let sharedOutlets = 0;
  const flush = () => {
    if (shared.length) out.push(line('sockets', shared.join(', ')));
    shared = [];
    sharedOutlets = 0;
  };
  for (const r of rooms) {
    const outlets = live.filter((x) => x.roomId === r.id).reduce((s, x) => s + (OUTLETS[x.symbolId] ?? 0), 0);
    if (!outlets) continue;
    if (KITCHEN.test(r.name)) {
      for (let i = 0; i < Math.ceil(outlets / OUTLETS_PER_LINE); i++)
        out.push(line('kitchen-sockets', r.name));
    } else if (BATH.test(r.name)) out.push(line('bathroom-sockets', r.name));
    else {
      if (sharedOutlets + outlets > OUTLETS_PER_LINE) flush();
      shared.push(r.name);
      sharedOutlets += outlets;
    }
  }
  flush();
  const roomName = new Map(rooms.map((r) => [r.id, r.name]));
  for (const ac of live.filter((x) => x.symbolId === 'ac'))
    out.push(line('ac', roomName.get(ac.roomId) ?? ''));
  const lights = live.filter((x) => x.symbolId === 'ceiling-light' || x.symbolId === 'led').length;
  const groups = Math.ceil(lights / LIGHTS_PER_LINE);
  for (let i = 0; i < groups; i++) out.push(line('lighting', groups > 1 ? String(i + 1) : ''));
  return out;
}
