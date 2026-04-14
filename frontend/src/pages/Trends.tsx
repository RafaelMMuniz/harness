import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
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
} from 'recharts'
import {
  LineChart as LineChartIcon,
  BarChart3,
  AreaChart as AreaChartIcon,
  Loader2,
  Save,
  BookOpen,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  fetchEventNames,
  fetchTrends,
  fetchEventProperties,
  fetchSavedAnalyses,
  saveAnalysis,
  deleteSavedAnalysis,
} from '@/lib/api'
import { DATE_PRESETS, formatDateForAPI } from '@/lib/date-presets'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f97316', '#ef4444', '#06b6d4', '#6b7280']

const MEASURE_OPTIONS = [
  { value: 'total_count', label: 'Total Count' },
  { value: 'unique_users', label: 'Unique Users' },
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
]

const NUMERIC_MEASURES = ['sum', 'average', 'min', 'max']

type ChartType = 'line' | 'bar' | 'area'
type Granularity = 'day' | 'week'

interface TrendDataPoint {
  date: string
  total_count?: number
  unique_users?: number
  value?: number
  [key: string]: unknown
}

interface TrendSeries {
  key: string
  data: TrendDataPoint[]
}

interface SavedAnalysis {
  id: number
  name: string
  type: string
  config: Record<string, unknown>
}

function formatXAxisDate(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  if (granularity === 'week') {
    const end = new Date(d)
    end.setDate(end.getDate() + 6)
    const endMonth = end.toLocaleString('en-US', { month: 'short' })
    const endDay = end.getDate()
    return `${month} ${day} - ${endMonth} ${endDay}`
  }
  return `${month} ${day}`
}

export function TrendsPage() {
  const [eventNames, setEventNames] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [datePreset, setDatePreset] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [measure, setMeasure] = useState('total_count')
  const [property, setProperty] = useState('')
  const [breakdownProp, setBreakdownProp] = useState('')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [properties, setProperties] = useState<{ name: string; type: string }[]>([])

  const [data, setData] = useState<TrendDataPoint[]>([])
  const [series, setSeries] = useState<TrendSeries[]>([])
  const [hasBreakdown, setHasBreakdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [savedOpen, setSavedOpen] = useState(false)

  // Load event names
  useEffect(() => {
    fetchEventNames()
      .then(setEventNames)
      .catch(() => {})
  }, [])

  // Load saved analyses
  useEffect(() => {
    fetchSavedAnalyses()
      .then((data) => setSavedAnalyses(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Load properties when event changes
  useEffect(() => {
    if (!selectedEvent) {
      setProperties([])
      return
    }
    fetchEventProperties(selectedEvent)
      .then((props) => setProperties(Array.isArray(props) ? props : []))
      .catch(() => setProperties([]))
  }, [selectedEvent])

  const getDateRange = useCallback(() => {
    if (datePreset === 'custom') {
      return {
        start: customStart,
        end: customEnd,
      }
    }
    const preset = DATE_PRESETS.find((p) => p.value === datePreset)
    if (!preset) return { start: '', end: '' }
    const dates = preset.getDates()
    if (!dates) return { start: '', end: '' }
    return {
      start: formatDateForAPI(dates.start),
      end: formatDateForAPI(dates.end),
    }
  }, [datePreset, customStart, customEnd])

  const loadTrends = useCallback(async () => {
    if (!selectedEvent) return

    const { start, end } = getDateRange()
    if (!start || !end) return

    setLoading(true)
    setError(null)

    try {
      const params: Record<string, string> = {
        event_name: selectedEvent,
        start_date: start,
        end_date: end,
        granularity,
        measure,
      }
      if (NUMERIC_MEASURES.includes(measure) && property) {
        params.property = property
      }
      if (breakdownProp) {
        params.breakdown = breakdownProp
      }

      const result = await fetchTrends(params)

      if (result.series && Array.isArray(result.series)) {
        // Breakdown response: { series: [{ key, data: [...] }] }
        setSeries(result.series)
        setData([])
        setHasBreakdown(true)
      } else if (result.data && Array.isArray(result.data)) {
        // Non-breakdown response: { data: [...] }
        setData(result.data)
        setSeries([])
        setHasBreakdown(false)
      } else if (Array.isArray(result)) {
        setData(result)
        setSeries([])
        setHasBreakdown(false)
      } else {
        setData([])
        setSeries([])
        setHasBreakdown(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trend data')
      setData([])
      setSeries([])
    } finally {
      setLoading(false)
    }
  }, [selectedEvent, getDateRange, granularity, measure, property, breakdownProp])

  // Auto-fetch when controls change
  useEffect(() => {
    loadTrends()
  }, [loadTrends])

  const numericProps = properties.filter((p) => p.type === 'number' || p.type === 'numeric')
  const allPropNames = properties.map((p) => p.name)

  const isNumericMeasure = NUMERIC_MEASURES.includes(measure)

  // Reset property when switching to non-numeric measure
  useEffect(() => {
    if (!isNumericMeasure) {
      setProperty('')
    }
  }, [isNumericMeasure])

  const handleSave = async () => {
    if (!saveName.trim()) return
    try {
      await saveAnalysis({
        name: saveName.trim(),
        type: 'trend',
        config: {
          event_name: selectedEvent,
          date_preset: datePreset,
          custom_start: customStart,
          custom_end: customEnd,
          granularity,
          measure,
          property,
          breakdown: breakdownProp,
          chart_type: chartType,
        },
      })
      setSaveDialogOpen(false)
      setSaveName('')
      const updated = await fetchSavedAnalyses()
      setSavedAnalyses(Array.isArray(updated) ? updated : [])
    } catch {
      // Silently fail save
    }
  }

  const handleLoadSaved = (analysis: SavedAnalysis) => {
    const c = analysis.config as Record<string, string>
    if (c.event_name) setSelectedEvent(c.event_name)
    if (c.date_preset) setDatePreset(c.date_preset)
    if (c.custom_start) setCustomStart(c.custom_start)
    if (c.custom_end) setCustomEnd(c.custom_end)
    if (c.granularity) setGranularity(c.granularity as Granularity)
    if (c.measure) setMeasure(c.measure)
    if (c.property) setProperty(c.property)
    if (c.breakdown) setBreakdownProp(c.breakdown)
    if (c.chart_type) setChartType(c.chart_type as ChartType)
    setSavedOpen(false)
  }

  const handleDeleteSaved = async (id: number) => {
    try {
      await deleteSavedAnalysis(id)
      setSavedAnalyses((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // Silently fail delete
    }
  }

  // Check if all data points are zero
  const allZeros =
    !hasBreakdown &&
    data.length > 0 &&
    data.every(
      (d) =>
        (d.total_count === 0 || d.total_count === undefined) &&
        (d.unique_users === 0 || d.unique_users === undefined) &&
        (d.value === 0 || d.value === undefined)
    )

  const breakdownAllZeros =
    hasBreakdown &&
    series.length > 0 &&
    series.every((s) =>
      s.data.every(
        (d) =>
          (d.total_count === 0 || d.total_count === undefined) &&
          (d.unique_users === 0 || d.unique_users === undefined) &&
          (d.value === 0 || d.value === undefined)
      )
    )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
        <div className="flex gap-2">
          {savedAnalyses.length > 0 && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setSavedOpen(!savedOpen)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Saved
              </Button>
              {savedOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-background border rounded-md shadow-lg z-10">
                  <div className="p-2 space-y-1 max-h-60 overflow-auto">
                    {savedAnalyses
                      .filter((s) => s.type === 'trend')
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted"
                        >
                          <button
                            className="text-sm text-left flex-1 truncate"
                            onClick={() => handleLoadSaved(s)}
                          >
                            {s.name}
                          </button>
                          <button
                            className="text-muted-foreground hover:text-destructive ml-2 flex-shrink-0"
                            onClick={() => handleDeleteSaved(s.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    {savedAnalyses.filter((s) => s.type === 'trend').length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-1">No saved trends</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            disabled={!selectedEvent}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Event</label>
              <Select
                className="w-52"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                placeholder="Select event..."
                options={eventNames.map((n) => ({ value: n, label: n }))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <Select
                className="w-36"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                options={DATE_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
              />
            </div>

            {datePreset === 'custom' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start</label>
                  <Input
                    type="date"
                    className="w-36"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End</label>
                  <Input
                    type="date"
                    className="w-36"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Granularity</label>
              <div className="flex h-10">
                <button
                  className={cn(
                    'px-3 text-sm rounded-l-md border border-r-0 transition-colors',
                    granularity === 'day'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                  onClick={() => setGranularity('day')}
                >
                  Day
                </button>
                <button
                  className={cn(
                    'px-3 text-sm rounded-r-md border transition-colors',
                    granularity === 'week'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                  onClick={() => setGranularity('week')}
                >
                  Week
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Measure</label>
              <Select
                className="w-40"
                value={measure}
                onChange={(e) => setMeasure(e.target.value)}
                options={MEASURE_OPTIONS}
              />
            </div>

            {isNumericMeasure && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Property</label>
                <Select
                  className="w-40"
                  value={property}
                  onChange={(e) => setProperty(e.target.value)}
                  placeholder="Select property"
                  options={numericProps.map((p) => ({ value: p.name, label: p.name }))}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Break down by</label>
              <Select
                className="w-40"
                value={breakdownProp}
                onChange={(e) => setBreakdownProp(e.target.value)}
                placeholder="None"
                options={allPropNames.map((n) => ({ value: n, label: n }))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Chart</label>
              <div className="flex h-10">
                <button
                  className={cn(
                    'px-2.5 rounded-l-md border border-r-0 transition-colors',
                    chartType === 'line'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                  onClick={() => setChartType('line')}
                  title="Line chart"
                >
                  <LineChartIcon className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    'px-2.5 border border-r-0 transition-colors',
                    chartType === 'bar'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                  onClick={() => setChartType('bar')}
                  title="Bar chart"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    'px-2.5 rounded-r-md border transition-colors',
                    chartType === 'area'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                  onClick={() => setChartType('area')}
                  title="Area chart"
                >
                  <AreaChartIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Area */}
      <Card>
        <CardContent className="pt-6">
          {!selectedEvent ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <p className="text-lg">Select an event to see its trend</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading trend data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-destructive">{error}</p>
            </div>
          ) : allZeros || breakdownAllZeros ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <p className="text-lg">No events found in this range</p>
            </div>
          ) : hasBreakdown ? (
            <BreakdownChart
              series={series}
              chartType={chartType}
              granularity={granularity}
              measure={measure}
            />
          ) : data.length > 0 ? (
            <SingleChart
              data={data}
              chartType={chartType}
              granularity={granularity}
              measure={measure}
            />
          ) : (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <p className="text-lg">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Trend Analysis</DialogTitle>
            <DialogDescription>Give this analysis a name to load it later.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Analysis name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ----- Sub-components for chart rendering -----

interface SingleChartProps {
  data: TrendDataPoint[]
  chartType: ChartType
  granularity: Granularity
  measure: string
}

function SingleChart({ data, chartType, granularity, measure }: SingleChartProps) {
  const isCountMeasure = measure === 'total_count' || measure === 'unique_users'
  const dataKeys = isCountMeasure ? ['total_count', 'unique_users'] : ['value']

  const labels: Record<string, string> = {
    total_count: 'Total Count',
    unique_users: 'Unique Users',
    value: MEASURE_OPTIONS.find((m) => m.value === measure)?.label || 'Value',
  }

  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatXAxisDate(d.date, granularity),
  }))

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={labels[key] || key}
                stroke={CHART_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} name={labels[key] || key} fill={CHART_COLORS[i]} />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={labels[key] || key}
                stroke={CHART_COLORS[i]}
                fill={CHART_COLORS[i]}
                fillOpacity={0.15}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

interface BreakdownChartProps {
  series: TrendSeries[]
  chartType: ChartType
  granularity: Granularity
  measure: string
}

function BreakdownChart({ series, chartType, granularity, measure }: BreakdownChartProps) {
  // Merge all series data into a flat array keyed by date
  const dateMap = new Map<string, Record<string, unknown>>()

  for (const s of series) {
    for (const d of s.data) {
      if (!dateMap.has(d.date)) {
        dateMap.set(d.date, { date: d.date })
      }
      const row = dateMap.get(d.date)!
      const valueKey =
        measure === 'total_count' || measure === 'unique_users'
          ? measure
          : 'value'
      row[s.key] = d[valueKey] ?? 0
    }
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => ({
      ...row,
      displayDate: formatXAxisDate(row.date as string, granularity),
    }))

  const seriesKeys = series.map((s) => s.key)

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key === '__other__' ? 'Other' : key}
                stroke={key === '__other__' ? '#6b7280' : CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                name={key === '__other__' ? 'Other' : key}
                fill={key === '__other__' ? '#6b7280' : CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => {
              const color =
                key === '__other__' ? '#6b7280' : CHART_COLORS[i % CHART_COLORS.length]
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key === '__other__' ? 'Other' : key}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.15}
                />
              )
            })}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
