import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchEventNames, fetchTrends, fetchEventProperties } from '../lib/api';
import { DATE_PRESETS, formatDateForAPI } from '../lib/date-presets';
import { Select } from '../components/Select';
import { Skeleton } from '../components/Skeleton';

type ChartType = 'line' | 'bar' | 'area';
type Granularity = 'day' | 'week';
type Measure = 'total_count' | 'unique_users' | 'sum' | 'avg' | 'min' | 'max';

const MEASURE_OPTIONS: { value: Measure; label: string }[] = [
  { value: 'total_count', label: 'Total Count' },
  { value: 'unique_users', label: 'Unique Users' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
];

const CHART_SERIES = ['#FF7F11', '#FFa84d', '#FFc98a', '#FFdbb0', '#FFead0'];
const OTHER_COLOR = '#A3A3A3';

export default function TrendsPage() {
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [measure, setMeasure] = useState<Measure>('total_count');
  const [property, setProperty] = useState('');
  const [breakdown, setBreakdown] = useState('');
  const [properties, setProperties] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState('30d');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [loading, setLoading] = useState(false);

  // Chart data can be simple array or keyed by breakdown
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);

  // Load event names
  useEffect(() => {
    fetchEventNames()
      .then(setEventNames)
      .catch(() => {});
  }, []);

  // Load properties when event changes
  const primaryEvent = selectedEvents[0] ?? '';
  useEffect(() => {
    if (!primaryEvent) {
      setProperties([]);
      return;
    }
    fetchEventProperties(primaryEvent)
      .then(setProperties)
      .catch(() => setProperties([]));
  }, [primaryEvent]);

  const needsProperty = ['sum', 'avg', 'min', 'max'].includes(measure);

  const loadTrends = useCallback(async () => {
    if (selectedEvents.length === 0) return;

    setLoading(true);
    try {
      const preset = DATE_PRESETS.find((p) => p.value === datePreset);
      const dates = preset?.getDates?.();
      const params: Record<string, string> = {
        event_name: selectedEvents.join(','),
        granularity,
        measure,
      };
      if (dates) {
        params.start_date = formatDateForAPI(dates.start);
        params.end_date = formatDateForAPI(dates.end);
      }
      if (needsProperty && property) {
        params.property = property;
      }
      if (breakdown && breakdown !== 'none') {
        params.breakdown_by = breakdown;
      }

      const data = await fetchTrends(params);

      // Handle breakdown data (API returns { series: [...] })
      if (data.series && Array.isArray(data.series)) {
        const seriesData = data.series;
        const keys = seriesData.map((s) => s.key);
        // Merge series into unified array keyed by date
        const dateMap: Record<string, Record<string, unknown>> = {};

        for (const s of seriesData) {
          for (const point of s.data) {
            if (!dateMap[point.date]) {
              dateMap[point.date] = { date: point.date };
            }
            dateMap[point.date][s.key] = point.value ?? 0;
          }
        }

        const merged = Object.values(dateMap).sort(
          (a, b) => String(a.date).localeCompare(String(b.date))
        );
        setChartData(merged);
        setSeriesKeys(keys);
      } else if (data.data && Array.isArray(data.data)) {
        // Flat data — no breakdown
        const flat = data.data as unknown as Record<string, unknown>[];
        setChartData(flat);
        // Determine series keys from first data point
        if (flat.length > 0) {
          const keys = Object.keys(flat[0]).filter((k) => k !== 'date');
          setSeriesKeys(keys);
        } else {
          setSeriesKeys(measure === 'total_count' || measure === 'unique_users'
            ? ['total_count', 'unique_users']
            : ['value']);
        }
      }
    } catch {
      setChartData([]);
      setSeriesKeys([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEvents, datePreset, granularity, measure, property, breakdown, needsProperty]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const handleEventSelect = (value: string) => {
    if (!value) {
      setSelectedEvents([]);
      return;
    }
    // Toggle for multi-select: if already selected, remove; otherwise add
    if (selectedEvents.includes(value)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== value));
    } else {
      setSelectedEvents([...selectedEvents, value]);
    }
  };

  const eventOptions = eventNames.map((n) => ({ value: n, label: n }));

  const breakdownOptions = [
    { value: 'none', label: 'None' },
    ...properties.map((p) => ({ value: p, label: p })),
  ];

  const propertyOptions = properties.map((p) => ({ value: p, label: p }));

  const getSeriesColor = (index: number) =>
    index < CHART_SERIES.length ? CHART_SERIES[index] : OTHER_COLOR;

  const seriesLabels: Record<string, string> = {
    total_count: 'Total Events',
    unique_users: 'Unique Users',
    sum: 'Sum',
    avg: 'Average',
    min: 'Min',
    max: 'Max',
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 20, left: 10, bottom: 5 },
    };

    const renderSeries = () =>
      seriesKeys.map((key, i) => {
        const color = getSeriesColor(i);
        const name = seriesLabels[key] ?? key;

        if (chartType === 'bar') {
          return <Bar key={key} dataKey={key} fill={color} name={name} />;
        }
        if (chartType === 'area') {
          return (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              name={name}
            />
          );
        }
        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={name}
          />
        );
      });

    const ChartComponent =
      chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fontFamily: 'monospace' }}
            stroke="#A3A3A3"
          />
          <YAxis
            tick={{ fontSize: 12, fontFamily: 'monospace' }}
            stroke="#A3A3A3"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FAFAFA',
              border: '1px solid #D4D4D4',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          />
          {renderSeries()}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Trends</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Event selector */}
        <Select
          value={selectedEvents[0] ?? ''}
          onChange={handleEventSelect}
          options={eventOptions}
          placeholder="Select event..."
          data-testid="event-selector"
        />

        {/* Selected events tags */}
        {selectedEvents.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {selectedEvents.map((ev) => (
              <span
                key={ev}
                className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-900"
              >
                {ev}
                <button
                  onClick={() =>
                    setSelectedEvents(selectedEvents.filter((e) => e !== ev))
                  }
                  className="text-neutral-500 hover:text-neutral-900 ml-1"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Measure selector */}
        <Select
          value={measure}
          onChange={(v) => {
            setMeasure(v as Measure);
            if (!['sum', 'avg', 'min', 'max'].includes(v)) {
              setProperty('');
            }
          }}
          options={MEASURE_OPTIONS}
          placeholder="Measure..."
          data-testid="measure-selector"
        />

        {/* Property selector (only for numeric measures) */}
        {needsProperty && (
          <Select
            value={property}
            onChange={setProperty}
            options={propertyOptions}
            placeholder="Property..."
            data-testid="property-selector"
          />
        )}

        {/* Breakdown selector */}
        <Select
          value={breakdown || 'none'}
          onChange={(v) => setBreakdown(v === 'none' ? '' : v)}
          options={breakdownOptions}
          placeholder="Breakdown..."
          data-testid="breakdown-selector"
        />
      </div>

      {/* Date presets + granularity + chart type */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Date presets */}
        {DATE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
          <button
            key={preset.value}
            data-testid={`date-preset-${preset.value}`}
            onClick={() => setDatePreset(preset.value)}
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
              datePreset === preset.value
                ? 'bg-neutral-900 text-neutral-100'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            {preset.label}
          </button>
        ))}

        <div className="mx-2 h-6 w-px bg-neutral-300" />

        {/* Granularity */}
        <button
          data-testid="granularity-day"
          onClick={() => setGranularity('day')}
          className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
            granularity === 'day'
              ? 'bg-neutral-900 text-neutral-100'
              : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
          }`}
        >
          Day
        </button>
        <button
          data-testid="granularity-week"
          onClick={() => setGranularity('week')}
          className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
            granularity === 'week'
              ? 'bg-neutral-900 text-neutral-100'
              : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
          }`}
        >
          Week
        </button>

        <div className="mx-2 h-6 w-px bg-neutral-300" />

        {/* Chart type */}
        <button
          data-testid="chart-type-line"
          onClick={() => setChartType('line')}
          className={`rounded p-1.5 transition-colors ${
            chartType === 'line'
              ? 'bg-neutral-900 text-neutral-100'
              : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
          }`}
          title="Line chart"
        >
          <span className="h-4 w-4 flex items-center justify-center text-xs">{'\u2197'}</span>
        </button>
        <button
          data-testid="chart-type-bar"
          onClick={() => setChartType('bar')}
          className={`rounded p-1.5 transition-colors ${
            chartType === 'bar'
              ? 'bg-neutral-900 text-neutral-100'
              : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
          }`}
          title="Bar chart"
        >
          <span className="h-4 w-4 flex items-center justify-center text-xs">{'\u2587'}</span>
        </button>
        <button
          data-testid="chart-type-area"
          onClick={() => setChartType('area')}
          className={`rounded p-1.5 transition-colors ${
            chartType === 'area'
              ? 'bg-neutral-900 text-neutral-100'
              : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
          }`}
          title="Area chart"
        >
          <span className="h-4 w-4 flex items-center justify-center text-xs">{'\u2248'}</span>
        </button>
      </div>

      {/* Chart area */}
      {selectedEvents.length === 0 && (
        <div className="flex items-center justify-center py-24 text-sm font-bold text-neutral-500">
          Select an event to see its trend
        </div>
      )}

      {loading && selectedEvents.length > 0 && (
        <div data-testid="loading">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      )}

      {!loading && selectedEvents.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF9F3' }}>
          <div data-testid="chart-legend">
            {renderChart()}
          </div>
        </div>
      )}
    </div>
  );
}
