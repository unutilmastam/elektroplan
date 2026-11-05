/** Domain types — docs/DATA_MODEL.md §1. Pure data, no React/Konva. */
export type UUID = string;
export type Vec2 = { x: number; y: number };

export type PointStatus = 'pending' | 'in_progress' | 'completed';

export type SymbolCategory = 'socket' | 'switch' | 'data' | 'lighting' | 'climate' | 'custom';

export type SymbolId =
  | 'socket-single'
  | 'socket-double'
  | 'socket-triple'
  | 'socket-quad'
  | 'switch-single'
  | 'switch-double'
  | 'internet'
  | 'tv'
  | 'ceiling-light'
  | 'led'
  | 'ac'
  | 'custom';

export type EditableProp = 'mountHeightCm' | 'distanceFromCornerCm' | 'description' | 'color' | 'label';

export interface SymbolDef {
  id: SymbolId;
  category: SymbolCategory;
  defaultColor: string;
  defaultMountHeightCm: number | null;
  placement: 'wall' | 'ceiling' | 'any';
  editableProps: EditableProp[];
}

interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Room extends Timestamps {
  id: UUID;
  name: string;
  color: string;
  shape: 'rect' | 'square' | 'polygon';
  vertices: Vec2[];
  labelOffset: Vec2;
  order: number;
}

export interface Wall extends Timestamps {
  id: UUID;
  a: Vec2;
  b: Vec2;
  thickness: number;
  roomIds: UUID[];
  name: string | null;
}

/**
 * Visual-only wall gap (door / window). Provisional for Phase 4 ("Eshik/deraza — faqat vizual").
 * Not part of the MySQL schema yet.
 */
export interface Opening {
  id: UUID;
  wallId: UUID;
  kind: 'door' | 'window';
  t: number; // centre, 0..1 along wall a → b
  width: number; // plan units
  swing: 1 | -1; // door leaf side
}

export interface ElectricalPoint extends Timestamps {
  id: UUID;
  symbolId: SymbolId;
  roomId: UUID;
  wallId: UUID | null;
  t: number | null;
  side: 1 | -1;
  x: number;
  y: number;
  mountHeightCm: number | null;
  distanceFromCornerCm: number | null;
  description: string;
  color: string;
  label: string | null;
  status: PointStatus;
  statusChangedAt: string | null;
}

/** One status change during installation (mirrors MySQL installation_tasks). Append-only. */
export interface InstallationTask {
  id: UUID;
  pointId: UUID;
  /** null until accounts exist (Phase 12) */
  userId: UUID | null;
  fromStatus: PointStatus;
  toStatus: PointStatus;
  createdAt: string;
}

export interface ProjectSettings {
  gridSize: number;
  snapToGrid: boolean;
  defaultSocketHeightCm: number;
  defaultSwitchHeightCm: number;
  wallDisplayHeightCm: number;
}

export interface Project extends Timestamps {
  id: UUID;
  ownerId: UUID | null;
  name: string;
  customerName: string;
  address: string;
  revision: number;
  rooms: Room[];
  walls: Wall[];
  points: ElectricalPoint[];
  openings: Opening[];
  installLog: InstallationTask[];
  settings: ProjectSettings;
}
