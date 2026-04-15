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

(none)

## Decisions

- **[iter-1] sql.js over better-sqlite3**: Chose sql.js (pure WASM SQLite) for zero native compilation requirements. Trade-off: slightly slower than native, but eliminates build toolchain issues.
- **[iter-1] In-memory DB with debounced disk persistence**: sql.js operates in-memory; `debouncedSave()` writes to disk every 500ms. `flushSave()` forces immediate write. Reset endpoint calls both to prevent stale data.
- **[iter-1] DB_PATH via __dirname**: Used `path.resolve(__dirname, '../../minipanel.db')` instead of `process.cwd()` because npm workspace scripts resolve cwd to the workspace directory, not the project root.
- **[iter-1] Unicode sidebar icons**: Replaced lucide-react SVG icons with Unicode characters to avoid Recharts SVG element conflicts in Playwright locators.
- **[iter-1] Trends API dual response format**: `{ data }` for single series, `{ series: [{ key, data }] }` for breakdown. Both always include `total_count` and `unique_users` fields per data point.
- **[iter-1] Identity resolution in all queries**: User profile, trends (COALESCE), funnels, and event queries all resolve device_id → user_id via identity_mappings table.
- **[iter-1] Funnel step-order enforcement**: Funnels enforce temporal ordering — user must complete step N before step N+1 (by timestamp). Uses iterative SQL with temp table approach.

## E2E Test Fixes

- **e2e/ui-trends.spec.ts:75-80** — Criterion 2 (references non-existent state). Added `.first()` to `.or()` locator chain that matched multiple SVG elements (Recharts surface + other SVGs). Behavioral intent preserved: still asserts chart is visible.
- **e2e/ui-trends.spec.ts:152** — Criterion 2. Same fix — `.first()` on chart wrapper locator. Behavioral intent preserved.
