# Page Layouts

Reference layouts for every MiniPanel page. Use these as the structural starting point when building or modifying pages.

## Sidebar

Fixed left navigation, always visible.

```tsx
<aside className="fixed left-0 top-0 h-screen w-60 bg-neutral-900 text-neutral-300 flex flex-col">
  <div className="h-16 flex items-center justify-center text-neutral-50 text-2xl font-black">
    MiniPanel
  </div>
  <nav className="flex-1 px-2 space-y-1" role="navigation">
    <a
      className="flex items-center h-10 px-4 rounded-lg text-sm font-bold text-neutral-300
                   hover:bg-neutral-800
                   [&.active]:bg-neutral-700 [&.active]:text-neutral-50"
    >
      Events
    </a>
    {/* Repeat for: Trends, Funnels, Users */}
  </nav>
</aside>
```

## Content Area Shell

All pages share this outer wrapper:

```tsx
<main className="ml-60 min-h-screen bg-neutral-100 p-8">
  <h1 className="text-2xl font-black text-neutral-900 mb-6">Page Title</h1>

  {/* Controls card */}
  <Card className="mb-6 bg-neutral-50 border-neutral-300">
    <CardContent className="flex items-center gap-3 p-4">
      {/* filters, selectors */}
    </CardContent>
  </Card>

  {/* Main content card */}
  <Card className="p-6 bg-neutral-50 border-neutral-300">
    {/* chart, table, etc */}
  </Card>
</main>
```

---

## 1. Events Explorer (BR-200)

Filter bar with dropdowns, then a full-width data table with expandable rows and pagination.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Events                                          │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events ← │  │ [Event name ▾]  [Start date] [End date]     │ │
│ Trends   │  └──────────────────────────────────────────────┘ │
│ Funnels  │                                                  │
│ Users    │  ┌──────────────────────────────────────────────┐ │
│          │  │ Timestamp    Event        User     Props     │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │ 14:02:31     Page Viewed  user-42  {url:..}  │ │
│          │  │ ┌────────────────────────────────────────┐   │ │
│          │  │ │ url: /pricing                          │   │ │
│          │  │ │ referrer: /home                        │   │ │
│          │  │ └────────────────────────────────────────┘   │ │
│          │  │ 14:01:58     Button Click user-42  {btn:..}  │ │
│          │  │ 13:59:12     Sign Up      dev-a03  —         │ │
│          │  │ ...                                          │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │              [← Prev]  Page 1 of 12  [Next →]│ │
│          │  └──────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

**Structure**: Controls card with event name Select and date pickers, then a Card containing the Table with expandable property rows and bottom pagination.

---

## 2. Trends / Insights (BR-201, BR-300, BR-301, BR-302)

Cascading control bar, chart panel with warm background, optional summary metric cards.

Controls cascade top-to-bottom: selecting an event determines which properties appear in downstream selectors. Measure determines whether a property picker is needed. This prevents dead views from nonsensical filter combinations.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Trends                                          │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events   │  │ [Event ▾]  [Measure ▾]  [of property ▾]*    │ │
│ Trends ← │  │ [Break down by ▾]*                           │ │
│ Funnels  │  │ [7d] [30d] [90d] [Custom]  [Day|Week]       │ │
│ Users    │  │                      [Line|Bar|Area]         │ │
│          │  └──────────────────────────────────────────────┘ │
│          │     * only shown when relevant (see below)       │
│          │                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │ bg: #FEF9F3                                  │ │
│          │  │  chart area with #FF7F11 lines/bars          │ │
│          │  │  ── Total Events  ── Unique Users            │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                  │
│          │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│          │  │     4,218  │ │       892  │ │      21.2% │   │
│          │  │ Total      │ │ Users      │ │ Avg/user   │   │
│          │  └────────────┘ └────────────┘ └────────────┘   │
└──────────┴──────────────────────────────────────────────────┘
```

**Control cascade logic**:

- **Event** — always visible. Populated from `GET /api/events/names`. Selecting an event scopes all downstream selectors to properties seen on that event.
- **Measure** — always visible. Options: `total count`, `unique users`, `sum`, `avg`, `min`, `max`. Defaults to `total count`.
- **of property** — only appears when measure is `sum`, `avg`, `min`, or `max` (i.e. needs a numeric property). Options are populated with numeric properties of the selected event.
- **Break down by** — optional. Only populated with properties of the selected event. Hidden or disabled until an event is chosen.
- **Date / Granularity / Chart type** — always visible, independent of event selection.

**Structure**:

1. Controls card — Cascading Selects (event → measure → property → breakdown). Button toggle groups for date presets, granularity, chart type.
2. Chart card — `bg-[#FEF9F3]` container with Recharts `ResponsiveContainer`.
3. Metric cards row — `grid grid-cols-3 gap-6` of summary metric Cards.

---

## 3. Funnel Analysis (BR-303)

Step builder on the left with controls, horizontal funnel visualization below.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Funnel Analysis                                 │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events   │  │ Steps                                        │ │
│ Trends   │  │                                              │ │
│ Funnels← │  │ 1 [Event ▾]  2 [Event ▾]  3 [Event ▾]      │ │
│ Users    │  │                            [+ Add step]      │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │ [30d] [90d] [Custom]             [Analyze]   │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │ Results                                      │ │
│          │  │                                              │ │
│          │  │  Step 1        Step 2        Step 3          │ │
│          │  │  Page Viewed   Sign Up       Purchase        │ │
│          │  │  ██████████    ███████       ████            │ │
│          │  │  2,410         1,567         749             │ │
│          │  │  100%     →    65%      →    31%             │ │
│          │  │        35% drop    52% drop                  │ │
│          │  │                                              │ │
│          │  │  Overall: 31% converted                      │ │
│          │  └──────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

**Structure**:

1. Steps card — Top row: numbered step Selects laid out horizontally with "+ Add step" button at the end. Below a divider: date preset toggles and Analyze button.
2. Results card — Horizontal funnel: vertical bars side by side (tallest on the left, shrinking right), each labeled with event name, count, and conversion %. Drop-off annotations between bars. Overall conversion at the bottom.

---

## 4. Users (BR-304)

Two-level view: a searchable users table, then a user profile detail after clicking a row.

### 4a. Users List (default)

Search/filter bar at top, then a full-width table of all known users with pagination.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Users                                           │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events   │  │ [Search user or device ID...           ]     │ │
│ Trends   │  │  ┌────────────────────────────────────────┐  │ │
│ Funnels  │  │  │ charlie@example.com          user      │  │ │
│ Users  ← │  │  │ dev-c8a3f1                   device    │  │ │
│          │  │  │ charlie_mobile               device    │  │ │
│          │  │  └────────────────────────────────────────┘  │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │ User ID          Devices  Events  Last seen  │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │ charlie@ex…      2        847     Apr 13     │ │
│          │  │ alice@ex…        1        312     Apr 12     │ │
│          │  │ dev-f9a021       —          45    Apr 11     │ │
│          │  │ bob@ex…          3        1,204   Apr 10     │ │
│          │  │ ...                                          │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │              [← Prev]  Page 1 of 5  [Next →] │ │
│          │  └──────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

**Structure**:

1. Search card — Autocomplete input. Typing 2+ characters queries `GET /api/users/search?q=<term>` and shows a dropdown of matching user_ids and device_ids (labeled "user" or "device"). Selecting a result navigates directly to that user's profile. Pressing Enter or leaving the input filters the table below.
2. Users table card — Columns: User ID, Devices (count of linked devices), Events (total count), Last seen. Rows are clickable. Unresolved devices (no user mapping) appear with their device_id directly. Pagination at the bottom.

### 4b. User Profile (after clicking a row)

Identity cluster card, then chronological event timeline. Back link returns to the users table.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  [← Back to Users]                               │
│ MiniPanel│  Users › charlie@example.com                     │
│          │                                                  │
│ Events   │                                                  │
│ Trends   │  ┌──────────────────────────────────────────────┐ │
│ Funnels  │  │ Identity Cluster                              │ │
│ Users  ← │  │                                               │ │
│          │  │ User      charlie@example.com                 │ │
│          │  │ Devices   dev-a8f03c  dev-b2e917              │ │
│          │  │ First     2025-03-15 09:12                    │ │
│          │  │ Last      2025-04-13 17:44                    │ │
│          │  │ Events    847                                 │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │ Event Timeline (oldest → newest)              │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │ Mar 15 09:12  Page Viewed    via dev-a8f03c  │ │
│          │  │               url: /home  referrer: google   │ │
│          │  │               ┊ merged ┊                     │ │
│          │  │ Mar 15 09:14  Button Click   via dev-a8f03c  │ │
│          │  │               button_name: signup_cta        │ │
│          │  │ ...                                          │ │
│          │  │──────────────────────────────────────────────│ │
│          │  │              [Load more ↓]                    │ │
│          │  └──────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

**Structure**:

1. Breadcrumb header — "Users › {user_id}" with a "Back to Users" link.
2. Identity cluster card — Key-value pairs: user identity, device identities (as Badges), first/last seen, event count.
3. Timeline card — Chronological list of events with timestamps, event names, device source, and expandable properties. "Load more" button at bottom. Mark merged anonymous events with a visual indicator.
