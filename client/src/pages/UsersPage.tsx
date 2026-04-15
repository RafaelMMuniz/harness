import { useState, type FormEvent } from 'react';
import { fetchUserProfile, type UserProfile, type EventRecord } from '../lib/api';

const EVENTS_PER_PAGE = 20;

export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    setVisibleCount(EVENTS_PER_PAGE);

    try {
      const data = await fetchUserProfile(trimmed);
      setProfile(data);
    } catch {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  // Sort events chronologically (oldest first)
  const sortedEvents = profile
    ? [...profile.events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  const visibleEvents = sortedEvents.slice(0, visibleCount);
  const hasMore = visibleCount < sortedEvents.length;

  // Determine which events are "pre-merge" anonymous events:
  // events that have a device_id but no user_id set on the event itself
  const isAnonymousEvent = (event: EventRecord): boolean => {
    return !event.user_id && !!event.device_id;
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Users</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-8">
        <input
          data-testid="user-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by user ID or device ID..."
          className="flex-1 max-w-md rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <button
          data-testid="user-search-button"
          type="submit"
          className="rounded bg-neutral-900 px-5 py-2 text-sm font-bold text-neutral-100 hover:bg-neutral-800 transition-colors"
        >
          Go
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div data-testid="loading" className="animate-pulse space-y-3">
          <div className="h-8 w-48 rounded bg-neutral-200" />
          <div className="h-4 w-64 rounded bg-neutral-200" />
          <div className="h-4 w-56 rounded bg-neutral-200" />
        </div>
      )}

      {/* Error / not found */}
      {error && !loading && (
        <div className="text-sm font-bold text-neutral-500 py-8">
          {error}
        </div>
      )}

      {/* Profile */}
      {profile && !loading && (
        <div className="space-y-8">
          {/* Identity cluster card */}
          <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-6">
            <h2 className="text-2xl font-black text-neutral-900 mb-4">
              {profile.user_id}
            </h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 max-w-lg">
              <div>
                <span className="text-sm font-bold text-neutral-500">
                  Device IDs
                </span>
                <div className="mt-1 space-y-1">
                  {profile.device_ids.length > 0 ? (
                    profile.device_ids.map((did) => (
                      <div
                        key={did}
                        className="text-sm font-medium text-neutral-900"
                      >
                        {did}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm font-medium text-neutral-500">
                      None
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-bold text-neutral-500">
                    First Seen
                  </span>
                  <div className="text-sm font-medium text-neutral-900">
                    {formatTimestamp(profile.first_seen)}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-bold text-neutral-500">
                    Last Seen
                  </span>
                  <div className="text-sm font-medium text-neutral-900">
                    {formatTimestamp(profile.last_seen)}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-bold text-neutral-500">
                    Total Events
                  </span>
                  <div className="text-sm font-medium text-neutral-900 tabular-nums">
                    {profile.total_events}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event timeline */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-4">
              Event Timeline
            </h3>
            <div className="space-y-0">
              {visibleEvents.map((event, i) => (
                <div
                  key={`${event.id}-${i}`}
                  className="relative border-l-2 border-neutral-300 pl-6 pb-6 last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-neutral-400" />

                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-sm font-medium text-neutral-500 tabular-nums whitespace-nowrap">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span className="text-sm font-bold text-neutral-900">
                      {event.event_name}
                    </span>
                    {isAnonymousEvent(event) && (
                      <span
                        data-testid="merged-badge"
                        className="inline-flex items-center rounded border border-neutral-300 px-2 py-0.5 text-xs font-bold text-neutral-500"
                      >
                        anonymous
                      </span>
                    )}
                  </div>

                  {/* Properties */}
                  {event.properties &&
                    Object.keys(event.properties).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                        {Object.entries(event.properties).map(([key, val]) => (
                          <div key={key} className="flex gap-1">
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
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-4">
                <button
                  data-testid="load-more"
                  onClick={() =>
                    setVisibleCount((c) => c + EVENTS_PER_PAGE)
                  }
                  className="rounded border border-neutral-900 px-4 py-1.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
