# Craft

How to build MiniPanel interfaces with craft and consistency. The design tokens and component patterns are the WHAT. This document is the HOW — the thinking that prevents generic output.

---

## Subtle Layering

This is the backbone of craft. You should barely notice the system working. When the layering is right, users just understand the structure without thinking about it. The craft is invisible — that's how you know it's working.

### MiniPanel's Surface Elevation

MiniPanel uses a simple, quiet elevation stack:

```
Level 0: Page canvas         bg-neutral-100  (#F5F5F5)
Level 1: Cards, panels       bg-neutral-50   (#FAFAFA)
Level 2: Dropdowns, popovers (slightly lighter or use shadow)
Sidebar: Inverted            bg-neutral-900  (#171717)
Chart containers:            bg-[#FEF9F3]    (warm off-white)
```

Each jump is subtle — a few percentage points of lightness. You can barely see the difference in isolation. But when surfaces stack, the hierarchy emerges. Whisper-quiet shifts that you feel rather than see.

### Border Decisions

Borders at `border-neutral-300` define edges without demanding attention. They should disappear when you're not looking for them, but be findable when you need structure.

**The squint test:** Blur your eyes at the interface. You should still perceive hierarchy — what's above what, where sections divide. But nothing should jump out. No harsh lines. No jarring color shifts. Just quiet structure.

**Common mistakes to avoid:**
- Borders that are too visible (use `border-neutral-300`, not darker)
- Surface jumps that are too dramatic (never skip elevation levels)
- Using different hues for different surfaces (keep neutral gray throughout; the only hue exception is chart containers)
- Harsh dividers where subtle borders would do

### Sidebar Decision

MiniPanel intentionally uses a dark sidebar (`bg-neutral-900`) against a light canvas. This is a deliberate contrast choice for navigation clarity — the sidebar is a separate anchoring element, not part of the content flow. The border between sidebar and content is implicit via the color contrast.

### Dropdown Decision

Dropdowns float above the card they emerged from. Use shadcn's `SelectContent` with `bg-neutral-50 border-neutral-300`. The slight border definition is enough — shadcn adds subtle shadow by default.

---

## Interaction States

Every interactive element needs states. Missing states make an interface feel like a screenshot, not software.

### Required States

| Element | Default | Hover | Active/Pressed | Focus | Disabled |
|---------|---------|-------|----------------|-------|----------|
| Primary button | `bg-neutral-900 text-neutral-100` | `hover:bg-neutral-800` | slightly lighter | focus ring | `opacity-50 cursor-not-allowed` |
| Outline button | `border-neutral-900 text-neutral-900` | `hover:bg-neutral-200` | `bg-neutral-300` | focus ring | `opacity-50 cursor-not-allowed` |
| Table row | transparent | `hover:bg-neutral-200` | — | — | — |
| Sidebar item | `text-neutral-300` | `hover:bg-neutral-800` | — | — | — |
| Sidebar active | `bg-neutral-700 text-neutral-50` | — | — | — | — |
| Select trigger | `border-neutral-300` | slight darken | — | focus ring | `opacity-50` |
| Input | `border-neutral-300` | — | — | focus ring | `opacity-50` |

### Data States

Every data-driven component needs three states beyond "loaded with data":

1. **Loading** — Skeleton placeholders at `bg-neutral-200`. Match the shape of real content (table row skeletons for tables, chart-height skeleton for charts).
2. **Empty** — Centered message with icon, not a blank space. See component patterns.
3. **Error** — `bg-neutral-200 border border-neutral-900` container with friendly message. Never raw errors.

---

## Typography as Hierarchy

MiniPanel uses only two sizes (`text-2xl` and `text-sm`). All hierarchy comes from weight:

- `font-black` — page titles, metric values. The heaviest. Commands attention.
- `font-bold` — body text, button labels, captions. The workhorse. Read naturally.
- `font-medium` — table cells. Slightly lighter. Recedes behind bold content.

This constraint is intentional. When size is fixed, weight does more work. A `text-sm font-black` label next to `text-sm font-medium` data creates clear hierarchy at the same size. Don't break the two-size rule by introducing `text-xs`, `text-base`, or `text-lg`.

---

## Composition and Rhythm

Dense control bars give way to open chart areas. Metric cards breathe with `p-6`. The page itself has generous `p-8` padding. This rhythm — tight controls, spacious content — is a conscious pattern.

**Focal point:** Every screen has one thing the user came to do. On Trends, it's the chart. On Events, it's the table. On Users, it's the timeline. That element dominates through size and visual weight. Controls serve it; they don't compete.

**Proportions declare what matters:** The sidebar at `w-60` is narrow enough to serve the content area. Control cards are compact (`p-4`). Content cards are generous (`p-6`). These proportions are intentional — don't change them without a reason.

---

## The Critique Protocol

After building any component or page, run these checks before considering it done:

### The Swap Test
If you swapped your implementation for a generic dashboard template, would it feel meaningfully different? The places where swapping wouldn't matter are the places you defaulted. MiniPanel should feel like MiniPanel: monospace type, monochrome palette, orange charts on warm backgrounds.

### The Squint Test
Blur your eyes at the output. Can you still perceive hierarchy? Is anything jumping out harshly? Craft whispers. If borders, shadows, or color blocks are screaming, they're too strong.

### The Token Test
Scan the code for raw hex values or Tailwind classes outside the design system. Every color should trace back to the token table. Random `text-gray-400` or `bg-white` values signal drift from the system.

### The State Test
Interact with everything. Hover every button, row, and link. Tab through for focus rings. Check loading, empty, and error for every data component. Missing states = broken feel.

### The Density Test
Is the control bar dense and functional? Is the content area spacious and readable? If everything is the same density, the rhythm is flat. Vary density by purpose — tools are tight, content breathes.

---

## Avoid

These anti-patterns break MiniPanel's visual language:

- **Raw hex values** — use the token table, not arbitrary grays
- **`#000000` or `#FFFFFF`** — always off-black and off-white
- **Color outside charts** — no blue links, no green success badges, no red error text. Stay monochrome. Orange is only for chart data.
- **Ghost buttons** — only default (filled) and outline variants exist
- **`text-base`, `text-xs`, `text-lg`** — only `text-2xl` and `text-sm`
- **Serif or sans-serif fonts** — everything is monospace
- **Dramatic shadows** — MiniPanel uses borders for structure, not box-shadow
- **Inconsistent spacing** — stick to `p-4`, `p-6`, `p-8`, `gap-3`, `gap-6`
- **Missing hover states** — every clickable element responds
- **Decorative elements** — no gradients, no icons-as-decoration, no ornamental borders
- **Native form controls** — always use shadcn components (`Select`, `Input`, etc.)

---

## Validation Checks

Before shipping, verify against the design system:

1. **Spacing** — All values from the Tailwind spacing scale (`p-4`, `p-6`, `p-8`, `gap-3`, `gap-6`)?
2. **Colors** — Every color from the token table? No stray hex values?
3. **Typography** — Only `text-2xl` and `text-sm`? Correct weight for each role?
4. **Components** — Using shadcn components, not custom HTML elements?
5. **States** — Loading, empty, error, hover, focus all implemented?
6. **Chart colors** — `#FF7F11` series only? `#FEF9F3` background? No other hues?
7. **Patterns** — Reusing documented component patterns from `component-patterns.md`?
