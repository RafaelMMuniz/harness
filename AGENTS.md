## Build & Run

```bash
# Start both backend and frontend (from project root)
npm run dev

# Start backend only
npm run dev -w backend

# Start frontend only
npm run dev -w frontend

# Seed sample data (from project root — runs in backend/ context)
cd backend && npx tsx src/seed.ts

# TypeScript check
npx tsc --noEmit -p frontend/tsconfig.json
npx tsc --noEmit -p backend/tsconfig.json
```

## Validation

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/ui-trends.spec.ts

# Run tests matching grep pattern
npx playwright test --grep "tooltip|breakdown"
```

## Operational Notes

### Database
- **sql.js** (WASM SQLite): in-memory with file persistence every 5 seconds
- DB file location: `backend/minipanel.db` (NOT project root — backend runs from backend/ workspace)
- Backend auto-seeds 300 historical events (30–60 days old) when DB is empty on startup
- To reset: delete `backend/minipanel.db` and restart server
- After re-seeding, **must restart the backend** — the in-memory DB doesn't detect file changes

### Testing
- `fullyParallel: false` in playwright.config.ts — prevents duplicate event creation from multiple workers
- Tests use 2 workers by default; test files are distributed across workers
- Each test file's `beforeAll` seeds its own events with unique prefixes (e.g., `test-ui-events-*`)
- Events accumulate across test runs — delete DB between runs for clean results
- The test helpers (e2e/helpers.ts) use `http://localhost:3001` (direct backend), not the Vite proxy
- `e2e/` directory is **read-only** during Phase 2 — never modify test files

### Architecture
- Backend: Express + TypeScript on port 3001
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS on port 5173 (proxies /api → 3001)
- Charts: Recharts with line/bar/area support
- Identity resolution: `LEFT JOIN identity_mappings im ON e.device_id = im.device_id` + `COALESCE(im.user_id, e.user_id, e.device_id)` for resolved identity
- Select components: custom (role=combobox) for TrendsPage, native `<select>` for EventsPage/FunnelsPage

### Known Gotchas
- Breakdown API param is `breakdown_by` (not `breakdown`)
- Breakdown response always returns `value` field regardless of measure type
- Recharts tooltip needs `defaultIndex` + `wrapperStyle={{ visibility: 'visible' }}` for Playwright detection
- Events page LIMIT=200 to accommodate both pagination and date-filter tests with concurrent workers
