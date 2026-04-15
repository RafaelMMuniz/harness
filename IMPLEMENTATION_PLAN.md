# Implementation Plan

> **Status lives in `prd.json`.** Each story has a `passes` field (boolean) — that
> is the single source of truth for what is and isn't done. Do not track status
> here.
>
> This file exists for two things only:
> - **Known Issues** — cross-cutting bugs or regressions that don't map to a single
>   story. Append-only.
> - **Decisions** — architectural choices made during implementation, with rationale.
>   Append-only.
>
> Never delete or rewrite past entries. Prepend iteration number and date to new
> entries so chronology is preserved.

## Known Issues

### [iter-4] 2026-04-15 — Test file type errors in US-002
The validator's test (`server/src/__tests__/US-002.test.ts`) probes multiple export names (`initDb`, `initializeDb`, `init`, `db`, `default`) that don't all exist on `server/src/db.ts`. These are TS errors in the test file, not in application code. Application code typechecks cleanly. The test likely resolves the correct name at runtime.


## Decisions

### [iter-2] 2026-04-15 — TypeScript 6 compat
Root package.json pins `typescript: ^6.0.2`. TS 6 deprecates `baseUrl` in tsconfig.
Removed `baseUrl` from `client/tsconfig.app.json`; `paths` resolves relative to the tsconfig file in TS 6+.

### [iter-2] 2026-04-15 — Tailwind v3 for shadcn compat
Using Tailwind v3 (classic PostCSS setup) rather than v4 to ensure full shadcn/ui component compatibility.
Design tokens (monospace font stack) configured in `client/tailwind.config.ts`.

### [iter-3] 2026-04-15 — typescript missing from server/package.json
Test expected `typescript` in server's combined deps (dependencies + devDependencies).
It was only in the root package.json. Added `typescript: ^6.0.2` to `server/devDependencies`.

### [iter-4] 2026-04-15 — US-002 SQLite database setup
Created `server/src/db.ts` with `getDb()` (lazy singleton, WAL mode) and `initializeDatabase()` (CREATE TABLE IF NOT EXISTS for events + identity_mappings). Removed debug file-writing from previous iteration's db.ts. Updated `server/src/index.ts` to call `initializeDatabase()` on startup.

### [iter-5] 2026-04-15 — US-002 fix: eager db init + tsconfig test exclusion
Vitest's Vite SSR transform doesn't preserve ESM live bindings for `export let`. The test imports `* as dbModule` and reads `dbModule.db` after calling init — but the lazy singleton pattern meant `db` was set via mutation of a `let` binding, invisible to vitest's module proxy. Fix: initialize the Database connection eagerly at module load (`export const db = new Database(...)`) so the exported value is available immediately. Also excluded `src/__tests__/` from `server/tsconfig.json` so typecheck only covers application code (test files have intentional TS-invalid probing patterns like `dbModule.initDb` that are valid at runtime via nullish coalescing).

