# ELEKTROPLAN — Architecture

## 0. Hosting decision (approved by owner, 2026-11-03)

The app runs on **hostmaster.uz cPanel shared hosting** (no VPS, no long-running Node.js, MySQL available). Therefore the SPEC stack is adapted:

| SPEC | Used here | Why |
|---|---|---|
| Next.js server | **Next.js static export** (`output: 'export'`) → plain HTML/JS/CSS in `public_html/` | Shared hosting serves static files; no Node process needed |
| PostgreSQL + Prisma | **MySQL/MariaDB** + plain SQL migrations (`server/migrations/*.sql`) | cPanel standard DB |
| Next API routes | **PHP 8 REST API** (`server/` → `public_html/api/`) using PDO | PHP runs natively on cPanel |
| Auth.js | **PHP session auth**: bcrypt password, random token in httpOnly Secure SameSite=Lax cookie, hashed in `sessions` table | Auth.js needs a Node server |
| Deploy from a computer | **GitHub Actions → FTP deploy** to cPanel on every push to `main` | Owner works from phone/iPad only |

Everything else (React, TypeScript, Tailwind, shadcn/ui, Konva, Zustand, IndexedDB, PWA) is unchanged.

**Static-export routing rule:** no dynamic route segments for user data. Use query params: `/editor?id=<uuid>`, `/install?id=<uuid>`. Static export can't pre-render unknown IDs.

## 1. Principles

- **Local-first / offline-first.** IndexedDB in the browser is the primary working copy. The server is the durable, shared backup. The user never waits for the network to open, view, draw, edit or mark progress.
- **Pure domain core.** Geometry, wall attachment, progress math, validation, undo/redo patches and sync merging are pure TypeScript in `src/domain/`. Fully unit-tested, no React, no Konva, no I/O.
- **Feature modules.** Each feature owns its UI, hooks and store slice. Features talk through the store and domain functions, never by importing each other's internals.
- **One source of truth per concern.** Project document → `projectStore`. Editor UI state (tool, zoom, selection) → `editorStore`. Never mirror document data in component state.

## 2. Layers

```
┌──────────────────────────────────────────────────────────────┐
│  app/ (Next.js static pages)                                  │
├──────────────────────────────────────────────────────────────┤
│  features/  editor · symbols · points · wall-view · rooms     │
│             installation · projects · export-pdf · dashboard  │
│             offline-library                                   │
├──────────────────────────────────────────────────────────────┤
│  store/     projectStore (document + history) · editorStore   │
│             syncStore · uiStore                               │
├──────────────────────────────────────────────────────────────┤
│  domain/    types · schemas(zod) · geometry · walls · points  │
│             progress · history(patches) · merge · ids         │
├──────────────────────────────────────────────────────────────┤
│  infra/     idb (IndexedDB repo) · api client · sync engine   │
└──────────────────────────────────────────────────────────────┘
        │ HTTPS JSON
┌───────▼──────────────────────────────────────────────────────┐
│  server/ (PHP 8 + PDO + MySQL)  → deployed to public_html/api │
└──────────────────────────────────────────────────────────────┘
```

Dependency direction is strictly downward. `domain/` imports nothing from the app.

## 3. Folder structure

```
elektroplan/
├─ .github/workflows/
│  ├─ ci.yml                        # typecheck, lint, unit tests, php -l
│  └─ deploy.yml                    # build static export + FTP to hostmaster
├─ public/
│  ├─ icons/                        # PWA icons (192, 512, maskable, apple-touch)
│  ├─ manifest.webmanifest
│  └─ .htaccess                     # HTTPS, SPA fallback, cache headers
├─ server/                          # PHP API → public_html/api/
│  ├─ index.php                     # tiny router
│  ├─ bootstrap.php                 # PDO, JSON helpers, error handler, CORS off (same origin)
│  ├─ config.example.php            # DB creds template (real config.php written by CI from secrets)
│  ├─ Auth.php                      # register, login, logout, me, session check
│  ├─ ProjectController.php         # list, get, delete
│  ├─ SyncController.php            # push/pull changesets with revision check
│  ├─ Validator.php                 # input validation (mirrors zod schemas)
│  ├─ migrate.php                   # applies server/migrations/*.sql (protected by token)
│  ├─ migrations/001_init.sql
│  ├─ .htaccess                     # route all to index.php, deny config/migrations
│  └─ tests/                        # PHPUnit (optional in CI)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # fonts, theme, providers, SW registration
│  │  ├─ page.tsx                   # Bosh sahifa (dashboard)
│  │  ├─ projects/page.tsx          # Loyihalar (works offline from IndexedDB)
│  │  ├─ editor/page.tsx            # Chizma   (?id=)
│  │  ├─ install/page.tsx           # Montaj rejimi (?id=)
│  │  ├─ materials/page.tsx
│  │  ├─ settings/page.tsx
│  │  └─ login/page.tsx
│  ├─ components/
│  │  ├─ ui/                        # shadcn primitives (generated)
│  │  ├─ layout/  Sidebar, Header, GlassPanel, MobileNav, PanelDrawer, OfflineBadge
│  │  └─ common/  IconButton, NumberField, ColorSwatches, ProgressRing, Tooltip
│  ├─ features/
│  │  ├─ dashboard/      StatsCard, RecentProjects, ProCard, UserCard
│  │  ├─ projects/       ProjectList, ProjectForm, ProjectHeader
│  │  ├─ offline-library/ OfflineStatus, BackupExport, BackupImport
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
│  │  ├─ installation/   InstallWorkspace, RoomNavigator, PointStatusSheet, ProgressCard
│  │  └─ export-pdf/     buildPdf.ts, renderPlanImage.ts, renderWallImage.ts
│  ├─ store/            projectStore, editorStore, syncStore, selectors
│  ├─ domain/           types, schemas, ids, geometry, walls, points, progress, commands, merge
│  ├─ infra/
│  │  ├─ idb/           db.ts, projectRepo.ts, outbox.ts, persist.ts
│  │  ├─ sync/          syncEngine.ts, backoff.ts
│  │  └─ api/           typed fetch client (same origin /api)
│  ├─ sw/sw.ts          # service worker source (Serwist)
│  ├─ i18n/uz.ts
│  └─ styles/globals.css
├─ tests/  unit/ · integration/ · e2e/
└─ docs/
```

## 4. Key mechanics

### 4.1 Canvas (Konva)
- One `Stage`, layers: Grid → Rooms (fill + label) → Walls → Points → Selection/Transformers → Draft.
- World coordinates are abstract "plan units" (1 unit ≈ 1 cm by convention, never shown as a room size). Viewport `{x, y, scale}` lives in `editorStore`.
- Pointer Events only (mouse, touch, stylus). Pinch-zoom + two-finger pan; wheel-zoom to cursor.
- Each tool is a small state machine (`onPointerDown/Move/Up/Cancel`, `onKey`).
- Snapping: grid (toggle), vertices, wall endpoints, 0/45/90°.
- Performance: `listening={false}` on decorative shapes, `perfectDrawEnabled={false}`, cached grid, only the Draft layer redraws during drag.

### 4.2 Rooms and walls
- **Room** = closed polygon (`vertices[]`). Rect/square tools create 4-vertex polygons; polygon tool = freeform.
- **Wall** = segment `(a, b)` + thickness + `roomIds` (0–2; a shared wall is one wall). Generated from room edges (`domain/walls.ts`); can also be drawn standalone, moved, split, deleted.
- Moving a wall moves its endpoints; linked rooms update; attached points keep their `t`.

### 4.3 Electrical points
- Attached by `wallId + t ∈ [0,1] + side`. `x, y` are derived and recomputed when the wall changes.
- `distanceFromCornerCm`, `mountHeightCm` are optional on-site values. If distance is empty, the wall view uses `t`.
- Ceiling items (lyustra, LED) may have `wallId = null`.
- Dragging near a wall snaps to the nearest wall.

### 4.4 Wall view (elevation)
- SVG component fed by `selectWallElevation(wallId)`: floor line, height ruler, `sm` dimension lines (like the reference: 60 / 150 / 200 sm, 110 sm).
- Shared `editorStore.selection` → selecting in either view selects in both. Horizontal drag edits distance/t, vertical drag edits height.

### 4.5 Undo / redo
- All mutations go through `projectStore.apply(command)` with immer `produceWithPatches`. 200-step bounded stack; drags coalesced into one entry.
- The same patches feed the sync outbox — one mechanism.

### 4.6 Offline: saved projects always open without internet
Requirement from owner: **projects saved earlier must open and be viewable with no internet.**

1. **App shell offline.** Service worker (Serwist, precache manifest generated at build) caches all HTML/JS/CSS/fonts/icons. After the first visit the app starts in airplane mode.
2. **All projects live in IndexedDB.** Every project the user creates is stored locally. After login, the sync engine downloads *every* server project into IndexedDB, so projects created on another device are also available offline.
3. **Projects list reads only IndexedDB.** `/projects`, `/editor?id=`, `/install?id=` never require the network. The server is only contacted in the background.
4. **Storage protection.** On first save call `navigator.storage.persist()`. On iPhone/iPad, Safari may delete site data of a website unused for ~7 days; data of an app **added to the Home Screen** is kept. The app shows a one-time hint "Bosh ekranga qo'shing" on iOS.
5. **Manual backup.** "Zaxira nusxa" button exports one project or all projects as a `.elektroplan.json` file (Files app / Telegram) and imports it back — a safety net independent of browser storage.
6. **Offline indicator.** Header badge: Oflayn / Sinxronlanmoqda / Sinxronlandi, and per-project "Serverda saqlanmagan o'zgarishlar bor".
7. Edits made offline go to the outbox and are pushed automatically when the connection returns.

### 4.7 Persistence and sync
```
user action → projectStore.apply → (a) UI updates instantly
                                  → (b) debounced 500 ms snapshot write to IndexedDB
                                  → (c) patches appended to IndexedDB outbox
syncEngine (online: every 10 s, on reconnect, on tab focus)
  → POST /api/sync { projectId, baseRevision, ops }
server (PHP, one DB transaction):
  if baseRevision == current → apply ops to tables, revision++, log to project_history
  else → 409 + ops since baseRevision → client merges (domain/merge.ts) → retries
```
- Conflict policy: entity-level last-writer-wins by `updatedAt`, **except installation status, which never goes backwards** (completed > in_progress > pending). Newer deletions win. Every conflict is logged (`project_history.kind = 'conflict'`).
- `beforeunload` / `visibilitychange` flush IndexedDB immediately.
- The app works fully without an account (IndexedDB only). With an account every project is also on the server and on every device of that account. Protocol details: DATA_MODEL §9.

### 4.8 PDF export
- Client-side `pdf-lib` + `@pdf-lib/fontkit`, embedded Inter (Uzbek Latin). Works offline.
- Plan rendered off-screen at 2× on a light print theme; one elevation image per wall with points.
- Pages: cover (project, customer, address, date, progress) → floor plan → points table by room → wall elevations → legend.

### 4.9 Devices and responsive behaviour
Primary device is **iPad** (touch + Apple Pencil + keyboard/trackpad), then iPhone, Android, Windows. Full rules: `docs/DEVICES.md`.

| Width | Layout |
|---|---|
| < 600 | Bottom nav; full-screen canvas; panels as bottom sheets |
| 600–1023 | Icon rail; properties slide-over; bottom row as tabs |
| 1024–1279 (iPad landscape) | Reference layout with 72px rail, compact panels |
| ≥ 1280 | Full reference layout |

Layout depends on width only (iPad Split View/Stage Manager can be phone-width). Input handled only via Pointer Events; `pointerType` decides pen/touch/mouse behaviour.

## 5. Dependencies

Frontend runtime: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, shadcn/ui (+ generated `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`), `lucide-react`, `konva`, `react-konva`, `zustand`, `immer`, `zod`, `idb`, `pdf-lib`, `@pdf-lib/fontkit`, `@serwist/next` / `serwist`.

Frontend dev: `vitest`, `@testing-library/react`, `fake-indexeddb`, `@playwright/test`, `eslint`, `prettier`.

Windows app (PHASE 17, approved by the owner): `@tauri-apps/cli` (dev) + Rust crates `tauri`, `tauri-build`, `tauri-plugin-opener` in `src-tauri/`. Built with `NEXT_PUBLIC_DESKTOP=1` (`scripts/build-desktop.mjs`): no service worker, API at `NEXT_PUBLIC_API_BASE` with the `X-Elektroplan-Auth` token (`src/infra/desktop/desktop.ts`).

Server: PHP 8.1+ core only (PDO MySQL, `password_hash`, `random_bytes`). No Composer runtime packages. PHPUnit as optional dev tool.

Nothing else without approval.

## 6. Deployment (see `docs/DEPLOY.md`)

- Push to `main` → GitHub Actions builds `out/` → uploads to `public_html/` via FTP; uploads `server/` to `public_html/api/`; writes `api/config.php` from GitHub Secrets.
- Owner never needs a computer: edit via Claude Code → push → site updates.
