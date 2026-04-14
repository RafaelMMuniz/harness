import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { getUserProfile, type UserProfile, type Event } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 100;

function EventTimelineItem({ event }: { event: Event }) {
  const isAnonymous = !event.user_id && !!event.device_id;
  const source = event.device_id ?? null;

  return (
    <div
      data-testid="profile-event-row"
      className="border-b border-neutral-300 last:border-0"
    >
      <div
        data-testid="timeline-event"
        className="flex gap-4 py-3"
      >
        {/* Timeline spine */}
        <div className="flex flex-col items-center pt-0.5 shrink-0">
          <div className={cn(
            'h-2.5 w-2.5 rounded-full border-2',
            isAnonymous
              ? 'border-neutral-400 bg-neutral-100'
              : 'border-neutral-900 bg-neutral-900'
          )} />
          <div className="w-px flex-1 bg-neutral-300 mt-1" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
            <span data-testid="profile-event-timestamp">
              <span
                data-testid="event-timestamp"
                className="text-sm font-medium text-neutral-500 tabular-nums whitespace-nowrap shrink-0"
              >
                {formatDateTime(event.timestamp)}
              </span>
            </span>
            <span
              data-testid="event-name"
              className="text-sm font-bold text-neutral-900"
            >
              {event.event}
            </span>
            <span className="flex items-center gap-1.5">
              {isAnonymous && (
                <Badge
                  data-testid="profile-event-anonymous-badge"
                  variant="secondary"
                  className="bg-neutral-200 text-neutral-600 text-xs"
                >
                  anonymous
                </Badge>
              )}
              {source && (
                <span
                  data-testid="profile-event-source"
                  className="text-sm font-medium text-neutral-500"
                >
                  via {source}
                </span>
              )}
              {!source && (
                <span
                  data-testid="profile-event-source"
                  className="text-sm font-medium text-neutral-500"
                >
                  direct
                </span>
              )}
            </span>
          </div>

          {/* Properties */}
          {event.properties && Object.keys(event.properties).length > 0 && (
            <div
              data-testid="event-properties"
              className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1"
            >
              {Object.entries(event.properties).map(([key, value]) => (
                <span key={key} className="text-sm font-medium text-neutral-600">
                  <span className="text-neutral-500">{key}:</span>{' '}
                  {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-neutral-50 border-neutral-300">
        <CardHeader>
          <Skeleton className="h-5 w-40 bg-neutral-200" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full bg-neutral-200" />
          ))}
        </CardContent>
      </Card>
      <Card className="bg-neutral-50 border-neutral-300">
        <CardHeader>
          <Skeleton className="h-5 w-32 bg-neutral-200" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-neutral-200" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  const { userId: urlUserId } = useParams();
  const [searchInput, setSearchInput] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadProfile = useCallback(async (id: string) => {
    setLoading(true);
    setProfile(null);
    setSearched(true);
    setVisibleCount(PAGE_SIZE);
    try {
      const result = await getUserProfile(id);
      setProfile(result);
    } catch {
      // 404 or other error — show empty state (profile stays null, searched is true)
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load profile from URL param
  useEffect(() => {
    if (urlUserId) {
      setSearchInput(urlUserId);
      loadProfile(urlUserId);
    }
  }, [urlUserId, loadProfile]);

  async function handleSearch() {
    const id = searchInput.trim();
    if (!id) return;
    loadProfile(id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  // Chronological order: oldest first
  const chronologicalEvents = profile
    ? [...profile.events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  const visibleEvents = chronologicalEvents.slice(0, visibleCount);
  const hasMore = visibleCount < chronologicalEvents.length;

  return (
    <div>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Users</h1>

      {/* Search card */}
      <Card className="mb-6 bg-neutral-50 border-neutral-300">
        <CardContent className="flex items-center gap-3 p-4">
          <Input
            data-testid="user-search-input"
            placeholder="Search by user ID or device ID..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-neutral-300 text-neutral-900 placeholder:text-neutral-500 max-w-md"
          />
          <Button
            data-testid="user-search-button"
            variant="default"
            onClick={handleSearch}
            disabled={loading || !searchInput.trim()}
          >
            Go
          </Button>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && <ProfileSkeleton />}

      {/* Empty state — searched but no result */}
      {!loading && searched && !profile && (
        <div
          data-testid="user-empty-state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Users className="h-12 w-12 text-neutral-300 mb-4" aria-hidden="true" />
          <p className="text-sm font-bold text-neutral-600 mb-1">No user found</p>
          <p className="text-sm font-bold text-neutral-500">Try a different ID</p>
        </div>
      )}

      {/* Initial (not yet searched) empty state */}
      {!loading && !searched && (
        <div
          data-testid="user-empty-state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Users className="h-12 w-12 text-neutral-300 mb-4" aria-hidden="true" />
          <p className="text-sm font-bold text-neutral-600 mb-1">Search for a user</p>
          <p className="text-sm font-bold text-neutral-500">Enter a user ID or device ID above</p>
        </div>
      )}

      {/* Profile results */}
      {!loading && profile && (
        <div className="space-y-6">
          {/* Identity Cluster */}
          <Card className="bg-neutral-50 border-neutral-300" data-testid="identity-cluster">
            <CardHeader>
              <CardTitle data-testid="user-profile-heading">
                User: {profile.user_id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 items-start">
                {/* Device IDs */}
                <span className="text-sm font-bold text-neutral-500 pt-0.5">Devices</span>
                <div data-testid="user-device-list" className="flex flex-wrap gap-1.5">
                  {profile.device_ids.length > 0 ? (
                    profile.device_ids.map(deviceId => (
                      <Badge
                        key={deviceId}
                        variant="secondary"
                        className="bg-neutral-200 text-neutral-900 font-medium"
                      >
                        {deviceId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-neutral-400">None</span>
                  )}
                </div>

                {/* First seen */}
                <span className="text-sm font-bold text-neutral-500">First seen</span>
                <span className="text-sm font-medium text-neutral-900 tabular-nums">
                  {profile.first_seen ? formatDateTime(profile.first_seen) : '—'}
                </span>

                {/* Last seen */}
                <span className="text-sm font-bold text-neutral-500">Last seen</span>
                <span className="text-sm font-medium text-neutral-900 tabular-nums">
                  {profile.last_seen ? formatDateTime(profile.last_seen) : '—'}
                </span>

                {/* Total events */}
                <span className="text-sm font-bold text-neutral-500">Events</span>
                <span className="text-sm font-medium text-neutral-900 tabular-nums">
                  {profile.total_events.toLocaleString('en-US')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card className="bg-neutral-50 border-neutral-300" data-testid="profile-event-timeline">
            <CardHeader>
              <CardTitle>
                Event Timeline
                <span className="ml-2 text-sm font-bold text-neutral-500">
                  (oldest → newest)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {chronologicalEvents.length === 0 ? (
                <p className="text-sm font-bold text-neutral-500 py-4 text-center">No events recorded</p>
              ) : (
                <>
                  <div
                    data-testid="user-event-timeline"
                    className="space-y-0"
                  >
                    {visibleEvents.map(event => (
                      <EventTimelineItem key={event.id} event={event} />
                    ))}
                  </div>

                  <div className="pt-4 flex justify-center border-t border-neutral-300 mt-2">
                    <Button
                      data-testid="profile-load-more"
                      variant="outline"
                      className={cn(
                        'border-neutral-300 text-neutral-900 hover:bg-neutral-200'
                      )}
                      onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                      disabled={!hasMore}
                    >
                      {hasMore
                        ? `Load more (${chronologicalEvents.length - visibleCount} remaining)`
                        : 'All events loaded'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
