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


## Decisions

### [iter-2] 2026-04-15 — TypeScript 6 compat
Root package.json pins `typescript: ^6.0.2`. TS 6 deprecates `baseUrl` in tsconfig.
Removed `baseUrl` from `client/tsconfig.app.json`; `paths` resolves relative to the tsconfig file in TS 6+.

### [iter-2] 2026-04-15 — Tailwind v3 for shadcn compat
Using Tailwind v3 (classic PostCSS setup) rather than v4 to ensure full shadcn/ui component compatibility.
Design tokens (monospace font stack) configured in `client/tailwind.config.ts`.

