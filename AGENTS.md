## Build & Run

(Not yet bootstrapped — coder iteration 1 will populate this)

## Validation

### Test Commands
```bash
npm test                              # Backend unit/integration tests (requires backend workspace)
npm run typecheck                     # TypeScript check across workspaces (requires both)
npx tsc --noEmit -p tsconfig.e2e.json # TypeScript check on e2e test files only
npx playwright test --list            # List all e2e test cases
npx playwright test                   # Run all Playwright e2e tests (needs dev server)
```

### Current State (iteration 1)
- Backend/frontend workspaces not bootstrapped — `npm test` and `npm run typecheck` fail
- e2e/helpers.ts compiles cleanly; no spec files exist yet
- Playwright config ready but no tests to run

## Operational Notes

(none yet)

### Codebase Patterns

(none yet)
