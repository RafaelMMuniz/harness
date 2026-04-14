# Test-First Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a merged PRD and updated build prompt that implements the test-first harness design — test stories before implementation stories in a single file.

**Architecture:** Single `prd-tier1.json` with priority-ordered user stories. Test stories (US-T00–US-T04, priority 1–5) are written by the agent first. Implementation stories (US-001–US-014 minus US-013, priority 10–22) follow, each with an acceptance criterion requiring specific Playwright tests to pass.

**Tech Stack:** JSON (PRD), Markdown (build prompt)

---

### Task 0: Write merged prd-tier1.json

**Goal:** Replace the current PRD with a merged version containing 5 test stories + 13 implementation stories.

**Files:**
- Modify: `prd-tier1.json`

**Acceptance Criteria:**
- [ ] US-T00 through US-T04 present with priorities 1-5
- [ ] US-001 through US-012, US-014 present with priorities 10-22
- [ ] US-013 removed (covered by Phase 1 tests)
- [ ] Each implementation story has a test-mapping acceptance criterion added
- [ ] JSON is valid

**Verify:** `node -e "const p=JSON.parse(require('fs').readFileSync('prd-tier1.json','utf8')); console.log(p.userStories.length + ' stories'); console.log(p.userStories.map(s=>s.id).join(', '))"` → `18 stories` and all IDs listed

**Steps:**

- [ ] **Step 1: Write prd-tier1.json with full content**

Overwrite `prd-tier1.json` with the following:

```json
{
  "project": "MiniPanel",
  "branchName": "ralph/minipanel-foundation",
  "description": "MiniPanel Foundation — Test-first harness. Phase 1 (priority 1-5): agent writes Playwright E2E and API contract tests. Phase 2 (priority 10-22): agent implements the application, each story must pass its mapped tests.",
  "userStories": [
    {
      "id": "US-T00",
      "title": "Write test scaffolding: Playwright config and shared helpers",
      "description": "Create the Playwright configuration and shared API helper functions that all test files will use. Write ONLY test infrastructure files — no application code.",
      "acceptanceCriteria": [
        "playwright.config.ts exists at the project root with: baseURL 'http://localhost:5173', actionTimeout 5000ms, navigationTimeout 10000ms, webServer configured to run 'npm run dev' and wait for http://localhost:5173, reuseExistingServer: true",
        "e2e/helpers.ts exists and exports these functions using Playwright's APIRequestContext against http://localhost:3001 (direct to Express, not through Vite proxy):",
        "  createEvent(request, { event, device_id?, user_id?, timestamp?, properties? }) → POST /api/events, returns APIResponse",
        "  createBatchEvents(request, events[]) → POST /api/events/batch, returns APIResponse",
        "  getEvents(request, filters?: { event_name?, user_id?, device_id?, start_date?, end_date?, limit?, offset? }) → GET /api/events with query params, returns APIResponse",
        "  getEventNames(request) → GET /api/events/names, returns APIResponse",
        "  getStatsOverview(request) → GET /api/stats/overview, returns APIResponse",
        "  getUserProfile(request, id) → GET /api/users/:id, returns APIResponse",
        "All helpers return the raw Playwright APIResponse so tests can assert on both status codes and response body",
        "TypeScript compiles with no errors: npx tsc --noEmit passes on all e2e/ files",
        "git commit with message 'test: add Playwright config and shared API helpers'"
      ],
      "priority": 1,
      "passes": false,
      "notes": "This is test infrastructure only. The helpers define the API contract that the implementation must fulfill. Use the Playwright test() and expect() imports from @playwright/test."
    },
    {
      "id": "US-T01",
      "title": "Write API contract tests for all endpoints",
      "description": "Write Playwright tests for all API endpoints using the request fixture (no browser). Tests self-seed their own data via the helpers in beforeAll/beforeEach hooks. Write ONLY test files — no application code.",
      "acceptanceCriteria": [
        "e2e/api-events.spec.ts contains tests for POST /api/events and POST /api/events/batch:",
        "  - POST /api/events with all fields (event, device_id, user_id, timestamp, properties) returns 201 with stored event including generated id",
        "  - POST /api/events with minimal fields (event + device_id only) returns 201",
        "  - POST /api/events with minimal fields (event + user_id only) returns 201",
        "  - POST /api/events missing event name returns 400 with { error } body",
        "  - POST /api/events missing both device_id and user_id returns 400 with { error } body",
        "  - POST /api/events with omitted timestamp returns 201 and response contains a server-set ISO 8601 timestamp",
        "  - POST /api/events with properties object returns 201 and properties round-trip as object (not stringified JSON)",
        "  - POST /api/events/batch with array of valid events returns 200 with { accepted: N, errors: [] }",
        "  - POST /api/events/batch with mix of valid and invalid events returns 200, accepted count = valid count, errors array has { index, message } for each invalid event",
        "  - POST /api/events/batch with empty array returns 400",
        "  - POST /api/events/batch with >1000 events returns 400",
        "e2e/api-queries.spec.ts contains tests for GET /api/events, GET /api/events/names, GET /api/stats/overview:",
        "  - GET /api/events with no params returns { events, total, limit: 50, offset: 0 }",
        "  - GET /api/events returns events sorted by timestamp descending (newest first)",
        "  - GET /api/events?event_name=X returns only events matching that name",
        "  - GET /api/events?start_date=X&end_date=Y returns only events within the date range (inclusive)",
        "  - GET /api/events?limit=10&offset=5 returns correct page slice",
        "  - GET /api/events with combined filters (event_name + date range) applies AND logic",
        "  - GET /api/events/names returns alphabetically sorted array of distinct event name strings",
        "  - GET /api/stats/overview returns { total_events, total_users, event_counts_by_name, date_range: { earliest, latest } }",
        "  - GET /api/stats/overview total_users counts resolved identities (device mapped to user is not double-counted)",
        "e2e/api-users.spec.ts contains tests for GET /api/users/:id:",
        "  - GET /api/users/:id with known user_id returns { user_id, device_ids: string[], total_events, first_seen, last_seen }",
        "  - GET /api/users/:id with device_id that has a mapping returns the resolved user profile",
        "  - GET /api/users/:id with unknown ID returns 404 with { error } body",
        "All test files compile: npx tsc --noEmit passes",
        "npx playwright test --list lists all API test cases without errors",
        "git commit with message 'test: add API contract tests for events, queries, and users'"
      ],
      "priority": 2,
      "passes": false,
      "notes": "Tests seed their own data using createEvent() and createBatchEvents() helpers in beforeAll hooks. Each test file should create fresh data with unique identifiers to avoid cross-test interference. API tests use the Playwright request fixture directly — no browser needed."
    },
    {
      "id": "US-T02",
      "title": "Write identity resolution E2E tests",
      "description": "Write the BR-101 identity resolution verification scenarios as API-level Playwright tests. These are the most critical tests — they verify the core invariant of the system. Tests self-seed via API helpers. Write ONLY test files — no application code.",
      "acceptanceCriteria": [
        "e2e/identity.spec.ts contains exactly 4 test cases:",
        "  Test 1 — Retroactive merge: create 4 events with device_id='test-device-X' and no user_id, then create 1 event with device_id='test-device-X' AND user_id='test-user-Y' (this triggers the identity mapping), then GET /api/events?user_id=test-user-Y and assert all 5 events are returned",
        "  Test 2 — Multi-device merge: create events for device_id='test-device-A' (no user_id), create events for device_id='test-device-B' (no user_id), create event linking test-device-A to test-user-Z, create event linking test-device-B to test-user-Z, then GET /api/events?user_id=test-user-Z and assert events from both devices appear",
        "  Test 3 — Collision rejection: create event with device_id='test-device-C' and user_id='test-user-P' (creates mapping), then create event with device_id='test-device-C' and user_id='test-user-Q', assert second request returns 409 status",
        "  Test 4 — Unresolved device: create events for device_id='test-device-D' with no user_id (never create a mapping), then GET /api/events?device_id=test-device-D, assert only test-device-D events are returned",
        "Test file compiles: npx tsc --noEmit passes",
        "npx playwright test --list lists all 4 identity test cases",
        "git commit with message 'test: add identity resolution E2E tests (BR-101 scenarios)'"
      ],
      "priority": 3,
      "passes": false,
      "notes": "Use unique test- prefixed IDs in each test to avoid collisions with other test files. Each test should be independent — seed its own data in beforeEach or at the start of the test. These tests mirror the 'How to verify' section from the business requirements."
    },
    {
      "id": "US-T03",
      "title": "Write UI E2E tests for Events page",
      "description": "Write browser-level Playwright tests for the event explorer page. Tests self-seed data via API helpers in beforeAll (create events with varied names, timestamps, properties, and identities — enough for filter, pagination, and expand assertions). Write ONLY test files — no application code.",
      "acceptanceCriteria": [
        "e2e/ui-events.spec.ts contains a beforeAll hook that seeds test data via the API: at least 60 events across 3+ event types with varied timestamps and properties, using createEvent() or createBatchEvents() helpers",
        "Test: Events page loads at '/' and renders a table containing event data",
        "Test: Table displays columns — Timestamp, Event Name, User identity, Properties preview",
        "Test: Filter by event name using a dropdown/select updates the table to show only matching events",
        "Test: Filter by date range (start and end date inputs) updates the table",
        "Test: Pagination — Next button loads the next page, Previous button returns to prior page",
        "Test: Clicking a table row expands to show all event properties as key-value pairs",
        "Test: Empty state message appears when filters match no events",
        "Test file compiles: npx tsc --noEmit passes",
        "npx playwright test --list lists all Events page test cases",
        "git commit with message 'test: add UI E2E tests for Events explorer page'"
      ],
      "priority": 4,
      "passes": false,
      "notes": "The beforeAll data seeding uses the API helpers which POST to http://localhost:3001 directly. Use data-testid attributes in selectors where possible for resilience. For the empty state test, filter by a non-existent event name. The pagination test needs at least 51 events (default page size is 50) to verify Next works."
    },
    {
      "id": "US-T04",
      "title": "Write UI E2E tests for navigation and user lookup",
      "description": "Write browser-level Playwright tests for the app shell navigation and user lookup page. User lookup tests self-seed via API in beforeAll: create a user with device mapping, events from both anonymous and identified phases. Write ONLY test files — no application code.",
      "acceptanceCriteria": [
        "e2e/ui-navigation.spec.ts contains tests:",
        "  - Sidebar displays 'MiniPanel' title text",
        "  - Sidebar has navigation links for Events, Users, Funnels, Settings",
        "  - Clicking each nav link navigates to the correct route ('/', '/users', '/funnels', '/settings')",
        "  - Active navigation item has visually distinct styling (check for an active class or different aria attribute)",
        "  - Funnels and Settings routes display placeholder content",
        "e2e/ui-users.spec.ts contains a beforeAll hook that seeds: 3 anonymous events for a test device, then 1 identified event linking that device to a test user (creating the identity mapping), via the API helpers",
        "e2e/ui-users.spec.ts contains tests:",
        "  - Users page at '/users' shows a search input and a search button",
        "  - Searching by user_id displays the resolved identity heading ('User: <id>')",
        "  - Search result shows a list of associated device IDs",
        "  - Event timeline displays events in chronological order (oldest first)",
        "  - Each timeline event shows timestamp, event name, and expanded properties",
        "  - Searching by device_id resolves to the mapped user and shows the full profile",
        "  - Searching for an unknown ID shows an empty state message",
        "All test files compile: npx tsc --noEmit passes",
        "npx playwright test --list lists all navigation and user lookup test cases",
        "git commit with message 'test: add UI E2E tests for navigation and user lookup'"
      ],
      "priority": 5,
      "passes": false,
      "notes": "Navigation tests don't need seeded data — they test the shell layout and routing. User lookup tests need the identity resolution scenario seeded via API to verify retroactive merge in the UI. Use data-testid on search input and button for resilient selectors."
    },
    {
      "id": "US-001",
      "title": "Initialize project with monorepo structure",
      "description": "As a developer, I need the project scaffolded with the chosen tech stack so that all subsequent stories have a working build pipeline.",
      "acceptanceCriteria": [
        "Project root contains a package.json with a single 'npm run dev' command that starts both backend and frontend concurrently",
        "Backend: Express.js + TypeScript in a 'server/' directory, compiles and starts on port 3001",
        "Frontend: React + Vite + TypeScript + TailwindCSS in a 'client/' directory, starts on port 5173 and proxies API requests to backend",
        "Shadcn UI initialized in client with at least one component (Button) available",
        "lucide-react installed and importable in client",
        "Zod installed and importable in server",
        "Playwright installed with existing test files in 'e2e/' intact — do NOT modify or delete any files in e2e/",
        "A single 'npm install' at the root installs all dependencies (workspaces or similar)",
        "README.md documents: 'npm install && npm run dev' as the single start command",
        "Typecheck passes for both client and server",
        "Playwright config is valid: npx playwright test --list succeeds"
      ],
      "priority": 10,
      "passes": false,
      "notes": "This is the skeleton. Keep it minimal — no business logic yet. Use npm workspaces or a simple concurrently setup. The e2e/ directory already contains pre-written Playwright tests — do NOT modify them."
    },
    {
      "id": "US-002",
      "title": "Set up SQLite database with connection and schema management",
      "description": "As a developer, I need a SQLite database that initializes automatically on startup so that subsequent stories can persist data.",
      "acceptanceCriteria": [
        "Server uses better-sqlite3 (synchronous) or sqlite3 package to create/open a local 'minipanel.db' file in the project root",
        "Database file is gitignored",
        "A schema initialization function runs on server startup and creates tables if they do not exist",
        "Events table created with columns: id (INTEGER PRIMARY KEY AUTOINCREMENT), event_name (TEXT NOT NULL), device_id (TEXT), user_id (TEXT), timestamp (TEXT NOT NULL), properties (TEXT, stores JSON string)",
        "Identity mappings table created with columns: id (INTEGER PRIMARY KEY AUTOINCREMENT), device_id (TEXT NOT NULL UNIQUE), user_id (TEXT NOT NULL), created_at (TEXT NOT NULL)",
        "Server starts successfully with the database initialized and logs a confirmation message",
        "Typecheck passes"
      ],
      "priority": 11,
      "passes": false,
      "notes": "Use better-sqlite3 for simplicity (synchronous API, no native build issues on most systems). Store properties as a JSON string. The UNIQUE constraint on device_id in the identity_mappings table enforces the one-device-to-one-user rule."
    },
    {
      "id": "US-003",
      "title": "Implement event ingestion API endpoint",
      "description": "As a developer instrumenting an app, I need to POST events to MiniPanel so they are stored and available for querying.",
      "acceptanceCriteria": [
        "POST /api/events accepts a JSON body with fields: event (string, required), device_id (string, optional), user_id (string, optional), timestamp (string, optional ISO 8601), properties (object, optional)",
        "Request body is validated with Zod: event name is required and non-empty, at least one of device_id or user_id must be present",
        "If timestamp is omitted, server sets it to current UTC time in ISO 8601 format",
        "Valid events are inserted into the events table and return 201 with the stored event object including its generated id",
        "Invalid events return 400 with a JSON error body containing a human-readable message describing what is missing or wrong",
        "If the event contains both device_id and user_id, an identity mapping is created or confirmed (INSERT OR IGNORE into identity_mappings)",
        "If the event contains both device_id and user_id, and that device_id is already mapped to a DIFFERENT user_id in identity_mappings, reject the event with HTTP 409 and body: { error: 'device_id is already mapped to a different user' }. Do NOT insert the event.",
        "Properties object is serialized to a JSON string before storage",
        "Typecheck passes",
        "Playwright single-event POST tests pass: npx playwright test api-events.spec.ts (the POST /api/events tests)"
      ],
      "priority": 12,
      "passes": false,
      "notes": "Identity mapping creation here is a side effect of event ingestion — it's the core of the simplified merge model. INSERT OR IGNORE handles the case where the mapping already exists. Check for identity conflict BEFORE inserting the event."
    },
    {
      "id": "US-004",
      "title": "Implement batch event ingestion endpoint",
      "description": "As a developer, I need to send multiple events in a single request so that high-volume ingestion is efficient.",
      "acceptanceCriteria": [
        "POST /api/events/batch accepts a JSON body with field: events (array of event objects, same schema as single event)",
        "Validated with Zod: array must have at least 1 event and at most 1000",
        "Each event in the array is validated individually with the same rules as POST /api/events",
        "All valid events in the batch are inserted in a single SQLite transaction for performance",
        "Identity mappings are created for any events with both device_id and user_id",
        "If an event in the batch would create a device_id mapping that conflicts with an existing mapping (device already mapped to a different user), that individual event is skipped and reported in the errors array — it does NOT abort the entire batch",
        "Returns 200 with a JSON body: { accepted: number, errors: Array<{ index: number, message: string }> }",
        "If any individual event fails validation or has an identity conflict, it is skipped (not inserted) and reported in the errors array, but the rest of the batch succeeds",
        "Typecheck passes",
        "All Playwright event API tests pass: npx playwright test api-events.spec.ts (single + batch tests)"
      ],
      "priority": 13,
      "passes": false,
      "notes": "This is essential for the sample data seeder (US-008) to run fast. Wrap the whole insert loop in a transaction."
    },
    {
      "id": "US-005",
      "title": "Implement identity resolution query logic",
      "description": "As a product analyst, I need all queries to use resolved identities so that anonymous and known events for the same person are unified.",
      "acceptanceCriteria": [
        "A resolveIdentity(deviceOrUserId: string) function exists that: given a user_id, returns that user_id; given a device_id, looks up the identity_mappings table and returns the mapped user_id if one exists, otherwise returns the device_id as-is",
        "A getEventsForUser(userId: string) function exists that returns all events attributed to a resolved user: events where user_id matches, PLUS events where device_id is mapped to that user_id via identity_mappings",
        "GET /api/events?user_id=<id> returns all resolved events for that user, sorted by timestamp ascending (oldest first — this is the user timeline view, distinct from the paginated list in US-007 which sorts descending/newest first)",
        "GET /api/events?device_id=<id> resolves the device to a user (if mapping exists) and returns all events for that resolved user, sorted by timestamp ascending",
        "Response includes an array of event objects with parsed properties (JSON object, not string)",
        "The merge is retroactive: events recorded before the identity mapping was created are included",
        "Typecheck passes",
        "All identity resolution tests pass: npx playwright test identity.spec.ts"
      ],
      "priority": 14,
      "passes": false,
      "notes": "This is the most critical story. The SQL query for getEventsForUser needs to join events with identity_mappings: SELECT * FROM events WHERE user_id = ? OR device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?). Test the retroactive merge carefully."
    },
    {
      "id": "US-006",
      "title": "Write automated tests for identity resolution",
      "description": "As a developer, I need automated tests that verify identity resolution correctness so that the most critical invariant of the system is protected against regressions.",
      "acceptanceCriteria": [
        "Test file exists at server/src/__tests__/identity-resolution.test.ts (or similar path using vitest or jest)",
        "Test runner is configured and 'npm test' in the server workspace runs the tests",
        "Test 1 - Retroactive merge: send 4 anonymous events for device-X, then send 1 event with both device-X and user-Y, query events for user-Y, assert all 5 events are returned",
        "Test 2 - Multi-device merge: send anonymous events for device-A and device-B, link device-A to user-Z, link device-B to user-Z, query events for user-Z, assert events from both devices appear",
        "Test 3 - Device collision rejection: link device-C to user-P, attempt to link device-C to user-Q, assert the second mapping is rejected (409 or error)",
        "Test 4 - Unidentified device: send anonymous events for device-D (no mapping), query by device-D, assert only device-D events are returned with device-D as the identity",
        "All tests pass",
        "Typecheck passes"
      ],
      "priority": 15,
      "passes": false,
      "notes": "These tests directly mirror the 'How to verify' section of BR-101. Use a fresh in-memory SQLite database per test to avoid test pollution. This satisfies the hard constraint: 'The codebase must include at least one automated test that verifies identity resolution.'"
    },
    {
      "id": "US-007",
      "title": "Implement event listing API with filters",
      "description": "As a product analyst, I need to query events by name, time range, and identity so I can explore what happened in my product.",
      "acceptanceCriteria": [
        "GET /api/events returns paginated events sorted by timestamp descending (newest first)",
        "Supports query parameters: event_name (filter by exact event name), user_id (resolved identity filter), device_id (resolved identity filter), start_date (ISO 8601, inclusive), end_date (ISO 8601, inclusive), limit (default 50, max 1000), offset (default 0)",
        "All filters are optional and combinable",
        "Response body: { events: Event[], total: number, limit: number, offset: number }",
        "Events in response have properties parsed from JSON string to object",
        "Identity resolution is applied: if filtering by user_id, events from all mapped devices are included",
        "Typecheck passes",
        "GET /api/events filter and pagination tests pass in api-queries.spec.ts (the GET /api/events/names and GET /api/stats/overview tests may still fail — those are addressed in US-011)"
      ],
      "priority": 16,
      "passes": false,
      "notes": "This is the read API that powers the frontend event explorer. Build the SQL query dynamically based on which filters are provided."
    },
    {
      "id": "US-008",
      "title": "Build sample data seeder script",
      "description": "As a new user trying MiniPanel, I need realistic demo data loaded so I can explore the product without instrumenting my own app first.",
      "acceptanceCriteria": [
        "A script at 'scripts/seed.ts' (or similar) can be run via 'npm run seed' from the project root",
        "Generates at least 5 distinct event types: Page Viewed, Button Clicked, Sign Up Completed, Purchase Completed, Subscription Renewed",
        "Generates at least 50 resolved users (users with a user_id) and additional anonymous-only device IDs",
        "Generates at least 10,000 events spread over the last 30 days",
        "Distribution is non-uniform: some users have 500+ events, most have 50-200, power-law or similar distribution",
        "Event types are non-uniform: Page Viewed is most common (~40%), Button Clicked (~25%), Sign Up Completed (~15%), Purchase Completed (~12%), Subscription Renewed (~8%)",
        "Includes identity resolution scenarios: at least 20 users start as anonymous (device-only) and later identify, at least 5 users have 2+ devices, at least 10 device IDs never get mapped to a user",
        "Events include string properties (url, referrer, button_name, plan_type) and numeric properties (amount, duration_seconds, quantity) appropriate to each event type",
        "Seeder calls the batch API endpoint (POST /api/events/batch) or directly inserts into the database",
        "Running the seeder twice does not duplicate data (clears existing data first or is idempotent)",
        "Typecheck passes",
        "After seeding, existing query tests still pass: npx playwright test api-queries.spec.ts"
      ],
      "priority": 17,
      "passes": false,
      "notes": "The seeder should be deterministic (use a fixed seed for the random number generator) so results are reproducible. Direct database insertion is fine and will be much faster than HTTP calls for 10k events."
    },
    {
      "id": "US-009",
      "title": "Build application shell with navigation layout",
      "description": "As a user opening MiniPanel, I need a clean application shell with sidebar navigation so I can move between the main areas of the product.",
      "acceptanceCriteria": [
        "App renders a responsive layout with a fixed sidebar on the left and a main content area on the right",
        "Sidebar contains navigation links with lucide-react icons for: Events (Activity icon), Funnels (Filter icon, links to placeholder), Users (Users icon, links to placeholder), Settings (Settings icon, links to placeholder)",
        "React Router is set up with routes for each navigation item",
        "Active navigation item is visually highlighted",
        "Placeholder pages display the page title in the main content area for routes not yet implemented",
        "Application title 'MiniPanel' appears at the top of the sidebar",
        "Layout uses Tailwind CSS and looks clean on screens 1024px and wider",
        "Typecheck passes",
        "Navigation tests pass: npx playwright test ui-navigation.spec.ts"
      ],
      "priority": 18,
      "passes": false,
      "notes": "Use shadcn/ui components where appropriate (e.g., Button for nav items, or a simple custom sidebar). Keep it minimal — this is the shell, not the feature pages. Funnels, Users, and Settings are placeholders for future tiers."
    },
    {
      "id": "US-010",
      "title": "Build event explorer page with table and filters",
      "description": "As a product analyst, I need a page where I can browse events, filter by name and time range, and see event details so I can verify data and explore user behavior.",
      "acceptanceCriteria": [
        "Events page is accessible from the sidebar navigation",
        "Displays a table of events with columns: Timestamp, Event Name, User (resolved identity), Properties (truncated preview)",
        "Table loads data from GET /api/events on mount",
        "Filter bar above the table with: event name dropdown (populated from distinct event names in the data), date range picker (start and end date inputs), a search/filter button",
        "Filters update the API query parameters and reload the table",
        "Clicking a row expands it or opens a detail panel showing all event properties formatted as key-value pairs",
        "Pagination controls at the bottom (Previous / Next) using offset-based pagination",
        "Loading state shown while fetching data",
        "Empty state shown when no events match the filters",
        "Uses shadcn/ui Table component and lucide-react icons",
        "Typecheck passes",
        "Events page UI tests pass: npx playwright test ui-events.spec.ts"
      ],
      "priority": 19,
      "passes": false,
      "notes": "This is the primary interface for the developer persona (verifying event flow) and the analyst persona (exploring data). Keep the UI functional, not flashy."
    },
    {
      "id": "US-011",
      "title": "Add distinct event names and basic stats API endpoints",
      "description": "As a frontend developer, I need API endpoints that return distinct event names and basic event counts so the UI filter dropdowns and summary stats can be populated.",
      "acceptanceCriteria": [
        "GET /api/events/names returns an array of distinct event names sorted alphabetically",
        "GET /api/stats/overview returns a JSON object with: total_events (number), total_users (number of distinct resolved user identities), event_counts_by_name (object mapping event name to count), date_range (object with earliest and latest event timestamps)",
        "Total users count uses resolved identities: anonymous devices mapped to a user are not counted separately",
        "Responses are fast (< 500ms) on the sample dataset of 10k events",
        "Typecheck passes",
        "Query API tests pass (names + stats): npx playwright test api-queries.spec.ts"
      ],
      "priority": 20,
      "passes": false,
      "notes": "These endpoints support the event explorer filters and could support a future dashboard. Keep the SQL simple — COUNT, DISTINCT, GROUP BY."
    },
    {
      "id": "US-012",
      "title": "Add user lookup page for individual user activity",
      "description": "As a support lead, I need to look up a specific user by their ID and see their complete event history so I can understand what happened during their session.",
      "acceptanceCriteria": [
        "Users page is accessible from the sidebar navigation",
        "Shows a search input where the user can enter a user_id or device_id",
        "On search, calls GET /api/events?user_id=<id> (or device_id) and displays the resolved user's complete event timeline",
        "Timeline displays events in chronological order (oldest first) with: timestamp, event name, all properties expanded",
        "Shows the resolved identity at the top: 'User: <resolved_id>' with a list of associated device IDs from identity_mappings",
        "GET /api/users/:id endpoint returns user profile data: resolved user_id, list of mapped device_ids, total event count, first_seen and last_seen timestamps",
        "Empty state when no user/device is found with that ID",
        "Uses shadcn/ui components (Input, Card, Table)",
        "Typecheck passes",
        "User lookup tests pass: npx playwright test ui-users.spec.ts and npx playwright test api-users.spec.ts"
      ],
      "priority": 21,
      "passes": false,
      "notes": "This serves the support lead persona. The user profile endpoint is new — it aggregates identity_mappings and events for a single resolved user."
    },
    {
      "id": "US-014",
      "title": "Final polish: README, error handling, and startup experience",
      "description": "As a new user, I need clear setup instructions and a smooth first-run experience so I can get MiniPanel working without guessing.",
      "acceptanceCriteria": [
        "README.md contains: project description (one paragraph), prerequisites (Node.js version), setup instructions (npm install, npm run seed, npm run dev), explanation of what each command does",
        "Running 'npm run dev' on a fresh clone (after npm install) starts without errors even if the database does not exist yet (auto-creates it)",
        "If the database is empty, the Events page shows a friendly empty state with a hint to run 'npm run seed'",
        "API endpoints return consistent error response format: { error: string, details?: string }",
        "Server logs incoming requests with method, path, and status code (simple middleware)",
        "No unhandled promise rejections or uncaught exceptions crash the server",
        "Typecheck passes",
        "ALL Playwright tests pass: npx playwright test"
      ],
      "priority": 22,
      "passes": false,
      "notes": "This is the cleanup story. Don't add new features — just make everything that exists work smoothly. The README is the 'single documented command' requirement from BR-103."
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "const p=JSON.parse(require('fs').readFileSync('prd-tier1.json','utf8')); console.log(p.userStories.length + ' stories'); console.log(p.userStories.map(s=>s.id+' (p'+s.priority+')').join(', '))"`

Expected: `18 stories` and IDs from US-T00 through US-T04, then US-001 through US-012, US-014.

- [ ] **Step 3: Commit**

```bash
git add prd-tier1.json
git commit -m "feat: merge test stories into PRD with priority ordering

Phase 1 (priority 1-5): US-T00–US-T04 test stories
Phase 2 (priority 10-22): US-001–US-014 implementation stories
US-013 removed (covered by Phase 1 tests)
Each impl story has test-mapping acceptance criterion"
```

---

### Task 1: Update PROMPT_build.md

**Goal:** Add the test-first instruction to the build prompt so the implementation agent knows e2e/ is read-only.

**Files:**
- Modify: `files/PROMPT_build.md`

**Acceptance Criteria:**
- [ ] Build prompt instructs agent to run test commands from acceptance criteria
- [ ] Build prompt instructs agent to NOT modify e2e/ files

**Verify:** `grep "e2e/" files/PROMPT_build.md` → matches found

**Steps:**

- [ ] **Step 1: Add test-first instruction to PROMPT_build.md**

Add the following block between the existing step 0 instructions and step 1:

```markdown
0d. IMPORTANT — Test-first constraint: The `e2e/` directory contains pre-written Playwright tests that define the expected behavior of the application. These tests are the specification. After completing each user story, run the test command specified in that story's acceptance criteria. If tests fail, fix your implementation — do NOT modify any files in `e2e/`. Do NOT delete, rename, or overwrite test files.
```

- [ ] **Step 2: Commit**

```bash
git add files/PROMPT_build.md
git commit -m "feat: add test-first constraint to build prompt"
```
