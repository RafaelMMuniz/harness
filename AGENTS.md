## Build & Run

```bash
npm install          # installs all workspace dependencies (backend + frontend)
npm run dev          # starts both backend (port 3001) and frontend (port 5173) via concurrently
npm run typecheck    # typechecks both backend and frontend
npm run build        # builds both backend and frontend
```

### Workspaces

- `backend/` — Express.js + TypeScript backend. Dev: `tsx watch`. Typecheck: `tsc --noEmit`.
- `frontend/` — React + Vite + TypeScript + Tailwind v4 + shadcn/ui frontend. Dev: `vite`. Typecheck: `tsc -b`.

### Ports

- Backend: 3001
- Frontend: 5173 (proxies `/api/*` to backend)

## Validation

(Not yet set up — validator iteration 1 will populate this)

## Operational Notes

- Root `overrides.vite: "^6.0.0"` is required to prevent Vite 5/6 type conflicts in npm workspace hoisting.
- TypeScript 6 deprecates `baseUrl` in tsconfig. Frontend uses `paths` without `baseUrl` (supported since TS 5.0).
- After changing root package.json workspaces or overrides, delete `node_modules/` and `package-lock.json` and reinstall.

### Codebase Patterns

- shadcn/ui components in `frontend/src/components/ui/`. Config in `frontend/components.json`.
- Path alias `@/` maps to `frontend/src/` (via Vite `resolve.alias` and tsconfig `paths`).
- CSS vars for design tokens in `frontend/src/index.css`. Font stack: system monospace.
