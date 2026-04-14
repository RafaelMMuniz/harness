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
    <a className="flex items-center h-10 px-4 rounded-lg text-sm font-bold text-neutral-300
                   hover:bg-neutral-800
                   [&.active]:bg-neutral-700 [&.active]:text-neutral-50">
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

Dense control bar with all query parameters, chart panel with warm background, optional summary metric cards.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Trends                                          │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events   │  │ [Event ▾] [Measure ▾] [Property ▾]          │ │
│ Trends ← │  │ [Break down by ▾]                            │ │
│ Funnels  │  │ [7d] [30d] [90d] [Custom]  [Day|Week]       │ │
│ Users    │  │                      [Line|Bar|Area]         │ │
│          │  └──────────────────────────────────────────────┘ │
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

**Structure**:
1. Controls card — Selects for event, measure, property, breakdown. Button toggle groups for date presets, granularity, chart type.
2. Chart card — `bg-[#FEF9F3]` container with Recharts `ResponsiveContainer`.
3. Metric cards row — `grid grid-cols-3 gap-6` of summary metric Cards.

---

## 3. Funnel Analysis (BR-303)

Vertical step builder on the left, funnel visualization on the right with conversion annotations.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Funnel Analysis                                 │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events   │  │ [30d] [90d] [Custom]          [Analyze]      │ │
│ Trends   │  └──────────────────────────────────────────────┘ │
│ Funnels← │                                                  │
│ Users    │  ┌──────────────┬───────────────────────────────┐ │
│          │  │ Steps        │  Results                      │ │
│          │  │              │                               │ │
│          │  │ 1 [Event ▾]  │  ████████████████████  2,410  │ │
│          │  │              │         100%                  │ │
│          │  │ 2 [Event ▾]  │            ↓ 35% drop-off    │ │
│          │  │              │  █████████████         1,567  │ │
│          │  │ 3 [Event ▾]  │          65%                  │ │
│          │  │              │            ↓ 52% drop-off     │ │
│          │  │ [+ Add step] │  ██████                  749  │ │
│          │  │              │          31%                  │ │
│          │  │              │                               │ │
│          │  │              │  Overall: 31% converted       │ │
│          │  └──────────────┴───────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

**Structure**:
1. Controls card — Date preset toggle + Analyze button.
2. Split card — Left column: numbered step Selects with "+ Add step" button. Right column: horizontal bars in `#FF7F11` with conversion percentages and drop-off annotations between steps. Overall conversion at the bottom.

---

## 4. User Profile (BR-304)

Search bar at top, identity cluster card, then chronological event timeline.

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Users                                           │
│ MiniPanel│                                                  │
│          │  ┌──────────────────────────────────────────────┐ │
│ Events   │  │ [Search user or device ID...        ] [Go]   │ │
│ Trends   │  └──────────────────────────────────────────────┘ │
│ Funnels  │                                                  │
│ Users  ← │  ┌──────────────────────────────────────────────┐ │
│          │  │ Identity Cluster                              │ │
│          │  │                                               │ │
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
1. Search card — Input + "Go" Button.
2. Identity cluster card — Key-value pairs: user identity, device identities (as Badges), first/last seen, event count.
3. Timeline card — Chronological list of events with timestamps, event names, device source, and expandable properties. "Load more" button at bottom. Mark merged anonymous events with a visual indicator.
