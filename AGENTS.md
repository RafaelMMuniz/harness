## Build & Run

```bash
npm install          # installs all workspace deps (root + server + client)
npm run dev          # starts Express (3001) + Vite (5173) via concurrently
npm run typecheck    # tsc for both server and client
npm run build        # compile server + build client
```

- Server dev: `tsx watch` (no compile step, runs TypeScript directly)
- Client dev: Vite with React plugin, proxies `/api` to `localhost:3001`
- TypeScript 6 — avoid `baseUrl` in tsconfigs (deprecated, errors in TS 6)

## Validation

```bash
npx playwright test --list           # verify playwright config
npx playwright test e2e/US-001.spec.ts  # run a specific test
```

## Operational Notes

- Root `package.json` uses npm workspaces (`server`, `client`)
- `concurrently` runs both dev servers from `npm run dev`
- Playwright `webServer` config starts `npm run dev` automatically during e2e tests

### Codebase Patterns

- shadcn/ui components in `client/src/components/ui/` — use `@/` path alias
- `cn()` utility at `client/src/lib/utils.ts` (clsx + tailwind-merge)
- Design tokens: monospace font stack, neutral grays only, chart orange `#FF7F11`
