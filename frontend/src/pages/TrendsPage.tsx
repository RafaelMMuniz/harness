import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { LineChart as LineIcon, BarChart3, AreaChart as AreaIcon, Plus, X, Save, BookOpen } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

import {
  getEventNames, getTrends, getEventProperties, getSavedAnalyses, createSavedAnalysis,
  type TrendBucket, type TrendSeries, type SavedAnalysis, type PropertyDescriptor,
} from '@/lib/api';
import { DATE_PRESETS, formatDateForAPI } from '@/lib/date-presets';
import { formatNumber, CHART_COLORS, CHART_OTHER_COLOR, CHART_BG } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type Measure = 'total_count' | 'unique_users' | 'sum' | 'avg' | 'min' | 'max';
type Granularity = 'day' | 'week';
type ChartType = 'line' | 'bar' | 'area';
type DatePresetValue = '7d' | '30d' | '90d' | 'custom';

interface ChartDataPoint {
  date: string;
  [key: string]: string | number | null | undefined;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMeasureLabel(measure: Measure): string {
  switch (measure) {
    case 'total_count': return 'Total Count';
    case 'unique_users': return 'Unique Users';
    case 'sum': return 'Sum';
    case 'avg': return 'Average';
    case 'min': return 'Min';
    case 'max': return 'Max';
  }
}

function isNumericMeasure(measure: Measure): boolean {
  return measure === 'sum' || measure === 'avg' || measure === 'min' || measure === 'max';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface ChartProps {
  chartType: ChartType;
  data: ChartDataPoint[];
  seriesKeys: string[];
  colors: string[];
}

function TrendChart({ chartType, data, seriesKeys, colors }: ChartProps) {
  const tickFormatter = (v: string) => formatDateLabel(v);
  const tooltipFormatter = (value: number, name: string) => [formatNumber(value), name];
  const tooltipDefaultIndex = data.length > 0 ? Math.floor(data.length / 2) : undefined;

  const commonProps = {
    data,
    margin: { top: 8, right: 16, left: 0, bottom: 0 },
  };

  const xAxis = (
    <XAxis
      dataKey="date"
      tickFormatter={tickFormatter}
      tick={{ fontSize: 11, fill: '#525252' }}
      tickLine={false}
      axisLine={false}
    />
  );
  const yAxis = (
    <YAxis
      domain={[0, 'auto']}
      tick={{ fontSize: 11, fill: '#525252' }}
      tickLine={false}
      axisLine={false}
      tickFormatter={(v) => formatNumber(v)}
      width={60}
    />
  );
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />;
  const tip = (
    <Tooltip
      defaultIndex={tooltipDefaultIndex}
      wrapperStyle={{ visibility: 'visible' }}
      contentStyle={{
        backgroundColor: '#FAFAFA',
        border: '1px solid #D4D4D4',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'inherit',
      }}
      formatter={tooltipFormatter}
      labelFormatter={(label) => formatDateLabel(label as string)}
    />
  );
  const legend = (
    <Legend
      data-testid="chart-legend"
      wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
    />
  );

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart {...commonProps}>
          {grid}{xAxis}{yAxis}{tip}{legend}
          {seriesKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={colors[i] ?? CHART_OTHER_COLOR} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart {...commonProps}>
          {grid}{xAxis}{yAxis}{tip}{legend}
          {seriesKeys.map((key, i) => {
            const color = colors[i] ?? CHART_OTHER_COLOR;
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // default: line
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart {...commonProps}>
        {grid}{xAxis}{yAxis}{tip}{legend}
        {seriesKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i] ?? CHART_OTHER_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  // ── Query state ──
  const [eventName, setEventName] = useState('');
  const [measure, setMeasure] = useState<Measure>('total_count');
  const [property, setProperty] = useState('');
  const [breakdown, setBreakdown] = useState('');
  const [datePreset, setDatePreset] = useState<DatePresetValue>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [additionalEvents, setAdditionalEvents] = useState<string[]>([]);

  // ── Remote data ──
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [properties, setProperties] = useState<PropertyDescriptor[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

  // ── Trends response ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<string[]>([]);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [uniqueUsers, setUniqueUsers] = useState<number | null>(null);

  // ── Save dialog ──
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load saved analyses dropdown ──
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);

  // ── Fetch event names on mount ──
  useEffect(() => {
    getEventNames().then(setEventNames).catch(() => {});
    getSavedAnalyses().then(setSavedAnalyses).catch(() => {});
  }, []);

  // ── Fetch properties when event changes ──
  useEffect(() => {
    if (!eventName) { setProperties([]); setProperty(''); return; }
    getEventProperties(eventName)
      .then(setProperties)
      .catch(() => setProperties([]));
    setProperty('');
    setBreakdown('');
  }, [eventName]);

  // ── Derived: numeric properties ──
  const numericProperties = properties.filter(p => p.type === 'number');

  // ── Date range computation ──
  function getDateRange(): { start: string; end: string } {
    if (datePreset === 'custom') {
      return { start: customStart, end: customEnd };
    }
    const preset = DATE_PRESETS.find(p => p.value === datePreset);
    const dates = preset?.getDates?.();
    if (!dates) return { start: '', end: '' };
    return {
      start: formatDateForAPI(dates.start),
      end: formatDateForAPI(dates.end),
    };
  }

  // ── Fetch trends data ──
  const fetchTrends = useCallback(async (overrideEvent?: string) => {
    const activeEvent = overrideEvent ?? eventName;
    if (!activeEvent) return;

    const { start, end } = getDateRange();
    if (!start || !end) return;

    // Multi-event mode: fetch each event separately
    const allEvents = [activeEvent, ...additionalEvents];
    const isMultiEvent = allEvents.length > 1;
    const hasBreakdown = Boolean(breakdown) && !isMultiEvent;

    setLoading(true);
    setError(null);

    try {
      if (isMultiEvent) {
        // Parallel fetches for each event
        const results = await Promise.all(
          allEvents.map(evName =>
            getTrends({
              event_name: evName,
              measure,
              ...(isNumericMeasure(measure) && property ? { property } : {}),
              start_date: start,
              end_date: end,
              granularity,
            })
          )
        );

        // Merge all results into one date-keyed map
        const dateMap = new Map<string, ChartDataPoint>();
        results.forEach((res, idx) => {
          const evKey = allEvents[idx];
          (res.data ?? []).forEach(bucket => {
            const existing = dateMap.get(bucket.date) ?? { date: bucket.date };
            const val = measure === 'total_count' ? bucket.total_count
              : measure === 'unique_users' ? bucket.unique_users
              : bucket.value;
            existing[evKey] = val ?? null;
            dateMap.set(bucket.date, existing);
          });
        });

        const sorted = Array.from(dateMap.values()).sort((a, b) =>
          String(a.date).localeCompare(String(b.date))
        );

        setChartData(sorted);
        setSeriesKeys(allEvents);
        setSeriesColors(CHART_COLORS.slice(0, allEvents.length));

        // Summary from first event
        const primary = results[0];
        const flat = primary.data ?? [];
        setTotalEvents(flat.reduce((s, b) => s + (b.total_count ?? 0), 0));
        setUniqueUsers(null);

      } else if (hasBreakdown) {
        const params: Record<string, string> = {
          event_name: activeEvent,
          measure,
          breakdown_by: breakdown,
          start_date: start,
          end_date: end,
          granularity,
        };
        if (isNumericMeasure(measure) && property) params.property = property;

        const res = await getTrends(params);
        const series: TrendSeries[] = res.series ?? [];

        // Collect all unique dates
        const dateSet = new Set<string>();
        series.forEach(s => s.data.forEach(b => dateSet.add(b.date)));
        const sortedDates = Array.from(dateSet).sort();

        // Build chart data
        const byDate = new Map<string, ChartDataPoint>();
        sortedDates.forEach(d => byDate.set(d, { date: d }));

        const keys: string[] = [];
        series.forEach(s => {
          keys.push(s.key);
          s.data.forEach(b => {
            const point = byDate.get(b.date)!;
            // Breakdown endpoint always returns aggregated values in the `value` field
            point[s.key] = b.value ?? null;
          });
        });

        const sorted = Array.from(byDate.values());
        setChartData(sorted);

        // Apply __other__ color to the last bucket if its key is '__other__'
        const colors = keys.map((k, i) =>
          k === '__other__' ? CHART_OTHER_COLOR : (CHART_COLORS[i] ?? CHART_OTHER_COLOR)
        );
        setSeriesKeys(keys);
        setSeriesColors(colors);

        const allBuckets = series.flatMap(s => s.data);
        setTotalEvents(allBuckets.reduce((s, b) => s + (b.total_count ?? 0), 0));
        setUniqueUsers(null);

      } else {
        // Single event, no breakdown
        const params: Record<string, string> = {
          event_name: activeEvent,
          measure,
          start_date: start,
          end_date: end,
          granularity,
        };
        if (isNumericMeasure(measure) && property) params.property = property;

        const res = await getTrends(params);
        const buckets: TrendBucket[] = res.data ?? [];

        const sorted = buckets
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date));

        if (measure === 'total_count') {
          // Show both total_count and unique_users lines
          const data: ChartDataPoint[] = sorted.map(b => ({
            date: b.date,
            'Total Events': b.total_count ?? null,
            'Unique Users': b.unique_users ?? null,
          }));
          setChartData(data);
          setSeriesKeys(['Total Events', 'Unique Users']);
          setSeriesColors(['#FF7F11', '#FFa84d']);
          setTotalEvents(sorted.reduce((s, b) => s + (b.total_count ?? 0), 0));
          setUniqueUsers(sorted.reduce((s, b) => s + (b.unique_users ?? 0), 0));
        } else if (measure === 'unique_users') {
          const data: ChartDataPoint[] = sorted.map(b => ({
            date: b.date,
            'Unique Users': b.unique_users ?? null,
          }));
          setChartData(data);
          setSeriesKeys(['Unique Users']);
          setSeriesColors(['#FF7F11']);
          setTotalEvents(null);
          setUniqueUsers(sorted.reduce((s, b) => s + (b.unique_users ?? 0), 0));
        } else {
          const measureLabel = getMeasureLabel(measure) + (property ? ` of ${property}` : '');
          const data: ChartDataPoint[] = sorted.map(b => ({
            date: b.date,
            [measureLabel]: b.value ?? null,
          }));
          setChartData(data);
          setSeriesKeys([measureLabel]);
          setSeriesColors(['#FF7F11']);
          setTotalEvents(null);
          setUniqueUsers(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, measure, property, breakdown, datePreset, customStart, customEnd, granularity, additionalEvents]);

  // Auto-fetch when query params change and an event is selected
  useEffect(() => {
    if (eventName) fetchTrends();
  }, [fetchTrends, eventName]);

  // ── Handlers ──
  function handleAddEvent() {
    if (additionalEvents.length >= 4) return; // max 5 total
    setAdditionalEvents(prev => [...prev, '']);
    setBreakdown(''); // mutually exclusive
  }

  function handleRemoveAdditionalEvent(idx: number) {
    setAdditionalEvents(prev => prev.filter((_, i) => i !== idx));
  }

  function handleAdditionalEventChange(idx: number, val: string) {
    setAdditionalEvents(prev => prev.map((e, i) => (i === idx ? val : e)));
  }

  function handleBreakdownChange(val: string) {
    setBreakdown(val === 'none' ? '' : val);
    if (val !== 'none' && val !== '') {
      setAdditionalEvents([]); // mutually exclusive
    }
  }

  async function handleSave() {
    if (!saveName.trim() || !eventName) return;
    setSaving(true);
    try {
      const { start, end } = getDateRange();
      const config: Record<string, unknown> = {
        eventName,
        additionalEvents,
        measure,
        property,
        breakdown,
        datePreset,
        customStart,
        customEnd,
        granularity,
        chartType,
        start_date: start,
        end_date: end,
      };
      const saved = await createSavedAnalysis({ name: saveName.trim(), type: 'trend', config });
      setSavedAnalyses(prev => [saved, ...prev]);
      setSaveDialogOpen(false);
      setSaveName('');
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function handleLoadAnalysis(analysis: SavedAnalysis) {
    const c = analysis.config as Record<string, unknown>;
    if (typeof c.eventName === 'string') setEventName(c.eventName);
    if (typeof c.measure === 'string') setMeasure(c.measure as Measure);
    if (typeof c.property === 'string') setProperty(c.property);
    if (typeof c.breakdown === 'string') setBreakdown(c.breakdown);
    if (typeof c.datePreset === 'string') setDatePreset(c.datePreset as DatePresetValue);
    if (typeof c.customStart === 'string') setCustomStart(c.customStart);
    if (typeof c.customEnd === 'string') setCustomEnd(c.customEnd);
    if (typeof c.granularity === 'string') setGranularity(c.granularity as Granularity);
    if (typeof c.chartType === 'string') setChartType(c.chartType as ChartType);
    if (Array.isArray(c.additionalEvents)) setAdditionalEvents(c.additionalEvents as string[]);
    setLoadMenuOpen(false);
  }

  // ── Summary totals ──
  const summaryTotalEvents = totalEvents ?? 0;
  const summaryUniqueUsers = uniqueUsers ?? 0;

  // ── All property names for breakdown ──
  const allPropertyNames = properties.map(p => p.name);

  // ── Render ──
  return (
    <>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Trends</h1>

      {/* ── Controls Card ── */}
      <Card className="mb-6 bg-neutral-50 border-neutral-300">
        <CardContent className="p-4 space-y-3">

          {/* Row 1: Event + Measure + Property + Breakdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Selector */}
            <div className="w-48">
              <Select
                value={eventName}
                onValueChange={setEventName}
                placeholder="Select event"
                data-testid="event-selector"
              >
                <SelectTrigger data-testid="event-selector" className="border-neutral-300 text-neutral-900">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 border-neutral-300">
                  {eventNames.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Measure Selector */}
            <div className="w-44">
              <Select
                value={measure}
                onValueChange={(v) => setMeasure(v as Measure)}
                data-testid="measure-selector"
              >
                <SelectTrigger data-testid="measure-selector" className="border-neutral-300 text-neutral-900">
                  <SelectValue placeholder="Measure" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 border-neutral-300">
                  <SelectItem value="total_count">Total Count</SelectItem>
                  <SelectItem value="unique_users">Unique Users</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="min">Min</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Selector — only shown for numeric measures */}
            {isNumericMeasure(measure) && (
              <div className="w-44">
                <Select
                  value={property}
                  onValueChange={setProperty}
                  placeholder="Select property"
                  data-testid="property-selector"
                >
                  <SelectTrigger data-testid="property-selector" className="border-neutral-300 text-neutral-900">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-50 border-neutral-300">
                    {numericProperties.map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Breakdown Selector */}
            <div className="w-48">
              <Select
                value={breakdown || 'none'}
                onValueChange={handleBreakdownChange}
                data-testid="breakdown-selector"
              >
                <SelectTrigger data-testid="breakdown-selector" className="border-neutral-300 text-neutral-900">
                  <SelectValue placeholder="Break down by" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 border-neutral-300">
                  <SelectItem value="none">None</SelectItem>
                  {allPropertyNames.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Date presets + Granularity + Chart type + Add event */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range selector */}
            <div className="w-44">
              <Select
                value={datePreset}
                onValueChange={(v) => setDatePreset(v as DatePresetValue)}
              >
                <SelectTrigger data-testid="date-range-selector" className="border-neutral-300 text-neutral-900">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 border-neutral-300">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom date inputs */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-36 text-sm border-neutral-300"
                />
                <span className="text-sm text-neutral-500">—</span>
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-36 text-sm border-neutral-300"
                />
              </div>
            )}

            {/* Granularity selector */}
            <div className="w-32">
              <Select
                value={granularity}
                onValueChange={(v) => setGranularity(v as Granularity)}
              >
                <SelectTrigger data-testid="granularity-selector" className="border-neutral-300 text-neutral-900">
                  <SelectValue placeholder="Granularity" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 border-neutral-300">
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chart type toggle */}
            <div className="flex gap-1 ml-auto">
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'outline'}
                className={chartType === 'line'
                  ? 'bg-neutral-900 text-neutral-100 hover:bg-neutral-800'
                  : 'border-neutral-300 text-neutral-900 hover:bg-neutral-200'}
                onClick={() => setChartType('line')}
                data-testid="chart-type-line"
                aria-pressed={chartType === 'line'}
                title="Line chart"
              >
                <LineIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'default' : 'outline'}
                className={chartType === 'bar'
                  ? 'bg-neutral-900 text-neutral-100 hover:bg-neutral-800'
                  : 'border-neutral-300 text-neutral-900 hover:bg-neutral-200'}
                onClick={() => setChartType('bar')}
                data-testid="chart-type-bar"
                aria-pressed={chartType === 'bar'}
                title="Bar chart"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'area' ? 'default' : 'outline'}
                className={chartType === 'area'
                  ? 'bg-neutral-900 text-neutral-100 hover:bg-neutral-800'
                  : 'border-neutral-300 text-neutral-900 hover:bg-neutral-200'}
                onClick={() => setChartType('area')}
                data-testid="chart-type-area"
                aria-pressed={chartType === 'area'}
                title="Area chart"
              >
                <AreaIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 3: Multi-event chips + Add event button + Save + Load */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add event button — disabled when breakdown is active or max reached */}
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
              onClick={handleAddEvent}
              disabled={Boolean(breakdown) || additionalEvents.length >= 4}
              data-testid="add-event-button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add event
            </Button>

            {/* Additional event chips */}
            {additionalEvents.map((ev, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className="w-40">
                  <Select
                    value={ev}
                    onValueChange={(v) => handleAdditionalEventChange(idx, v)}
                    placeholder="Select event"
                  >
                    <SelectTrigger data-testid="event-selector" className="border-neutral-300 text-neutral-900 h-7 text-xs px-2">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-50 border-neutral-300">
                      {eventNames
                        .filter(n => n !== eventName && !additionalEvents.includes(n) || n === ev)
                        .map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAdditionalEvent(idx)}
                  className="h-5 w-5 rounded flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 ml-auto">
              {/* Save button */}
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
                onClick={() => setSaveDialogOpen(true)}
                disabled={!eventName}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>

              {/* Load saved analyses */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
                  onClick={() => setLoadMenuOpen(v => !v)}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Saved
                </Button>
                {loadMenuOpen && savedAnalyses.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded border border-neutral-300 bg-neutral-50 shadow-md">
                    <div className="max-h-48 overflow-y-auto p-1">
                      {savedAnalyses
                        .filter(a => a.type === 'trend')
                        .map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleLoadAnalysis(a)}
                            className="w-full text-left rounded px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-200 transition-colors truncate"
                          >
                            {a.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {loadMenuOpen && savedAnalyses.filter(a => a.type === 'trend').length === 0 && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded border border-neutral-300 bg-neutral-50 shadow-md p-3">
                    <p className="text-sm text-neutral-500">No saved analyses</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Chart Card ── */}
      <Card className="mb-6 bg-neutral-50 border-neutral-300">
        <CardContent className="p-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: CHART_BG }}>
            {!eventName ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <LineIcon className="h-10 w-10 text-neutral-300 mb-3" />
                <p className="text-sm font-bold text-neutral-600">Select an event to see its trend</p>
                <p className="text-sm font-bold text-neutral-500 mt-1">Choose an event from the controls above</p>
              </div>
            ) : loading ? (
              <Skeleton className="h-[300px] w-full bg-neutral-200" />
            ) : error ? (
              <div className="rounded-lg bg-neutral-200 border border-neutral-900 p-4 h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-bold text-neutral-900">Failed to load trend data</p>
                  <p className="text-sm font-medium text-neutral-600 mt-1">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-neutral-900 text-neutral-900 hover:bg-neutral-200"
                    onClick={() => fetchTrends()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <p className="text-sm font-bold text-neutral-600">No data for this period</p>
                <p className="text-sm font-bold text-neutral-500 mt-1">Try a different date range or event</p>
              </div>
            ) : (
              <TrendChart
                chartType={chartType}
                data={chartData}
                seriesKeys={seriesKeys}
                colors={seriesColors}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Metric Cards ── */}
      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {totalEvents !== null && (
            <Card className="bg-neutral-50 border-neutral-300 p-6">
              <p className="text-2xl font-black text-neutral-900 tabular-nums">
                {formatNumber(summaryTotalEvents)}
              </p>
              <p className="text-sm font-bold text-neutral-500 mt-1">Total Events</p>
            </Card>
          )}
          {uniqueUsers !== null && (
            <Card className="bg-neutral-50 border-neutral-300 p-6">
              <p className="text-2xl font-black text-neutral-900 tabular-nums">
                {formatNumber(summaryUniqueUsers)}
              </p>
              <p className="text-sm font-bold text-neutral-500 mt-1">Unique Users</p>
            </Card>
          )}
        </div>
      )}

      {/* ── Save Dialog ── */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogClose onOpenChange={setSaveDialogOpen} />
          <DialogHeader>
            <DialogTitle>Save Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">Give this analysis a name to load it later.</p>
            <Input
              placeholder="e.g. Weekly signups trend"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              className="border-neutral-300"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
              onClick={handleSave}
              disabled={!saveName.trim() || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
