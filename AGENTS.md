## Build & Run

```bash
npm install          # installs all workspace dependencies (server + client)
npm run dev          # starts both server (port 3001) and client (port 5173) via concurrently
npm run typecheck    # typechecks both server and client
npm run build        # builds both server and client
```

### Workspaces

- `server/` — Express.js + TypeScript backend. Dev: `tsx watch`. Typecheck: `tsc --noEmit`.
- `client/` — React + Vite + TypeScript + Tailwind v4 + shadcn/ui frontend. Dev: `vite`. Typecheck: `tsc -b`.

### Ports

- Backend: 3001
- Frontend: 5173 (proxies `/api/*` to backend)

## Validation

(Not yet set up — validator iteration 1 will populate this)

## Operational Notes

- Root `overrides.vite: "^6.0.0"` is required to prevent Vite 5/6 type conflicts in npm workspace hoisting.
- TypeScript 6 deprecates `baseUrl` in tsconfig. Client uses `paths` without `baseUrl` (supported since TS 5.0).
- After changing root package.json workspaces or overrides, delete `node_modules/` and `package-lock.json` and reinstall.

### Codebase Patterns

- shadcn/ui components in `client/src/components/ui/`. Config in `client/components.json`.
- Path alias `@/` maps to `client/src/` (via Vite `resolve.alias` and tsconfig `paths`).
- CSS vars for design tokens in `client/src/index.css`. Font stack: system monospace.
