# Test-First Harness Design

## Overview

The MiniPanel harness uses a test-first approach: the agent writes Playwright E2E and API contract tests before any application code exists. A single PRD file orders test stories (priority 1-5) before implementation stories (priority 10-23). Each implementation story's acceptance criteria include passing the specific test files written in Phase 1.

Tests fail naturally against a non-existent server during Phase 1. During Phase 2, the implementation agent treats `e2e/` as read-only and uses failing tests as its primary feedback loop.

## Test scope

- **Playwright E2E tests** — browser-level tests for UI flows (events page, user lookup, navigation)
- **API contract tests** — HTTP-level tests using Playwright's `APIRequestContext` (no browser needed) for all endpoints
- **NOT included in Phase 1** — vitest unit tests for identity resolution (US-006 stays in Phase 2, written by the implementation agent against internal functions)

## Test file layout

```
e2e/
  helpers.ts              — shared API wrappers
  api-events.spec.ts      — POST /api/events, POST /api/events/batch
  api-queries.spec.ts     — GET /api/events (filters/pagination), GET /api/events/names, GET /api/stats/overview
  api-users.spec.ts       — GET /api/users/:id
  identity.spec.ts        — BR-101 verification scenarios via API
  ui-events.spec.ts       — Events page table, filters, pagination, row expand, empty state
  ui-navigation.spec.ts   — Sidebar nav, active state, placeholder pages
  ui-users.spec.ts        — User lookup search, timeline, identity cluster
```

## Playwright config

- `baseURL`: `http://localhost:5173`
- Action timeout: 5s
- Navigation timeout: 10s
- `webServer`: starts `npm run dev`, waits for `http://localhost:5173`
- `use.baseURL` for browser tests, direct `http://localhost:3001/api` for API tests in helpers

## Shared helpers (`e2e/helpers.ts`)

Exports functions wrapping API calls via Playwright's `APIRequestContext`:

- `createEvent(request, { event, device_id?, user_id?, timestamp?, properties? })` — POST /api/events, returns response
- `createBatchEvents(request, events[])` — POST /api/events/batch, returns response
- `getEvents(request, filters?)` — GET /api/events with query params, returns response
- `getEventNames(request)` — GET /api/events/names, returns response
- `getStatsOverview(request)` — GET /api/stats/overview, returns response
- `getUserProfile(request, id)` — GET /api/users/:id, returns response

All helpers return the raw Playwright `APIResponse` so tests can assert on status codes and body.

## Test data strategy

All tests self-seed their own data via the API helpers in `beforeAll` or `beforeEach` hooks. No test depends on `npm run seed` or any external data setup. Each test file creates exactly the data it needs before making assertions. This keeps tests self-contained and deterministic.

For UI tests specifically: the `beforeAll` hook uses `request` (Playwright's API context) to create events, identity mappings, and users via POST /api/events before navigating the browser. This means UI tests depend on the API endpoints working — so the implementation agent must build API endpoints (US-003, US-004) before UI tests can pass.

## Phase 1: Test stories

### US-T00 — Test scaffolding (priority 1)

Create the test infrastructure.

**Files:** `playwright.config.ts`, `e2e/helpers.ts`

**Acceptance criteria:**
- `playwright.config.ts` exists with config described above
- `e2e/helpers.ts` exports all 6 helper functions
- `npx tsc --noEmit` passes on all test files (TypeScript compiles)

### US-T01 — API contract tests (priority 2)

Write tests for all API endpoints using Playwright `request` context (no browser).

**Files:** `e2e/api-events.spec.ts`, `e2e/api-queries.spec.ts`, `e2e/api-users.spec.ts`

**Test cases in `api-events.spec.ts`:**
- POST /api/events with valid event (all fields) returns 201 + stored event object with generated id
- POST /api/events with valid event (minimal: event + device_id only) returns 201
- POST /api/events with valid event (minimal: event + user_id only) returns 201
- POST /api/events missing event name returns 400 with error message
- POST /api/events missing both device_id and user_id returns 400 with error message
- POST /api/events with omitted timestamp returns 201 and server sets timestamp (ISO 8601)
- POST /api/events with properties returns 201 and properties round-trip as object (not JSON string)
- POST /api/events/batch with valid events returns 200 with `{ accepted, errors }` and errors is empty
- POST /api/events/batch with mix of valid and invalid events returns 200, accepted count matches valid count, errors array has entries with index + message for invalid events
- POST /api/events/batch with empty array returns 400
- POST /api/events/batch with >1000 events returns 400

**Test cases in `api-queries.spec.ts`:**
- GET /api/events with no params returns `{ events, total, limit, offset }` with default limit=50, offset=0
- GET /api/events returns events sorted by timestamp descending (newest first)
- GET /api/events?event_name=X filters to only events with that name
- GET /api/events?start_date=X&end_date=Y filters to events within range (inclusive)
- GET /api/events?limit=10&offset=5 returns correct page
- GET /api/events with combined filters (event_name + date range) applies AND logic
- GET /api/events/names returns alphabetically sorted array of distinct event name strings
- GET /api/stats/overview returns `{ total_events, total_users, event_counts_by_name, date_range }`
- GET /api/stats/overview total_users uses resolved identities (mapped devices not double-counted)

**Test cases in `api-users.spec.ts`:**
- GET /api/users/:id with valid user_id returns `{ user_id, device_ids, total_events, first_seen, last_seen }`
- GET /api/users/:id with device_id resolves to mapped user
- GET /api/users/:id with unknown ID returns 404 with `{ error }` message

**Acceptance criteria:**
- All test files compile
- `npx playwright test --list` lists all API test cases

### US-T02 — Identity resolution E2E tests (priority 3)

Write the BR-101 "how to verify" scenarios as API-level tests.

**Files:** `e2e/identity.spec.ts`

**Test cases:**
- Retroactive merge: send 4 anonymous events for device-X (no user_id), send 1 event with device_id=device-X AND user_id=user-Y, GET /api/events?user_id=user-Y returns all 5 events
- Multi-device merge: send events for device-A and device-B (anonymous), link device-A to user-Z, link device-B to user-Z, GET /api/events?user_id=user-Z returns events from both devices
- Collision rejection: send event linking device-C to user-P (creates mapping), send event linking device-C to user-Q, second request returns 409
- Unresolved device: send events for device-D (no mapping ever created), GET /api/events?device_id=device-D returns only device-D events, identity resolves to device-D itself

**Acceptance criteria:**
- Test file compiles
- `npx playwright test --list` lists all 4 identity test cases

### US-T03 — UI E2E tests: Events page (priority 4)

Write browser-level tests for the event explorer page. Tests self-seed data via API helpers in `beforeAll` (create events with varied names, timestamps, properties, and identities — enough for filter, pagination, and expand assertions).

**Files:** `e2e/ui-events.spec.ts`

**Test cases:**
- Events page loads at '/' and shows a table with event data
- Table has columns: Timestamp, Event Name, User, Properties
- Filter by event name using dropdown updates the table
- Filter by date range updates the table
- Pagination: Next button loads next page, Previous button loads prior page
- Clicking a table row expands to show event properties as key-value pairs
- Empty state shows message when no events match filters
- Loading indicator visible while data is being fetched

**Acceptance criteria:**
- Test file compiles
- `npx playwright test --list` lists all Events page test cases

### US-T04 — UI E2E tests: Navigation + User lookup (priority 5)

Write browser-level tests for app shell navigation and user lookup page.

**Files:** `e2e/ui-navigation.spec.ts`, `e2e/ui-users.spec.ts`

**Test cases in `ui-navigation.spec.ts`:**
- Sidebar displays 'MiniPanel' title
- Sidebar has 4 navigation links: Events, Users, Funnels, Settings
- Clicking each nav link navigates to correct route
- Active nav item is visually distinct (different styling)
- Funnels and Settings routes show placeholder content

**Test cases in `ui-users.spec.ts`:** (self-seeds via API in `beforeAll`: creates a user with device mapping, events from both anonymous and identified phases)
- Users page at '/users' shows search input and search button
- Search by user_id shows resolved identity heading ('User: <id>')
- Search result shows list of associated device IDs
- Event timeline shows events in chronological order (oldest first)
- Each timeline event shows timestamp, event name, and expanded properties
- Search by device_id resolves to mapped user and shows full profile
- Search for unknown ID shows empty state message

**Acceptance criteria:**
- All test files compile
- `npx playwright test --list` lists all navigation + user lookup test cases

## Phase 2: Implementation stories

Existing US-001 through US-014 from `prd-tier1.json`, renumbered to priority 10-23.

Each story gets an added acceptance criterion specifying which test files must pass:

| Story | Priority | Added acceptance criterion |
|---|---|---|
| US-001 (scaffolding) | 10 | `npx playwright test --list` succeeds (Playwright config valid) |
| US-002 (database) | 11 | _(no test mapping — prerequisite for API)_ |
| US-003 (event ingestion) | 12 | `npx playwright test api-events.spec.ts` passes (single event POST /api/events tests) |
| US-004 (batch ingestion) | 13 | `npx playwright test api-events.spec.ts` passes (all tests — single + batch) |
| US-005 (identity resolution) | 14 | `npx playwright test identity.spec.ts` passes |
| US-006 (unit tests) | 15 | _(kept as-is — writes vitest unit tests in Phase 2)_ |
| US-007 (event listing API) | 16 | `npx playwright test api-queries.spec.ts` passes |
| US-008 (seeder) | 17 | `npx playwright test api-queries.spec.ts` still passes after seeding |
| US-009 (app shell) | 18 | `npx playwright test ui-navigation.spec.ts` passes |
| US-010 (event explorer) | 19 | `npx playwright test ui-events.spec.ts` passes |
| US-011 (stats API) | 20 | `npx playwright test api-queries.spec.ts` passes (names + stats tests) |
| US-012 (user lookup) | 21 | `npx playwright test ui-users.spec.ts` and `npx playwright test api-users.spec.ts` pass |
| US-013 (E2E test) | — | **Removed** — covered by Phase 1 tests |
| US-014 (polish) | 22 | `npx playwright test` passes (all tests) |

## PROMPT_build.md change

Add to the build prompt:

> The `e2e/` directory contains pre-written Playwright tests that define the expected behavior of the application. After completing each user story, run the test command specified in that story's acceptance criteria. If tests fail, fix your implementation — do NOT modify files in `e2e/`. The tests are the specification.

## Phase transition

No manual gate. The agent processes stories by priority order: test stories (1-5) first, implementation stories (10-22) second. The priority gap (6-9 unused) ensures clear separation.
