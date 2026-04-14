import { useState, useEffect, useCallback } from 'react'
import { fetchEvents, fetchEventNames } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

const PAGE_SIZE = 25

interface EventRecord {
  id: number
  event_name: string
  timestamp: string
  device_id: string | null
  user_id: string | null
  resolved_user_id: string | null
  properties: Record<string, unknown> | null
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function truncateProps(props: Record<string, unknown> | null): string {
  if (!props || Object.keys(props).length === 0) return '-'
  const entries = Object.entries(props)
  const preview = entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
  return entries.length > 3 ? preview + '...' : preview
}

export function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [eventNames, setEventNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const [filterEvent, setFilterEvent] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => {
    fetchEventNames()
      .then(setEventNames)
      .catch(() => {})
  }, [])

  const loadEvents = useCallback(async (newOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(newOffset),
      }
      if (filterEvent) params.event_name = filterEvent
      if (filterStartDate) params.start_date = filterStartDate
      if (filterEndDate) params.end_date = filterEndDate

      const data = await fetchEvents(params)
      const eventList = Array.isArray(data) ? data : data.events || []
      setEvents(eventList)
      setHasMore(eventList.length === PAGE_SIZE)
      setOffset(newOffset)
      setExpandedRow(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [filterEvent, filterStartDate, filterEndDate])

  useEffect(() => {
    loadEvents(0)
  }, [loadEvents])

  const handleFilter = () => {
    loadEvents(0)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Events</h1>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Event Name</label>
          <Select
            className="w-48"
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            placeholder="All events"
            options={eventNames.map((n) => ({ value: n, label: n }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <Input
            type="date"
            className="w-40"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">End Date</label>
          <Input
            type="date"
            className="w-40"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
        <Button onClick={handleFilter} size="sm">
          Filter
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No events found</p>
          <p className="text-sm">
            Try adjusting your filters or run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm run seed</code> to load sample data.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Properties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((evt) => (
                <>
                  <TableRow
                    key={evt.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === evt.id ? null : evt.id)}
                  >
                    <TableCell className="w-8 pr-0">
                      {expandedRow === evt.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(evt.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{evt.event_name}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {evt.resolved_user_id || evt.user_id || evt.device_id || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {truncateProps(evt.properties)}
                    </TableCell>
                  </TableRow>
                  {expandedRow === evt.id && (
                    <TableRow key={`${evt.id}-expanded`}>
                      <TableCell colSpan={5} className="bg-muted/30">
                        <div className="py-2 px-4 space-y-2">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                            <div>
                              <span className="font-medium text-muted-foreground">Event ID:</span>{' '}
                              {evt.id}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Timestamp:</span>{' '}
                              {evt.timestamp}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Device ID:</span>{' '}
                              {evt.device_id || '-'}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">User ID:</span>{' '}
                              {evt.user_id || '-'}
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Resolved ID:</span>{' '}
                              {evt.resolved_user_id || '-'}
                            </div>
                          </div>
                          {evt.properties && Object.keys(evt.properties).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Properties:</p>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                                {Object.entries(evt.properties).map(([k, v]) => (
                                  <div key={k}>
                                    <span className="font-medium">{k}:</span>{' '}
                                    <span className="text-muted-foreground">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1} - {offset + events.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => loadEvents(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => loadEvents(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
