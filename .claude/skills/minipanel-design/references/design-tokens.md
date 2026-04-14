# Design Tokens

Complete specification of MiniPanel's visual tokens: colors, typography, spacing, and font configuration.

## Font Configuration

System monospace only. Override Tailwind's `fontFamily.sans` in `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
  mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
}
```

Both `font-sans` and `font-mono` resolve to the same stack. Every element uses monospace — no serif, no sans-serif.

## Color Palette

Strictly monochrome. Never use `#000000` or `#FFFFFF`. All values are neutral grays between off-black and off-white.

### Core Tokens

| Token | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| Off-black | `#171717` | Primary text, button bg, sidebar bg | `text-neutral-900`, `bg-neutral-900` |
| Dark gray | `#525252` | Secondary text | `text-neutral-600` |
| Mid gray | `#6B6B6B` | Muted text, captions | `text-neutral-500` |
| Border | `#D4D4D4` | Borders, dividers | `border-neutral-300` |
| Light gray | `#E5E5E5` | Subtle backgrounds, hover states | `bg-neutral-200` |
| Off-white | `#F5F5F5` | Page background | `bg-neutral-100` |
| Surface | `#FAFAFA` | Card and panel surfaces | `bg-neutral-50` |

### Accessibility Contrast Ratios

All text/background combinations meet **WCAG AA** (≥ 4.5:1 for normal text, ≥ 3:1 for large text):

| Text | Background | Ratio | Pass |
|------|-----------|-------|------|
| Off-black `#171717` | Surface `#FAFAFA` | 15.7:1 | AAA |
| Off-black `#171717` | Off-white `#F5F5F5` | 14.5:1 | AAA |
| Dark gray `#525252` | Surface `#FAFAFA` | 7.2:1 | AAA |
| Dark gray `#525252` | Off-white `#F5F5F5` | 6.8:1 | AA |
| Mid gray `#6B6B6B` | Surface `#FAFAFA` | 5.0:1 | AA |
| Light text `#D4D4D4` | Off-black `#171717` | 10.5:1 | AAA |

### Sidebar Colors

| Role | Tailwind |
|------|----------|
| Background | `bg-neutral-900` |
| Text | `text-neutral-300` |
| Active item | `bg-neutral-700 text-neutral-50` |
| Hover | `hover:bg-neutral-800` |

### Chart Colors

Charts are the **only** place a non-gray color appears. Use `#FF7F11` for lines, bars, and area fills. This color is **never used for text**.

```typescript
const CHART_COLORS = ['#FF7F11'];
```

Chart container background:

```typescript
const CHART_BG = '#FEF9F3';
```

Multi-series charts (breakdowns) — vary the orange with opacity or use these tints:

```typescript
const CHART_SERIES = ['#FF7F11', '#FFa84d', '#FFc98a', '#FFdbb0', '#FFead0'];
```

The `__other__` series uses `#A3A3A3` (neutral-400).

## Typography

Three sizes. Weight carries the hierarchy.

| Element | Tailwind classes |
|---------|-----------------|
| Page title | `text-2xl font-black text-neutral-900` |
| Metric value | `text-2xl font-black text-neutral-900` |
| Body text | `text-sm font-bold text-neutral-900` |
| Button label | `text-sm font-bold` |
| Caption | `text-sm font-bold text-neutral-500` |
| Table cell (text) | `text-sm font-medium text-neutral-900` |
| Table cell (number) | `text-sm font-medium text-neutral-900 text-right tabular-nums` |
| Metric label | `text-sm font-bold text-neutral-500` |

## Spacing

Use Tailwind spacing scale. Key patterns:

| Context | Class |
|---------|-------|
| Component padding | `p-4` |
| Card padding | `p-6` |
| Page padding | `p-8` |
| Section gap | `gap-6` or `space-y-6` |
| Control gap | `gap-3` |
