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

- **2026-04-15 — AC directory names vs existing scaffolding:** US-001 acceptance criteria specify `server/` and `client/` directory names. The pre-existing root package.json referenced `backend/` and `frontend/` workspaces. Implementation follows the AC spec (`server/`/`client/`). The old `backend/` and `frontend/` dirs with `.gitkeep` remain in the working tree but are unused.

## Decisions

- **2026-04-15 (iter 1) — Tailwind v4 + shadcn/ui manual setup:** Used Tailwind CSS v4 with `@tailwindcss/vite` plugin and manual shadcn/ui component scaffolding (Button). CSS vars use hex values aligned with MiniPanel design system neutral palette. Added `overrides.vite: "^6.0.0"` in root package.json to prevent npm hoisting Vite 5 alongside Vite 6 (which caused TypeScript Plugin type conflicts).
- **2026-04-15 (iter 2) — SQLite via better-sqlite3:** Used `better-sqlite3` (synchronous API) per spec notes. DB file at project root (`minipanel.db`), WAL mode enabled. Schema init is idempotent (`CREATE TABLE IF NOT EXISTS`). `db.ts` exports `initDb()` (called once at startup) and `getDb()` for subsequent use. UNIQUE constraint on `identity_mappings.device_id` enforces one-device-to-one-user rule.
- **2026-04-15 (iter 3) — DB_PATH fix:** Changed `DB_PATH` from `process.cwd()`-relative to `import.meta.url`-relative (two levels up from `server/src/`). The `process.cwd()` approach broke when vitest ran from the `server/` workspace directory, placing the DB at `server/minipanel.db` instead of the project root. Also exported `DB_PATH` from `db.ts` so consumers can reference the canonical path.

