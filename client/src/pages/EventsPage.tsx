import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchEvents, fetchEventNames, type EventRecord } from '../lib/api';
import { Select } from '../components/Select';
import { Skeleton } from '../components/Skeleton';

const PAGE_SIZE = 50;

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const eventNameFilter = searchParams.get('event_name') ?? '';
  const startDate = searchParams.get('start_date') ?? '';
  const endDate = searchParams.get('end_date') ?? '';

  // Load event names for filter dropdown
  useEffect(() => {
    fetchEventNames()
      .then(setEventNames)
      .catch(() => {});
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (eventNameFilter) params.event_name = eventNameFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await fetchEvents(params);
      setEvents(data.events);
      setTotal(data.total);
    } catch {
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [eventNameFilter, startDate, endDate, offset]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [eventNameFilter, startDate, endDate]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const nameOptions = [
    { value: '', label: 'All Events' },
    ...eventNames.map((n) => ({ value: n, label: n })),
  ];

  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const formatProperties = (props: Record<string, unknown> | null) => {
    if (!props || Object.keys(props).length === 0) return '--';
    const entries = Object.entries(props);
    return entries
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ')
      + (entries.length > 3 ? ` (+${entries.length - 3})` : '');
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Events</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select
          value={eventNameFilter}
          onChange={(v) => updateFilter('event_name', v)}
          options={nameOptions}
          placeholder="All Events"
          data-testid="event-name-filter"
        />

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-neutral-600">From</label>
          <input
            type="date"
            data-testid="start-date"
            value={startDate}
            onChange={(e) => updateFilter('start_date', e.target.value)}
            className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-neutral-600">To</label>
          <input
            type="date"
            data-testid="end-date"
            value={endDate}
            onChange={(e) => updateFilter('end_date', e.target.value)}
            className="rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div data-testid="loading" className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div
          data-testid="empty-state"
          className="flex flex-col items-center justify-center py-16 text-sm font-bold text-neutral-500"
        >
          No events found
        </div>
      )}

      {/* Table */}
      {!loading && events.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-300 bg-neutral-50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100">
                  <th className="px-4 py-3 text-left text-sm font-bold text-neutral-900">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-neutral-900">
                    Event Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-neutral-900">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-neutral-900">
                    Properties
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr
                      onClick={() =>
                        setExpandedId(expandedId === event.id ? null : event.id)
                      }
                      className="border-b border-neutral-200 cursor-pointer hover:bg-neutral-200 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-sm font-medium text-neutral-900 tabular-nums whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-neutral-900">
                        {event.event_name}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-neutral-900">
                        {event.user_id ?? event.device_id ?? '--'}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-neutral-600 max-w-xs truncate">
                        {formatProperties(event.properties)}
                      </td>
                    </tr>
                    {expandedId === event.id && (
                      <tr>
                        <td
                          colSpan={4}
                          className="bg-neutral-100 px-4 py-4"
                          data-testid="event-details"
                        >
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-xl">
                            {event.properties &&
                              Object.entries(event.properties).map(([key, val]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-sm font-bold text-neutral-500">
                                    {key}:
                                  </span>
                                  <span className="text-sm font-medium text-neutral-900">
                                    {typeof val === 'object'
                                      ? JSON.stringify(val)
                                      : String(val)}
                                  </span>
                                </div>
                              ))}
                            {(!event.properties ||
                              Object.keys(event.properties).length === 0) && (
                              <span className="text-sm font-bold text-neutral-500">
                                No properties
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm font-bold text-neutral-500">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
              {total}
            </span>
            <div className="flex gap-2">
              <button
                data-testid="prev-page"
                disabled={!hasPrev}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                className="rounded border border-neutral-900 px-4 py-1.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                data-testid="next-page"
                disabled={!hasNext}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="rounded border border-neutral-900 px-4 py-1.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
