# CLAUDE.md — Rules for building ELEKTROPLAN

You are building ELEKTROPLAN, a professional 2D electrical planning + installation app for electricians.
Read these before writing any code:

1. `docs/SPEC.md` — full product spec (source of truth for features)
2. `docs/ARCHITECTURE.md` — folder layout, module boundaries, data flow
3. `docs/DATA_MODEL.md` + `server/migrations/*.sql` — domain model, geometry, MySQL schema
4. `docs/DESIGN_SYSTEM.md` — tokens, layout, Uzbek UI strings
4a. `docs/DEVICES.md` — iPad-first; iPhone, Android, Windows rules and test matrix
4b. `docs/DEPLOY.md` — hostmaster.uz cPanel deployment via GitHub Actions
5. `docs/design/reference-dashboard.png` — the approved visual reference. Match it.
6. `docs/PHASES.md` — what each phase delivers and its acceptance criteria
7. `docs/PROGRESS.md` — which phases are done

## Workflow (mandatory)

- Work on ONE phase at a time, in order. Never start the next phase without explicit user approval.
- At the end of each phase:
  1. `pnpm typecheck && pnpm lint && pnpm test` must pass (and `pnpm test:e2e` on all device profiles once Playwright exists).
  2. Manually verify earlier phases still work.
  3. Update `docs/PROGRESS.md` (what was done, what was tested, known limitations).
  4. Report to the user in Uzbek (Latin), short and concrete.
  5. Commit with message `phase-N: <summary>` and stop.

## Hard rules

- Hosting is **cPanel shared hosting**: frontend = Next.js `output: 'export'` (no server code, no dynamic route segments for data — use `?id=`), backend = PHP 8 + MySQL in `server/`. See ARCHITECTURE §0. No Node server, no Prisma, no Auth.js.
- **Offline is mandatory:** every saved project must open, display and be editable with no internet. Pages read IndexedDB only; the network is background sync.
- **iPad is the primary device.** Every UI change is checked at 1180×820 and 820×1180 first, then iPhone, Android, Windows (`docs/DEVICES.md`). Input only via Pointer Events.

- UI language: Uzbek (Latin). All user-facing strings live in `src/i18n/uz.ts` — no hardcoded strings in components.
- TypeScript `strict: true`, no `any`, no `@ts-ignore`.
- No giant files: a component > ~250 lines must be split.
- Business logic lives in `src/domain/**` as pure functions with unit tests. Components and stores call it; they never duplicate it.
- Every visible button does its real action. If a feature belongs to a later phase, the button is rendered `disabled` with a tooltip "Keyingi bosqichda" — never a fake handler.
- No emoji as electrical symbols. Symbols are SVG from `src/features/symbols/`.
- No screenshots/static images as UI. The floor plan is a real Konva canvas.
- Room dimensions are NEVER required. This is not CAD.
- Don't add dependencies beyond those listed in `docs/ARCHITECTURE.md#dependencies` without asking.
- Don't redesign the UI. Follow the reference image and design tokens.
- Validate every external input (forms, API bodies, IndexedDB reads) with Zod schemas from `src/domain/schemas.ts`.

## Commands

```
pnpm dev            # local dev
pnpm typecheck      # tsc --noEmit
pnpm lint
pnpm test           # vitest (unit + integration)
pnpm test:e2e       # playwright
pnpm build          # static export to out/
php -l server/*.php # PHP syntax check (Phase 12+)
```
