## Build & Run

```bash
# Dev (both server + client)
npm run dev          # server on :3001, client on :5173

# Typecheck
npm run typecheck    # checks both server and client workspaces

# Server tests (vitest)
npm test -w server   # or: npm test

# E2E tests (Playwright)
npx playwright test --reporter=list

# Reset DB for clean state
curl -X POST http://localhost:3001/api/test/reset
```

## Architecture

- **Monorepo**: npm workspaces — `server/` (Express + sql.js) and `client/` (React 19 + Vite 6 + Tailwind CSS v4)
- **Database**: sql.js (in-memory SQLite compiled to WASM), persisted to `minipanel.db` at project root
- **DB path**: `path.resolve(__dirname, '../../minipanel.db')` in `server/src/db.ts` — do NOT use `process.cwd()` (resolves to `server/` in npm workspace context)
- **Identity resolution**: `server/src/identity.ts` — resolveIdentity(), getAllDevicesForUser(), getEventsForUser()
- **Charting**: Recharts (line, bar, area) — uses Unicode icons in sidebar to avoid SVG conflicts with Recharts surfaces

## Validation

```bash
npx playwright test --reporter=list    # 99 E2E tests
npm test -w server                      # 15 vitest unit tests
npm run typecheck                       # server + client typecheck
```

## Operational Notes

- **DB_PATH gotcha**: `process.cwd()` in an npm workspace `dev` script resolves to the workspace dir (`server/`), not the project root. Always use `__dirname`-relative paths.
- **Test isolation**: `POST /api/test/reset` clears all tables AND calls `flushSave()` + `saveDb()` to persist clean state to disk. `playwright-global-setup.ts` calls this before all tests.
- **Debounced saves**: `debouncedSave()` schedules disk write in 500ms. `flushSave()` cancels pending debounce and writes immediately. Always call `flushSave()` before `saveDb()` in reset endpoints.
- **Recharts + SVG icons conflict**: Recharts renders `<svg>` elements; if sidebar uses SVG icon libraries (lucide-react, heroicons), Playwright locators like `page.locator('svg')` match both. Solution: use Unicode characters for sidebar icons.
- **Playwright strict mode**: `getByText()` and `.toBeVisible()` fail if multiple elements match. Use `.first()` or more specific locators.
- **Trends API dual format**: Returns `{ data: [...] }` without breakdown, `{ series: [{ key, data }] }` with `breakdown_by` param.

### Codebase Patterns

- Test files use unique prefixes per spec file (`t01q`, `t02`, `t04u`, `t05p`, `t06f`, `t07`, `t08u`, `t08f`) to prevent data collision across parallel workers
- Frontend API client in `client/src/lib/api.ts` — all fetch functions typed
- Backend routes in `server/src/routes/` — events, queries, trends, funnels, users, properties, saved
- Design system tokens in `.claude/skills/minipanel-design/references/`
