---
name: minipanel-design
description: >
  MiniPanel's design system and UI implementation guide. Use this skill when the user asks to
  "build a component", "create a page", "add a chart", "style the UI", "fix the layout",
  "implement the frontend", "add a view", or any task involving visual elements, Tailwind classes,
  shadcn/ui components, or page layouts in MiniPanel. Also trigger on mentions of "design system",
  "color palette", "typography", "chart colors", "sidebar", or "interface design".
version: 0.2.0
---

# MiniPanel Design System

MiniPanel uses **Tailwind CSS** for styling and **shadcn/ui** for components. All styling is via Tailwind utility classes — no custom CSS files per component.

## Guiding Principles

1. **Monospace everywhere.** Both `font-sans` and `font-mono` resolve to the same system monospace stack. Never use serif or sans-serif.
2. **Strictly monochrome.** The UI is grayscale only. Never use `#000000` or `#FFFFFF`. All values sit between off-black `#171717` and surface `#FAFAFA`.
3. **Orange is for charts only.** `#FF7F11` appears in lines, bars, and area fills — never in text, buttons, or UI chrome.
4. **Two button variants.** Default (filled off-black) and outline (off-black border). No ghost buttons.
5. **Three text sizes.** `text-2xl` for titles/metrics, `text-sm` for everything else. Weight carries hierarchy — `font-black` for emphasis, `font-bold` for body, `font-medium` for table cells.
6. **Right-align numbers.** Always use `text-right tabular-nums` for numeric table cells.

## Craft Principles

These principles prevent generic output. The design tokens and component patterns below are the WHAT. These principles are the HOW.

**Every choice must be a choice.** For every decision — color, spacing, layout, component — be able to explain WHY. If the answer is "it's common" or "it looks clean," you haven't chosen. You've defaulted. MiniPanel's design brief already made these choices. Follow them precisely rather than reaching for familiar patterns.

**Subtle layering is the backbone.** Surfaces stack: page (`bg-neutral-100`) → card (`bg-neutral-50`) → dropdown (slightly above). The shifts are whisper-quiet — you feel the hierarchy without seeing it. Never make dramatic surface jumps. Never use different hues for different elevation levels. Borders at `border-neutral-300` define edges without demanding attention.

**Every interactive element needs life.** Buttons, links, table rows — everything clickable responds to hover and press. Not dramatically: `hover:bg-neutral-200` for table rows, `hover:bg-neutral-800` for primary buttons. Missing states make an interface feel like a screenshot, not software.

**Composition has rhythm.** Dense control bars give way to open chart areas. The sidebar at `w-60` serves the content area — proportions declare what matters. Every screen has one thing the user came to do. That thing dominates through size, position, or the space around it.

**After building, critique before showing.** Squint at the output. Can you still perceive hierarchy? Is anything jumping out harshly? If you swapped your implementation for a generic dashboard template, would it feel meaningfully different? The places where swapping wouldn't matter are the places you defaulted.

For the full craft reference (layering examples, critique protocol, validation checks): Read `references/craft.md`

## Quick Reference

Before writing any component, read the detailed references:

- **Design tokens** (colors, type, spacing, surface elevation): Read `references/design-tokens.md`
- **Component patterns** (buttons, cards, tables, selects, badges, states): Read `references/component-patterns.md`
- **Page layouts** (events, trends, funnels, users, sidebar, content area): Read `references/layouts.md`
- **Craft** (layering, critique protocol, validation, anti-patterns): Read `references/craft.md`

## Core Color Tokens

| Role | Hex | Tailwind |
|------|-----|----------|
| Primary text | `#171717` | `text-neutral-900` |
| Secondary text | `#525252` | `text-neutral-600` |
| Muted text | `#6B6B6B` | `text-neutral-500` |
| Borders | `#D4D4D4` | `border-neutral-300` |
| Hover / subtle bg | `#E5E5E5` | `bg-neutral-200` |
| Page background | `#F5F5F5` | `bg-neutral-100` |
| Card surface | `#FAFAFA` | `bg-neutral-50` |
| Chart line/bar | `#FF7F11` | — (inline style) |
| Chart background | `#FEF9F3` | — (inline style) |

## Sidebar

Off-black background (`bg-neutral-900`), light text (`text-neutral-300`), active item uses `bg-neutral-700 text-neutral-50`, hover is `hover:bg-neutral-800`. Fixed left, `w-60`, full height.

## Chart Colors

Primary series: `#FF7F11`. Multi-series tints: `['#FF7F11', '#FFa84d', '#FFc98a', '#FFdbb0', '#FFead0']`. The `__other__` bucket uses `#A3A3A3`. Chart container background: `#FEF9F3`.

## States

- **Loading**: Use shadcn `<Skeleton>` with `bg-neutral-200`.
- **Empty**: Centered icon (`text-neutral-300`), primary message (`text-neutral-600`), secondary hint (`text-neutral-500`).
- **Error**: `bg-neutral-200 border border-neutral-900` container. Never show raw errors or stack traces.
