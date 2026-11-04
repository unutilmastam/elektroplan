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

/** Door / window: a visual gap in a wall (not CAD). Added in Phase 4. */
export interface Opening {
  id: UUID;
  wallId: UUID;
  kind: 'door' | 'window';
  t: number;          // centre along the wall, 0..1
  width: number;      // plan units
  swing: 1 | -1;      // side the door leaf opens to
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

Database `elektroplan`, version 3 (v1 → v2 adds `backups` and the `outbox.byProject` index; v2 → v3 adds `synced`):

| Store | Key | Content |
|---|---|---|
| `projects` | `id` | full `Project` snapshot (validated by zod on read) |
| `backups` | `id` | previous valid snapshot of each project (recovery when `projects` holds an unreadable record) |
| `outbox` | auto (index `byProject`) | `{ projectId, baseRevision, ops: Patch[], createdAt }` — rows are deleted once the server stored the project |
| `synced` | `id` | the project version last agreed with the server (base of the three-way merge) |
| `meta` | key | `lastOpenedProjectId`, `deviceSettings` (`penOnly`, `autoStraighten`), `lastSyncAt`, schema version, `persistGranted`, `iosInstallHintShown`, `account` (signed-in user, for offline start) |

Migrations are version-gated in `db.ts` `upgrade()`.

## 5. Wall topology (Phase 4)

Walls are **derived** from room outlines plus free walls (`domain/topology.ts › reconcile`):
- every T-junction vertex is inserted into the room edges it lies on (`normalizeRooms`);
- one wall per segment; a segment used by two rooms is one shared wall (`roomIds` = both);
- existing wall ids are kept (the longest piece of a split wall keeps its id); walls no longer backed by a room are soft-deleted;
- points and openings are re-attached by geometry (`wallId`, `t`), keeping their distance from the wall.

> MySQL: `openings` will get its own table in Phase 12 (sync). Until then it lives in the IndexedDB project snapshot.

## 6. Autosave (Phase 8)

- Every edit: UI updates at once → after a 500 ms pause one IndexedDB transaction writes the snapshot, moves the previous snapshot to `backups`, and appends the patches to `outbox`.
- "Saqlash" / Ctrl+S / page hide / `beforeunload` / `visibilitychange` write immediately.
- Page closing: the unsaved project is also journaled synchronously in `localStorage['elektroplan:unsaved']` (browsers may abort IndexedDB transactions during unload); on the next start a journal newer than the stored snapshot is moved into IndexedDB.
- Reading: zod-validated; an invalid record is replaced by its backup and the user is told.

## 7. Backup file — "Zaxira nusxa" (Phase 11)

`<nom>-YYYY-MM-DD.elektroplan.json` (`domain/backup.ts`), validated by zod on import:

```json
{ "format": "elektroplan-backup", "version": 1, "exportedAt": "ISO", "projects": [ Project, … ] }
```

- Export: one project (project card) or all live projects (Sozlamalar). Soft-deleted projects are left out.
- Import (`planImport`): a project not on the device is added; a local copy is replaced **only when the file's `updatedAt` is newer** (or the local one was deleted); equal / newer local work is never overwritten. `revision` keeps the higher value. Every write goes through the normal save path (snapshot + backup + outbox).
- Meta flag `iosInstallHintShown` (mirrored in `localStorage['elektroplan:iosInstallHintShown']`) hides the one-time iOS "Bosh ekranga qo‘shing" hint.

## 8. Service worker cache (Phase 11)

Serwist (`src/sw/sw.ts` → `/sw.js`) precaches every exported page (+ its RSC `index.txt`), all `_next/static` chunks/CSS/fonts and every file in `public/` (incl. `/fonts/Inter-*.ttf` for the PDF and the icons). Page URLs are matched without their query (`/editor/?id=…` → `/editor/`). Projects are **never** in the SW cache — they live only in IndexedDB. `/api/*` is network-only. A new build waits in `waiting` until the user taps "Yangilash".

## 9. Server sync (Phase 12)

MySQL migration `002_sync.sql`: child tables are keyed by **(project_id, id)** (entity ids are unique inside a project, made on the device); every list keeps the device order in `seq`; `openings` table; heights/distances `DOUBLE`; `installation_tasks.project_id`; `rate_limits`; 11 system symbols seeded.

Protocol (`server/lib/Sync.php`, `src/infra/sync/syncEngine.ts`):

| Call | Body | Answer |
|---|---|---|
| `POST /api/pull` | `{ have: { projectId: revision } }` | `{ projects: Project[] (newer than have), revisions }` |
| `POST /api/sync` | `{ project, baseRevision, ops, conflicts }` | `200 { revision, ownerId }` · `409 { error: 'conflict', project }` · `403` other owner · `422` invalid |

- The server stores the whole project in one transaction when `baseRevision` equals its revision (revision + 1, `project_history` row `change`; merge conflicts reported by the device are logged as `conflict`).
- On 409 the device merges with `domain/merge.ts` (field-level three-way: one-side changes always kept, both-sides → newer `updatedAt`, server on a tie; installation status never backwards; newer deletion wins; log = union) and pushes again.
- A project with no owner is attached to the account on its first push. Projects of another account stay local and are never sent.
- Sessions: `ep_session` cookie (64 hex, httpOnly, SameSite=Lax, Secure on HTTPS, 60 days sliding), sha256 stored. Login throttled: 10 / 15 min per IP + login, 50 / 15 min per IP; registration 10 / hour per IP. POST requests need `X-Elektroplan: 1`.
