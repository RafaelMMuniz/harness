## Build & Run

(Not yet bootstrapped — coder iteration 1 will populate this)

## Validation

### Test commands (once project is bootstrapped)

1. **E2E typecheck**: `npx tsc --noEmit -p tsconfig.e2e.json`
2. **List E2E tests**: `npx playwright test --list`
3. **Run E2E tests**: `npx playwright test` (requires dev server running on :5173 and backend on :3001)
4. **Backend unit tests**: `npm test` (delegates to backend workspace)
5. **Typecheck all**: `npm run typecheck` (delegates to backend + frontend workspaces)

### Current state (iteration 1)

- E2E test infrastructure: 4 files in `e2e/` (helpers.ts + 3 spec files, 23 tests)
- Backend tests: none yet (no test framework, no backend code)
- Frontend tests: none yet (no frontend code)
- Project not bootstrapped — no tests can run against a server

## Operational Notes

(none yet)

### Codebase Patterns

- Root package.json uses npm workspaces (`backend`, `frontend`)
- E2E tests use Playwright `request` fixture for API tests (no browser)
- E2E helpers target `http://localhost:3001` (Express backend directly)
- Playwright config targets `http://localhost:5173` (Vite frontend)
