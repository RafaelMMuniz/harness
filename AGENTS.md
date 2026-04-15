## Build & Run

```bash
npm install            # installs root + server + client via workspaces
npm run dev            # starts server (port 3001) + client (port 5173) concurrently
npm run typecheck      # typechecks server then client
npm run build          # builds server (tsc) then client (vite build)
```

- Server dev: `tsx watch src/index.ts` (hot-reload)
- Client dev: `vite` with proxy `/api` → `localhost:3001`
- Workspaces: `server` and `client` (NOT `backend`/`frontend`)

## Validation

```bash
npx playwright test --list    # verify Playwright config
npx playwright test           # run E2E tests (needs dev servers running)
```

## Operational Notes

- TypeScript 6 deprecates `baseUrl` — use `paths` without it
- Tailwind CSS v4 uses `@tailwindcss/vite` plugin, no separate config file
- shadcn components live in `client/src/components/ui/`

### Codebase Patterns

- Server entry: `server/src/index.ts`
- Client entry: `client/src/main.tsx`
- Path alias: `@/` → `client/src/`
- CSS utility: `cn()` from `@/lib/utils`
