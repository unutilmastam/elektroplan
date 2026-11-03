import type { Project } from './types';

export const DEFAULT_SETTINGS: Project['settings'] = {
  gridSize: 20,
  snapToGrid: true,
  defaultSocketHeightCm: 30,
  defaultSwitchHeightCm: 90,
  wallDisplayHeightCm: 270,
};

/** A blank, local-only project. */
export function createEmptyProject(id: string, name: string, now: string): Project {
  return {
    id,
    ownerId: null,
    name,
    customerName: '',
    address: '',
    revision: 0,
    rooms: [],
    walls: [],
    points: [],
    openings: [],
    installLog: [],
    settings: { ...DEFAULT_SETTINGS },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
