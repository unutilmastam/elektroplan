# ELEKTROPLAN — Architecture

## 1. Principles

- **Local-first.** The browser (IndexedDB) is the primary working copy. The server (PostgreSQL) is the durable, shared copy. The user never waits for the network to draw, edit or mark progress.
- **Pure domain core.** Geometry, wall attachment, progress math, validation, undo/redo patches and sync merging are pure TypeScript in `src/domain/`. Fully unit-tested, no React, no Konva, no I/O.
- **Feature modules.** Each feature owns its UI, hooks and store slice. Features talk through the store and domain functions, never by importing each other's internals.
- **One source of truth per concern.** Project document → `projectStore`. Editor UI state (tool, zoom, selection) → `editorStore`. Never mirror document data in component state.

## 2. Layers

```
┌──────────────────────────────────────────────────────────────┐
│  app/ (Next.js routes, layouts)                               │
├──────────────────────────────────────────────────────────────┤
│  features/  editor · symbols · points · wall-view · rooms     │
│             installation · projects · export-pdf · dashboard  │
├──────────────────────────────────────────────────────────────┤
│  store/     projectStore (document + history) · editorStore   │
│             syncStore · uiStore                               │
├──────────────────────────────────────────────────────────────┤
│  domain/    types · schemas(zod) · geometry · walls · points  │
│             progress · history(patches) · merge · ids         │
├──────────────────────────────────────────────────────────────┤
│  infra/     idb (IndexedDB repo) · api client · sync engine   │
│             prisma (server) · auth                            │
└──────────────────────────────────────────────────────────────┘
```

Dependency direction is strictly downward. `domain/` imports nothing from the app.

## 3. Folder structure

```
elektroplan/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts                       # symbol catalog seed
├─ public/
│  ├─ icons/                        # PWA icons
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # fonts, theme, providers
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (app)/layout.tsx           # AppShell: Sidebar + main area
│  │  ├─ (app)/page.tsx             # Bosh sahifa (dashboard)
│  │  ├─ (app)/projects/page.tsx    # Loyihalar list
│  │  ├─ (app)/projects/[id]/page.tsx          # Chizma (editor workspace)
│  │  ├─ (app)/projects/[id]/install/page.tsx  # Montaj rejimi
│  │  ├─ (app)/materials/page.tsx
│  │  ├─ (app)/settings/page.tsx
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ projects/route.ts                  # list / create
│  │     ├─ projects/[id]/route.ts             # get / delete
│  │     └─ sync/route.ts                      # push/pull changesets
│  ├─ components/
│  │  ├─ ui/                        # shadcn primitives (generated)
│  │  ├─ layout/  Sidebar, Header, GlassPanel, MobileNav, PanelDrawer
│  │  └─ common/  IconButton, NumberField, ColorSwatches, ProgressRing, Tooltip
│  ├─ features/
│  │  ├─ dashboard/      StatsCard, RecentProjects, ProCard, UserCard
│  │  ├─ projects/       ProjectList, ProjectForm, ProjectHeader
│  │  ├─ editor/
│  │  │  ├─ canvas/      PlanStage, GridLayer, RoomsLayer, WallsLayer,
│  │  │  │               PointsLayer, SelectionLayer, DraftLayer
│  │  │  ├─ tools/       select, marquee, pan, rect, square, polygon,
│  │  │  │               wall, place-symbol  (each = pointer state machine)
│  │  │  ├─ toolbar/     DrawingToolbar (left), SymbolBar (top)
│  │  │  └─ hooks/       useViewport, usePointerTool, useKeyboardShortcuts
│  │  ├─ symbols/        catalog.ts, SymbolIcon.tsx, svg/*.tsx
│  │  ├─ points/         PointPropertiesPanel, PointGlyph (Konva)
│  │  ├─ rooms/          RoomList, RoomPropertiesPanel
│  │  ├─ wall-view/      WallElevation, ElevationPoint, DimensionLine
│  │  ├─ installation/   InstallWorkspace, RoomNavigator, PointStatusSheet,
│  │  │                  ProgressCard
│  │  └─ export-pdf/     buildPdf.ts, renderPlanImage.ts, renderWallImage.ts
│  ├─ store/
│  │  ├─ projectStore.ts            # document + undo/redo (immer patches)
│  │  ├─ editorStore.ts             # tool, viewport, selection, activeWall
│  │  ├─ syncStore.ts               # online, pending ops, last sync, conflicts
│  │  └─ selectors.ts               # memoized derived data
│  ├─ domain/
│  │  ├─ types.ts                   # Project, Room, Wall, ElectricalPoint…
│  │  ├─ schemas.ts                 # zod schemas mirroring types
│  │  ├─ ids.ts                     # uuid v7 helper
│  │  ├─ geometry.ts                # vec math, polygon, hit-testing, snapping
│  │  ├─ walls.ts                   # build walls from rooms, split/merge, move
│  │  ├─ points.ts                  # attach to wall, project, distanceFromCorner
│  │  ├─ progress.ts                # totals, %, per-room stats
│  │  ├─ commands.ts                # document mutations (used by store)
│  │  └─ merge.ts                   # conflict resolution for sync
│  ├─ infra/
│  │  ├─ idb/                       # db.ts, projectRepo.ts, outbox.ts
│  │  ├─ sync/                      # syncEngine.ts, backoff.ts
│  │  ├─ api/                       # typed fetch client
│  │  └─ server/                    # prisma.ts, auth.ts, projectService.ts
│  ├─ i18n/uz.ts
│  └─ styles/globals.css            # design tokens (CSS variables)
├─ tests/
│  ├─ unit/        (domain/**)
│  ├─ integration/ (store + idb with fake-indexeddb, API routes)
│  └─ e2e/         (playwright: draw → place → install → export)
└─ docs/
```

## 4. Key mechanics

### 4.1 Canvas (Konva)
- One `Stage`, layers: Grid → Rooms (fill + label) → Walls → Points → Selection/Transformers → Draft (in-progress shape).
- **World coordinates** are abstract "plan units" (1 unit ≈ 1 cm by convention, but never shown as a room size). Viewport = `{x, y, scale}` in `editorStore`.
- Pointer Events only (mouse, touch, stylus). Pinch-zoom and two-finger pan on touch; wheel-zoom to cursor on desktop.
- Each tool is a small state machine: `onPointerDown/Move/Up/Cancel`, `onKey`. The active tool is chosen in `editorStore`; `usePointerTool` dispatches.
- Snapping: grid (toggle), existing vertices, wall endpoints, 0/45/90° angles.
- Performance: `listening={false}` on decorative shapes, `perfectDrawEnabled={false}`, caching for grid, only the Draft layer redraws during drag.

### 4.2 Rooms and walls
- A **Room** is a closed polygon (`vertices[]`). Rectangle/square tools just create 4-vertex polygons; the polygon tool creates freeform rooms.
- A **Wall** is a segment `(a, b)` with a thickness and optional `roomIds` (0, 1 or 2 rooms — shared walls between rooms are one wall). Walls are generated from room edges when a room is created (`domain/walls.ts`), and can also be drawn standalone, moved, split and deleted.
- Moving a wall moves its endpoints; rooms that reference those vertices update; attached points keep their relative position `t` along the wall.

### 4.3 Electrical points
- A point is attached to a wall by `wallId` + `t ∈ [0,1]` (position along the wall from its start corner) + `side` (which room face).
- `x, y` are **derived** from wall + t for rendering; they are stored too (spec requires) and recomputed on wall change.
- `distanceFromCornerCm` and `mountHeightCm` are optional user values (what the electrician measures on site). If `distanceFromCornerCm` is empty, the wall view uses `t` for horizontal placement.
- Ceiling items (lyustra, LED) may be room-level (`wallId = null`) with x/y inside the room.
- Dragging a point near a wall snaps it to the nearest wall (`points.ts: attachToNearestWall`).

### 4.4 Wall view (elevation)
- Pure SVG (not Konva) component fed by `selectWallElevation(wallId)`: wall length in display units, points sorted by horizontal position, each with height.
- Floor line, height ruler, dimension lines with `sm` labels, exactly like the reference ("60 sm, 150 sm, 200 sm", "110 sm").
- Clicking a point selects it in both views (shared `editorStore.selection`). Dragging horizontally updates `t`/`distanceFromCornerCm`; vertically updates `mountHeightCm`.

### 4.5 Undo / redo
- All document mutations go through `projectStore.apply(command)`, which uses `immer`'s `produceWithPatches`. Patches + inverse patches are pushed to a bounded history stack (200 steps).
- Continuous gestures (drag) are coalesced into one history entry (begin/commit transaction).
- The same patches feed the sync outbox — one mechanism, no duplicated logic.

### 4.6 Persistence and sync
```
user action → projectStore.apply → (a) UI updates instantly
                                  → (b) debounced 500 ms write to IndexedDB (whole project snapshot + revision)
                                  → (c) ops appended to IndexedDB outbox
syncEngine (online, every 10 s / on reconnect / on visibility) → POST /api/sync {projectId, baseRevision, ops}
server: if baseRevision == current → apply, revision++ → return new revision
        else → return server changes since baseRevision → client merges (domain/merge.ts) → retry
```
- Conflict policy: entity-level last-writer-wins by `updatedAt`, **except installation status, which never goes backwards** (completed beats in_progress beats pending) — progress is never lost. Deletions win over edits only if newer. Every resolved conflict is written to `ProjectHistory`.
- `beforeunload` + `visibilitychange` flush the IndexedDB write immediately.
- Until Phase 12 the app works fully with IndexedDB only (no account needed).

### 4.7 PDF export
- Client-side with `pdf-lib` + `@pdf-lib/fontkit` (embedded Inter font, full Uzbek Latin support).
- Plan image: render the Konva stage off-screen at 2× on a white theme (`renderPlanImage`), fit to page.
- Wall elevations: SVG → PNG via `canvas`, one per wall that has points.
- Pages: cover (project info, customer, address, date, progress), floor plan, points table grouped by room (symbol, wall, height, distance, note, status), wall elevations, legend.

### 4.8 Responsive behaviour
| Breakpoint | Layout |
|---|---|
| ≥1280 desktop | Full layout from reference: sidebar, header, symbol bar, toolbar, canvas, right properties, bottom row (rooms / wall view / status) |
| 768–1279 tablet | Sidebar collapses to icons; properties panel becomes a slide-over; bottom row becomes tabs; canvas gets maximum space |
| <768 mobile | Bottom navigation bar; canvas full-screen; symbol bar horizontal scroll; properties/rooms/wall view open as bottom sheets; large touch targets (≥44 px) |

## 5. Dependencies

Runtime: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, shadcn/ui (+ `@radix-ui/*` it generates, `class-variance-authority`, `clsx`, `tailwind-merge`), `lucide-react`, `konva`, `react-konva`, `zustand`, `immer`, `zod`, `idb`, `pdf-lib`, `@pdf-lib/fontkit`, `@prisma/client`, `next-auth` (Auth.js), `@serwist/next` (PWA).

Dev: `prisma`, `vitest`, `@testing-library/react`, `fake-indexeddb`, `@playwright/test`, `eslint`, `prettier`.

Nothing else without approval.

## 6. Deployment

- App: Vercel. Database: Neon or Supabase PostgreSQL.
- Env: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, provider credentials.
- cPanel shared hosting is not used for the app (no long-running Node + PostgreSQL); only DNS for a subdomain.
