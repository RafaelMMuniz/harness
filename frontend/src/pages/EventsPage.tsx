import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { getEvents, getEventNames, type Event } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LIMIT = 200;

function PropertiesPreview({ properties }: { properties: Record<string, unknown> | null }) {
  if (!properties || Object.keys(properties).length === 0) {
    return <span className="text-neutral-400">—</span>;
  }
  const entries = Object.entries(properties).slice(0, 2);
  const preview = entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
  const more = Object.keys(properties).length > 2 ? ` +${Object.keys(properties).length - 2}` : '';
  return (
    <span className="text-neutral-500 truncate max-w-xs inline-block">
      {preview}{more}
    </span>
  );
}

function EventRow({ event }: { event: Event }) {
  const [expanded, setExpanded] = useState(false);
  const identity = event.user_id ?? event.device_id ?? '—';
  const hasProps = event.properties && Object.keys(event.properties).length > 0;

  return (
    <>
      <tr
        data-testid="event-row"
        onClick={() => setExpanded(prev => !prev)}
        className={cn(
          'border-b border-neutral-300 transition-colors duration-150 cursor-pointer',
          'hover:bg-neutral-200',
          expanded && 'bg-neutral-200'
        )}
      >
        <td
          data-testid="cell-timestamp"
          className="px-4 py-3 text-sm font-medium text-neutral-900 whitespace-nowrap tabular-nums"
        >
          {formatDateTime(event.timestamp)}
        </td>
        <td data-testid="cell-event-name" className="px-4 py-3 text-sm font-medium text-neutral-900">
          {event.event}
        </td>
        <td data-testid="cell-identity" className="px-4 py-3 text-sm font-medium text-neutral-900">
          {identity}
        </td>
        <td data-testid="cell-properties" className="px-4 py-3 text-sm font-medium text-neutral-900">
          <PropertiesPreview properties={event.properties} />
        </td>
      </tr>
      {expanded && hasProps && (
        <tr className="border-b border-neutral-300 bg-neutral-100">
          <td colSpan={4} className="px-6 py-3">
            <div
              data-testid="event-properties-detail"
              className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3 lg:grid-cols-4"
            >
              {Object.entries(event.properties!).map(([key, value]) => (
                <div key={key} data-testid="property-kv" className="flex gap-2 min-w-0">
                  <span className="text-sm font-bold text-neutral-500 shrink-0">{key}:</span>
                  <span className="text-sm font-medium text-neutral-900 truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
      {expanded && !hasProps && (
        <tr className="border-b border-neutral-300 bg-neutral-100">
          <td colSpan={4} className="px-6 py-3">
            <div data-testid="event-properties-detail">
              <span className="text-sm font-bold text-neutral-500">No properties</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function LoadingRows() {
  return (
    <tr data-testid="events-loading">
      <td colSpan={4} className="px-4 py-3">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-neutral-200" />
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Event name filter auto-applies immediately on change
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [appliedEventName, setAppliedEventName] = useState('');

  // Date filters use pending state and apply on button click
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Load event name options
  useEffect(() => {
    getEventNames().then(setEventNames).catch(() => {/* silently ignore */});
  }, []);

  const fetchEvents = useCallback(async (currentOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        limit: String(LIMIT),
        offset: String(currentOffset),
      };
      if (appliedEventName) params.event_name = appliedEventName;
      if (appliedStartDate) params.start_date = appliedStartDate;
      if (appliedEndDate) params.end_date = appliedEndDate;

      const result = await getEvents(params);
      setEvents(result.events);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [appliedEventName, appliedStartDate, appliedEndDate]);

  // Fetch when applied filters or offset change
  useEffect(() => {
    fetchEvents(offset);
  }, [fetchEvents, offset]);

  function handleEventNameChange(value: string) {
    setAppliedEventName(value);
    setOffset(0);
  }

  function handleApply() {
    setAppliedStartDate(pendingStartDate);
    setAppliedEndDate(pendingEndDate);
    setOffset(0);
  }

  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const canPrev = offset > 0;
  const canNext = offset + LIMIT < total;

  return (
    <div>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Events</h1>

      {/* Controls */}
      <Card className="mb-6 bg-neutral-50 border-neutral-300">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          {/* Event name filter */}
          <select
            data-testid="filter-event-name"
            value={appliedEventName}
            onChange={e => handleEventNameChange(e.target.value)}
            className={cn(
              'flex h-9 items-center rounded border bg-white px-3 py-2 text-sm font-medium',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'w-52 border-neutral-300 text-neutral-900'
            )}
          >
            <option value="">All Events</option>
            {eventNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {/* Date range */}
          <input
            data-testid="filter-start-date"
            type="date"
            value={pendingStartDate}
            onChange={e => setPendingStartDate(e.target.value)}
            className={cn(
              'flex h-9 rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          <input
            data-testid="filter-end-date"
            type="date"
            value={pendingEndDate}
            onChange={e => setPendingEndDate(e.target.value)}
            className={cn(
              'flex h-9 rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />

          <Button
            data-testid="filter-apply"
            variant="default"
            onClick={handleApply}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-neutral-200 border border-neutral-900 p-4">
          <p className="text-sm font-bold text-neutral-900">Failed to load events</p>
          <p className="text-sm font-medium text-neutral-600 mt-1">Please try again</p>
        </div>
      )}

      {/* Table card */}
      <Card className="bg-neutral-50 border-neutral-300">
        <div className="overflow-x-auto">
          <table data-testid="events-table" className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-300">
                <th
                  data-testid="col-timestamp"
                  className="px-4 py-3 text-left text-sm font-bold text-neutral-500 whitespace-nowrap"
                >
                  Timestamp
                </th>
                <th
                  data-testid="col-event-name"
                  className="px-4 py-3 text-left text-sm font-bold text-neutral-500"
                >
                  Event
                </th>
                <th
                  data-testid="col-identity"
                  className="px-4 py-3 text-left text-sm font-bold text-neutral-500"
                >
                  User
                </th>
                <th
                  data-testid="col-properties"
                  className="px-4 py-3 text-left text-sm font-bold text-neutral-500"
                >
                  Properties
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRows />
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div
                      data-testid="events-empty-state"
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <Activity className="h-12 w-12 text-neutral-300 mb-4" aria-hidden="true" />
                      <p className="text-sm font-bold text-neutral-600 mb-1">No events found</p>
                      <p className="text-sm font-bold text-neutral-500">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map(event => <EventRow key={event.id} event={event} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-300">
            <span className="text-sm font-bold text-neutral-500">
              {total === 0 ? '0 events' : `${formatNumber(offset + 1)}–${formatNumber(Math.min(offset + LIMIT, total))} of ${formatNumber(total)}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                data-testid="pagination-prev"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setOffset(prev => Math.max(0, prev - LIMIT))}
                className="border-neutral-300 text-neutral-900 hover:bg-neutral-200 disabled:opacity-40"
              >
                ← Prev
              </Button>
              <span className="text-sm font-medium text-neutral-900 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <Button
                data-testid="pagination-next"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setOffset(prev => prev + LIMIT)}
                className="border-neutral-300 text-neutral-900 hover:bg-neutral-200 disabled:opacity-40"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}
