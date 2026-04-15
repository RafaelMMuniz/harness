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

### Iteration 1 (2026-04-15) — US-001 scaffold

- **`server/` + `client/` instead of `backend/` + `frontend/`**: Acceptance criteria explicitly require these directory names. Updated root package.json workspaces accordingly.
- **Tailwind CSS v4 with `@tailwindcss/vite` plugin**: No separate tailwind.config needed. Theme customization via CSS `@theme` directive.
- **shadcn/ui manual setup**: Created `components.json`, `lib/utils.ts`, and Button component manually rather than using `npx shadcn init` to avoid workspace path issues.
- **Express v4 + tsx for dev**: Using `tsx watch` for hot-reload during development. Zod installed as runtime dependency per spec.
- **TypeScript 6**: Removed deprecated `baseUrl` from client tsconfig; `paths` work without it in TS6+.

