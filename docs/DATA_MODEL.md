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

## 3. Database (MySQL / MariaDB on cPanel)

See `server/migrations/001_init.sql`. Snake_case columns, mapped to camelCase in the PHP layer. Normalized tables:

| Table | Purpose |
|---|---|
| `users`, `sessions` | accounts (bcrypt), hashed session tokens |
| `projects` | header info, `revision`, owner |
| `project_settings` | 1:1 with project |
| `rooms` | polygon stored as `JSON` (`Vec2[]`) |
| `walls` | endpoints `a_x, a_y, b_x, b_y`; `wall_rooms` join for 0..2 rooms |
| `symbols` | catalog (system rows seeded) + user custom symbols |
| `electrical_points` | all point properties |
| `installation_tasks` | status change log per point (who/when) |
| `project_history` | patches per revision, conflict records |
| `schema_migrations` | applied migration versions |

Indexes: `projects(owner_id, updated_at)`, `rooms(project_id)`, `walls(project_id)`, `electrical_points(project_id)`, `electrical_points(wall_id)`, `electrical_points(project_id, status)`, `project_history(project_id, revision)`.

## 4. IndexedDB (`src/infra/idb`)

Database `elektroplan`, version 1:

| Store | Key | Content |
|---|---|---|
| `projects` | `id` | full `Project` snapshot (validated by zod on read) |
| `outbox` | auto | `{ projectId, baseRevision, ops: Patch[], createdAt }` |
| `meta` | key | `lastOpenedProjectId`, `lastSyncAt`, schema version, `persistGranted`, `iosInstallHintShown` |

Migrations are version-gated in `db.ts` `upgrade()`.
