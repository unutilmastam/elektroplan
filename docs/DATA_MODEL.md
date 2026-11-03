# ELEKTROPLAN — Data model

All IDs are UUID (v7 on the client so they sort by time and can be created offline). All entities have `createdAt`, `updatedAt`. Soft delete via `deletedAt` so deletions sync.

## 1. Domain types (`src/domain/types.ts`)

```ts
export type UUID = string;
export type Vec2 = { x: number; y: number };

export type PointStatus = 'pending' | 'in_progress' | 'completed';

export type SymbolCategory = 'socket' | 'switch' | 'data' | 'lighting' | 'climate' | 'custom';

export interface SymbolDef {
  id: string;                 // 'socket-single', 'socket-double', …
  name: string;               // uz label
  category: SymbolCategory;
  defaultColor: string;       // hex
  defaultMountHeightCm: number | null;
  placement: 'wall' | 'ceiling' | 'any';
  editableProps: Array<'mountHeightCm' | 'distanceFromCornerCm' | 'description' | 'color' | 'label'>;
}

export interface Project {
  id: UUID;
  ownerId: UUID | null;       // null while local-only
  name: string;
  customerName: string;
  address: string;
  revision: number;           // server revision for sync
  rooms: Room[];
  walls: Wall[];
  points: ElectricalPoint[];
  settings: ProjectSettings;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}

export interface Room {
  id: UUID;
  name: string;               // 'Zal', 'Yotoqxona', …
  color: string;
  shape: 'rect' | 'square' | 'polygon';
  vertices: Vec2[];           // closed polygon, clockwise
  labelOffset: Vec2;          // label position relative to centroid
  order: number;              // order in "Xonalar ro'yxati"
  createdAt: string; updatedAt: string; deletedAt: string | null;
}

export interface Wall {
  id: UUID;
  a: Vec2; b: Vec2;           // start corner → end corner ("chap burchak" = a)
  thickness: number;          // plan units, visual only
  roomIds: UUID[];            // 0..2
  name: string | null;        // 'Shimol devori' (auto from direction if null)
  createdAt: string; updatedAt: string; deletedAt: string | null;
}

export interface ElectricalPoint {
  id: UUID;
  symbolId: string;
  roomId: UUID;
  wallId: UUID | null;        // null for ceiling points
  t: number | null;           // 0..1 along wall from a → b
  side: 1 | -1;               // which face of the wall
  x: number; y: number;       // derived world position (kept in sync)
  mountHeightCm: number | null;      // "Pol'dan balandlik"
  distanceFromCornerCm: number | null; // "Chap burchakdan"
  description: string;        // "Izoh"
  color: string;              // "Rang"
  label: string | null;       // custom point label
  status: PointStatus;
  statusChangedAt: string | null;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}

export interface ProjectSettings {
  gridSize: number;
  snapToGrid: boolean;
  defaultSocketHeightCm: number;   // 30
  defaultSwitchHeightCm: number;   // 90
  wallDisplayHeightCm: number;     // 270, for wall view
}
```

## 2. Derived data (never stored)

| Selector | Returns |
|---|---|
| `selectProgress(project)` | `{ total, completed, inProgress, pending, remaining, percent }` |
| `selectRoomStats(project)` | per room: point count, completed count |
| `selectWallElevation(project, wallId)` | wall length, points sorted by horizontal pos, heights |
| `selectWallLabel(wall, room)` | "Zal – Shimol devori" (direction from wall normal) |

Progress rules: `percent = round(completed / total * 100)`, `total = 0 → 0%`. "Loyiha tayyor" when `completed === total && total > 0`.

## 3. Database (PostgreSQL / Prisma)

See `prisma/schema.prisma`. Normalized tables:

| Model | Purpose |
|---|---|
| `User` + Auth.js tables (`Account`, `Session`, `VerificationToken`) | accounts |
| `Project` | header info, `revision`, owner |
| `ProjectSettings` | 1:1 with project |
| `Room` | polygon stored as `Json` (`Vec2[]`) |
| `Wall` | endpoints as floats, `WallRoom` join table for 0..2 rooms |
| `Symbol` | catalog (seeded), `isSystem`, plus user custom symbols |
| `ElectricalPoint` | all point properties |
| `InstallationTask` | status history per point: who/when changed status, optional note/photo later |
| `ProjectHistory` | change log: op patches, revision, author, conflict records |

Indexes: `Project(ownerId, updatedAt)`, `Room(projectId)`, `Wall(projectId)`, `ElectricalPoint(projectId)`, `ElectricalPoint(wallId)`, `ElectricalPoint(projectId, status)`, `ProjectHistory(projectId, revision)`.

## 4. IndexedDB (`src/infra/idb`)

Database `elektroplan`, version 1:

| Store | Key | Content |
|---|---|---|
| `projects` | `id` | full `Project` snapshot (validated by zod on read) |
| `outbox` | auto | `{ projectId, baseRevision, ops: Patch[], createdAt }` |
| `meta` | key | `lastOpenedProjectId`, `lastSyncAt`, schema version |

Migrations are version-gated in `db.ts` `upgrade()`.
