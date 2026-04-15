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

