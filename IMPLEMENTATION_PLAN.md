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

### [iter-11] 2026-04-15 — US-006 deadlock: test-writing story vs coder anti-test rule

US-006 "Write automated tests for identity resolution" is a story whose entire deliverable is test files (`server/src/__tests__/identity-resolution.test.ts`) and test runner configuration (`test` script in `server/package.json`). The validator wrote a meta-test (`US-006.test.ts`) that checks for these deliverables, but the coder skill forbids writing any test files ("You do NOT write tests. Ever.") and specifically says to skip stories titled "write tests for X" with a no-op commit.

This creates a deadlock: the meta-test expects deliverables that only the validator can create (per coder rules), but the validator only writes meta-tests. The coder skipped in iteration 10 (commit d4a496b) and is skipping again now.

**Resolution needed:** Either (a) the validator should create `identity-resolution.test.ts` and configure the test runner, or (b) the harness should mark US-006 as a validator-only story that doesn't require coder action, or (c) the coder rules should be relaxed for stories whose deliverables are explicitly test files.


## Decisions

### [iter-10] 2026-04-15 — US-005 identity resolution query logic
Created `server/src/identity.ts` with three exports: `resolveIdentity(deviceOrUserId)` looks up `identity_mappings` to map device→user (returns input as-is if no mapping), `getEventsForUser(userId)` uses the SQL pattern `WHERE user_id = ? OR device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?)` to retroactively merge all events for a resolved user, and `parseEventRow()` converts DB rows to API shape (parsed properties). Added `GET /api/events` route in `events.ts` with `user_id` and `device_id` query params — both use identity resolution. For unmapped devices, falls back to direct `WHERE device_id = ?` query since `getEventsForUser` is designed for user_ids. All responses sorted by timestamp ASC with properties as parsed JSON objects.

### [iter-9] 2026-04-15 — US-004 fix: JSON body size limit for large batches
Express `express.json()` defaults to 100KB body limit. A batch of 1000 events exceeds this, causing the server to return 413 (Payload Too Large) before the route handler runs. Fixed by setting `express.json({ limit: '10mb' })` in `server/src/index.ts`.

### [iter-8] 2026-04-15 — US-004 batch event ingestion endpoint
Added `POST /api/events/batch` to `server/src/routes/events.ts`. Reuses the same `eventBodySchema` from US-003 for per-event validation. Uses a "wrapper + individual" validation strategy: first validates the outer `{ events: [...] }` shape (array 1–1000) with a loose schema, then validates each event individually. This allows partial success — invalid events are skipped with error details while valid ones are inserted. All inserts happen inside a single `db.transaction()` for performance. Identity conflict detection uses prepared statements inside the transaction loop, checking `identity_mappings` before each insert. Conflicting events are skipped (not inserted) and reported in the errors array without aborting the batch.

### [iter-7] 2026-04-15 — US-003 event ingestion endpoint
Created `server/src/routes/events.ts` with POST /api/events handler. Zod validates request body (event required+non-empty, at least one of device_id/user_id). Identity conflict check runs BEFORE event insertion — queries identity_mappings for existing device_id mapping, rejects with 409 if mapped to different user_id. Properties serialized to JSON string for storage, deserialized back to object in response. App exported from `index.ts` with conditional `app.listen()` (skipped under VITEST env) so tests can import without port conflicts.

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

### [iter-6] 2026-04-15 — US-002 fix: init function naming mismatch
The test probes for init function exports using names `initDb`, `initializeDb`, `init`, `db`, `default` via nullish coalescing. Our function was named `initializeDatabase`, which matched none of those — so init was never called and tables were never created. Renamed to `initializeDb` (also exported as `initDb`). Removed dead `getDb()` wrapper per reviewer finding.

