# MiniPanel

Self-hosted analytics platform for product teams. It helps them understand user behavior by collecting events from their applications and providing tools to explore, visualize, and analyze that data. "Mixpanel, but you can run it on your laptop."

## Keyword Conventions

The keywords "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119):

- **MUST** / **MUST NOT** — absolute requirement or prohibition. Non-negotiable.
- **SHOULD** / **SHOULD NOT** — strong recommendation. May be ignored only if the full implications are understood and there is a compelling reason.
- **MAY** — truly optional. Implementable at the developer's discretion.

---

## Hard Constraints

- MUST run locally on a single machine.
- MUST start with a single documented command.
- MUST NOT require external API keys, paid services, or third-party accounts.
- MUST NOT require user authentication.
- MUST include at least one automated test that verifies identity resolution.

---

## Core Domain

### Events

An event represents something that happened in the user's product. Every event has:

- **name** (what happened)
- **timestamp** (when it happened)
- **identity** (who did it)
- **properties** (optional) — arbitrary key-value pairs. Values can be strings, numbers, or booleans.

Examples: a page was viewed, a button was clicked, a purchase was completed, a subscription was renewed. Properties vary by event type — a "Purchase Completed" event might carry `amount` and `currency`; a "Page Viewed" event might carry `url` and `referrer`.

### Identity Resolution

This is the most important architectural decision in the system. If identity resolution is wrong, every number is wrong.

Model (simplified Mixpanel-style merge):

- Each event carries a **device identity**, a **user identity**, or **both**.
- When an event carries both, the system creates a **permanent mapping**: that device belongs to that user.
- Once a mapping exists, all **past and future** events from that device are attributed to the known user. The merge is **retroactive**.
- Multiple devices can map to the same user (same person on phone and laptop).
- A device can only belong to **one** user.
- The **resolved identity** (canonical ID) is used everywhere: charts, funnels, user counts, profiles, event explorer.

---

## Users

### Product analyst

**Core job:** "When I ship a feature or run an experiment, I need to understand how users interact with it so I can decide what to do next."

Opens MiniPanel daily. Asks questions like: how many users clicked the new button this week? Is signups trending up or down? What's the conversion rate from landing page to purchase? Thinks in terms of events, time ranges, and trends. Wants answers in seconds, not hours.

### Growth manager

**Core job:** "When I'm optimizing a user flow, I need to see exactly where users drop off so I can fix the weakest step."

Builds funnels. Defines a sequence of steps (visited pricing page -> clicked signup -> completed onboarding) and wants to see what percentage of users make it through each step. Cares about conversion rates and where the biggest drops happen.

### Developer

**Core job:** "When I instrument my app with tracking, I need to verify that events are flowing correctly and the data looks right."

Sends events to MiniPanel and checks that they arrived, that the properties are correct, and that identity resolution is working. Needs a raw event feed, not charts. Thinks in terms of payloads and timestamps.

### Support lead

**Core job:** "When a user contacts us with a problem, I need to see their complete activity history so I can understand what happened."

Looks up individual users. Wants to see every event a specific user triggered, in chronological order, with all the context. Needs to understand the full journey, including the anonymous part before the user logged in.

---

## Requirements by Tier

### Tier 1 — Foundation

No user sees this directly, but nothing works without it.

#### BR-100: Event Collection

- MUST provide a network API that accepts events.
- Each event MUST include the event name.
- Each event MUST include at least one identity (device or user).
- MUST persist events so they survive a restart.
- MUST reject events missing required fields and return a clear error.
- Events MAY include a timestamp. If omitted, use current server time.
- Events MAY include arbitrary key-value properties.

#### BR-101: Identity Resolution

- MUST maintain a mapping of device identities to user identities.
- When an event contains both identities, MUST create or confirm the mapping.
- Merge MUST be retroactive: past anonymous events are attributed to the known user.
- All read operations MUST use the resolved identity.
- A device identity MUST NOT map to more than one user identity.
- Multiple device identities MAY map to the same user identity.

**Verification:**

1. Send anonymous event for device X. Send 3 more for device X. Send identified event linking device X to user Y. Query events for user Y. All 5 events MUST appear.
2. Send anonymous events for device A and device B. Link both to user Z. Query for user Z. Events from both devices MUST appear.

#### BR-102: Sample Data

- MUST include a way to populate with sample data.
- At least 5 distinct event types.
- At least 50 resolved users and at least 10,000 events spread over 30 days.
- Distribution MUST NOT be uniform (some users more active, some events more common).
- MUST include identity resolution scenarios: anonymous-then-identified users, multi-device users, never-identified users.
- Events MUST include string properties (page names, button labels, plan types) and numeric properties (amounts, durations, quantities).

#### BR-103: Application Shell

- MUST be a web application with navigation between main areas.
- MUST start with a single documented command.
- MUST NOT require external services, API keys, or cloud infrastructure.

**Verification:** Clone repo. Follow README. Run start command. Application works.

### Tier 2 — MVP

First moment a user gets value.

#### BR-200: Event Exploration

- MUST show events in reverse chronological order.
- Each event displays: timestamp, name, resolved identity, properties.
- MUST filter events by event name.
- MUST handle large volumes without loading everything at once (pagination/virtual scroll).

**Verification:** Developer sends event via API, finds it in explorer by filtering on event name.

#### BR-201: Trend Analysis

- MUST select an event type and see volume over time.
- MUST support at least two measures: **total event count** and **unique user count** (using resolved identities).
- MUST display as a time series chart.
- MUST adjust time granularity (at minimum: daily and weekly).
- MUST select a date range with presets (last 7 days, 30 days, 90 days) and custom input.
- Default: last 30 days, daily granularity.

**Verification:**

1. Analyst sees "Purchase Completed" events increased after a specific date via trend chart.
2. Unique users count is lower than total event count when users repeated the event (confirms identity resolution in aggregations).

### Tier 3 — MMP (Minimum Marketable Product)

Real analysis capability. The product is competitive.

#### BR-300: Numeric Aggregations

- When events carry numeric properties, MUST aggregate by: **sum**, **average**, **minimum**, **maximum**.
- SHOULD auto-detect which properties are numeric.
- MUST NOT offer numeric aggregations for non-numeric properties.

**Verification:** Analyst selects "Purchase Completed", measures "sum of amount". Chart shows correct daily revenue totals.

#### BR-301: Comparative Visualization

- SHOULD switch between chart types for the same data.
- SHOULD support at minimum: **line chart**, **bar chart**, and one additional type (area, pie, or data table).
- SHOULD choose sensible defaults (line for time series, pie only for proportions).

#### BR-302: Dimensional Breakdown

- MUST break down any analysis by a property value (e.g., "Button Clicked" by `button_name`).
- Breakdowns MUST work with all measures (counts, unique users, numeric aggregations).
- SHOULD limit to top values and group the rest.

**Verification:** Analyst breaks down "Page Viewed" by page. Chart shows separate series for top pages.

#### BR-303: Funnel Analysis

- MUST define a sequence of 2 to 5 events.
- MUST compute conversion rate between each consecutive pair and overall.
- MUST display visually where users drop off.
- MUST use resolved identities (anonymous step 1 + identified step 2 = one user progressing).
- Step order MUST be respected by timestamp within the selected date range.

**Verification:** Growth manager builds funnel: "Page Viewed" -> "Signup Completed" -> "Purchase Completed". A user who viewed page anonymously and signed up with known identity appears as one user, not a dropout.

#### BR-304: User Profiles

- MUST look up an individual by their identity.
- Profile MUST show all events attributed to this person, including merged anonymous events.
- MUST display the identity cluster (all device identities + user identity linked together).
- SHOULD show first seen and last seen timestamps.

**Verification:** Support lead searches "charlie@example.com" and sees events from both phone (device A) and laptop (device B) in a single timeline.

#### BR-305: Visual Coherence

- SHOULD present consistent visual language: color palette, typography hierarchy, readable chart labels.
- SHOULD handle edge cases: empty states, loading indicators, error messages.
- SHOULD NOT show blank pages, raw error dumps, or broken layouts when data is missing.

### Tier 4 — Nice to Have

#### BR-400: Saved Analyses

- MAY save an Insights query or funnel with a name and reload it later.

#### BR-401: Input Assistance

- Event and property selectors MAY support search and autocomplete.

#### BR-402: Multi-event Comparison

- MAY place multiple event types on the same chart for direct comparison.
