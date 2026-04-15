# MiniPanel — Orchestration Mission

## Scope

- **34 stories active** (passes:false, priority >= 1): US-001 through US-036
- **0 stories already passing**
- **9 negative-priority stories skipped** (US-T00 through US-T08 — test scaffolding, written separately)

## Phases

### Phase 1 — Backbone (DB + Ingestion + Identity)
US-001 → US-002 → US-003 → US-004 → US-005 → US-006 → US-007 → US-008

Project scaffold, SQLite setup, event ingestion (single + batch), identity resolution, event listing API, and sample data seeder. Everything downstream depends on this chain. US-005 (identity resolution) is the most critical story — it underpins every query in the system.

### Phase 2 — Explorer Surface (App Shell + Event Explorer + User Lookup)
US-009, US-010, US-011, US-012, US-014

Application shell with navigation, event explorer page, stats/names endpoints, user lookup page. US-014 is the final polish pass and should run last.

### Phase 3 — Trends (API + Page + Chart)
US-015, US-016, US-017, US-018, US-019, US-020

Trend aggregation API, date preset utility, trends page layout, Recharts chart rendering, BR-200 gap-check, trend tests. US-015 (trend API) must land before US-017 (page) and US-018 (chart).

### Phase 4 — Analytics Extensions (Property Metadata + Numeric Measures + Breakdown)
US-022, US-023, US-024, US-025, US-026, US-027, US-028

Property metadata API, numeric aggregation measures, dimensional breakdown, funnel API, measure/breakdown selectors on trends page, chart type switcher. US-022 and US-023 unblock the UI stories.

### Phase 5 — Funnels + Enhanced Profiles
US-029, US-030, US-031

Funnel page with step builder, funnel visualization, enhanced user profile with identity cluster. US-029 needs US-025 (funnel API).

### Phase 6 — Polish + Nice-to-haves
US-032, US-033, US-034, US-035, US-036

Visual coherence pass, saved analyses, autocomplete selectors, multi-event comparison, aggregation/funnel tests. These are the final stories and depend on nearly everything above.

## Risk Areas

1. **Identity resolution (BR-101):** Every query that counts users or filters by user_id MUST go through the identity resolution layer. Direct `WHERE user_id = ?` without joining identity_mappings is a bug. Affects: US-005, US-007, US-011, US-015, US-025.

2. **Seed data (BR-102):** The seeder must produce realistic distributions (power-law users, non-uniform event types, identity resolution scenarios). Affects: US-008.

3. **Chart correctness (BR-200 series):** Trend charts must zero-fill gaps, correctly resolve unique users via identity, and handle breakdown series with top-5 + __other__. Affects: US-015, US-018, US-024, US-027.

4. **Funnel temporal ordering:** Funnel analysis must enforce that step N happens AFTER step N-1 by timestamp. A user doing steps out of order must NOT count as converting. Affects: US-025.

## Global Conventions

- **Workspaces:** `server/` (backend, port 3001) + `client/` (frontend, port 5173). Never `backend/` or `frontend/`.
- **DB:** SQLite at project-root `minipanel.db`. Schema in `server/src/db.ts`.
- **Tests:** `server/src/__tests__/<story_id>.test.ts` or `e2e/<story_id>.spec.ts`.
- **UI:** shadcn/ui components, lucide-react icons, Tailwind CSS.
- **Charting:** Recharts (installed in US-018).

## Ordering Notes

- US-014 (priority 14, polish) depends on most Tier 1+2 features. Its priority correctly places it after those stories.
- US-019 (priority 19, BR-200 gap-check) depends on US-010 (priority 10). Ordering is fine.
- US-032 (priority 32, visual coherence) depends on all pages existing. Correctly placed near the end.

## Skipped (already passing)

None — all stories are active.
