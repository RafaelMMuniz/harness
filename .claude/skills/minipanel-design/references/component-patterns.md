# Component Patterns

Copy-paste-ready shadcn/ui component patterns for MiniPanel. Use these instead of building from scratch.

## Cards

```tsx
<Card className="bg-neutral-50 border-neutral-300 p-6">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

## Buttons

Two variants only. No ghost buttons.

### Primary (filled)
```tsx
<Button variant="default" className="bg-neutral-900 text-neutral-100 hover:bg-neutral-800">
  Primary
</Button>
```

### Secondary (outline)
```tsx
<Button variant="outline" className="border-neutral-900 text-neutral-900 hover:bg-neutral-200">
  Secondary
</Button>
```

### Toggle groups
For chart type selectors, granularity pickers, and similar toggles, use a row of Buttons with conditional variant:

```tsx
<div className="flex gap-1">
  {options.map(opt => (
    <Button
      key={opt.value}
      variant={selected === opt.value ? "default" : "outline"}
      className={selected === opt.value
        ? "bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
        : "border-neutral-900 text-neutral-900 hover:bg-neutral-200"
      }
      onClick={() => setSelected(opt.value)}
    >
      {opt.label}
    </Button>
  ))}
</div>
```

## Selects

```tsx
<Select onValueChange={setValue}>
  <SelectTrigger className="w-48 border-neutral-300 text-neutral-900">
    <SelectValue placeholder="Select event" />
  </SelectTrigger>
  <SelectContent className="bg-neutral-50 border-neutral-300">
    <SelectItem value="page_viewed">Page Viewed</SelectItem>
  </SelectContent>
</Select>
```

## Tables

Numbers are always right-aligned. Use `tabular-nums` for consistent digit widths.

```tsx
<Table>
  <TableHeader>
    <TableRow className="border-neutral-300">
      <TableHead className="text-sm font-bold text-neutral-500">Name</TableHead>
      <TableHead className="text-sm font-bold text-neutral-500 text-right">Count</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-neutral-300 hover:bg-neutral-200">
      <TableCell className="text-sm font-medium text-neutral-900">Page Viewed</TableCell>
      <TableCell className="text-sm font-medium text-neutral-900 text-right tabular-nums">1,234</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Badges (Event Name Chips)

```tsx
<Badge variant="secondary" className="bg-neutral-200 text-neutral-900">
  Page Viewed
</Badge>
```

## Search Input

```tsx
<Input
  placeholder="Search users..."
  className="w-64 border-neutral-300 text-neutral-900 placeholder:text-neutral-500"
/>
```

## Metric Cards

Use for summary statistics below charts:

```tsx
<Card className="bg-neutral-50 border-neutral-300 p-6">
  <p className="text-2xl font-black text-neutral-900">4,218</p>
  <p className="text-sm font-bold text-neutral-500">Total Events</p>
</Card>
```

## Chart Container

Wrap all Recharts charts in this container:

```tsx
<div className="rounded-lg p-4" style={{ backgroundColor: '#FEF9F3' }}>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <Line type="monotone" dataKey="value" stroke="#FF7F11" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
</div>
```

Multi-series chart colors:

```typescript
const CHART_SERIES = ['#FF7F11', '#FFa84d', '#FFc98a', '#FFdbb0', '#FFead0'];
const OTHER_COLOR = '#A3A3A3';
```

## States

### Loading

Use shadcn `<Skeleton>`:

```tsx
{/* Table rows */}
<Skeleton className="h-10 w-full bg-neutral-200" />

{/* Chart */}
<Skeleton className="h-64 w-full rounded-lg bg-neutral-200" />

{/* Controls */}
<Skeleton className="h-9 w-48 rounded-md bg-neutral-200" />
```

### Empty

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <IconComponent className="h-12 w-12 text-neutral-300 mb-4" />
  <p className="text-sm font-bold text-neutral-600 mb-1">No events found</p>
  <p className="text-sm font-bold text-neutral-500">Try adjusting your filters</p>
</div>
```

### Error

```tsx
<div className="rounded-lg bg-neutral-200 border border-neutral-900 p-4 text-neutral-900">
  <p className="text-sm font-bold">Something went wrong</p>
  <p className="text-sm font-medium text-neutral-600 mt-1">Please try again</p>
</div>
```

Never show raw errors, stack traces, or technical details to users.
