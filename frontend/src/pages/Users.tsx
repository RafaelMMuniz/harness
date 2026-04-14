import { useState } from 'react'
import { fetchUserProfile, fetchUserEvents } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, User, Smartphone } from 'lucide-react'

interface UserProfile {
  user_id: string | null
  device_ids: string[]
  first_seen: string | null
  last_seen: string | null
}

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

export function UsersPage() {
  const [searchId, setSearchId] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [searched, setSearched] = useState(false)
  const [visibleCount, setVisibleCount] = useState(100)

  const handleSearch = async () => {
    const id = searchId.trim()
    if (!id) return

    setLoading(true)
    setError(null)
    setNotFound(false)
    setSearched(true)
    setProfile(null)
    setEvents([])
    setVisibleCount(100)

    try {
      const profileData = await fetchUserProfile(id)
      if (!profileData) {
        setNotFound(true)
        return
      }
      setProfile(profileData)

      const eventsData = await fetchUserEvents(id)
      const eventList: EventRecord[] = Array.isArray(eventsData) ? eventsData : eventsData.events || []
      // Sort chronologically (oldest first) for timeline display
      eventList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      setEvents(eventList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search for user')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const visibleEvents = events.slice(0, visibleCount)
  const hasMoreEvents = events.length > visibleCount

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Users</h1>

      <div className="flex items-center gap-3 mb-8 max-w-lg">
        <Input
          placeholder="Enter a user ID or device ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={loading || !searchId.trim()}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Looking up user...</span>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && !searched && (
        <div className="text-center py-20 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">User Lookup</p>
          <p className="text-sm">Enter a user ID or device ID to look up their activity.</p>
        </div>
      )}

      {!loading && notFound && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No user found</p>
          <p className="text-sm">No user found with the ID "{searchId}".</p>
        </div>
      )}

      {!loading && profile && (
        <div className="space-y-6">
          {/* Identity Cluster */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identity Cluster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.user_id && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">User ID (primary)</p>
                      <p className="font-mono text-sm">{profile.user_id}</p>
                    </div>
                  </div>
                )}

                {profile.device_ids.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Linked Devices ({profile.device_ids.length})
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.device_ids.map((did) => (
                          <Badge key={did} variant="outline" className="font-mono text-xs">
                            {did}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-8 pt-2 border-t">
                  {profile.first_seen && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">First seen</p>
                      <p className="text-sm">{formatTimestamp(profile.first_seen)}</p>
                    </div>
                  )}
                  {profile.last_seen && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Last seen</p>
                      <p className="text-sm">{formatTimestamp(profile.last_seen)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Event Timeline ({events.length} event{events.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events found for this user.</p>
              ) : (
                <div className="space-y-0">
                  {visibleEvents.map((evt) => {
                    const isAnonymous = evt.device_id && !evt.user_id
                    const sourceIdentity = evt.device_id
                      ? `via ${evt.device_id}`
                      : evt.user_id || ''

                    return (
                      <div
                        key={evt.id}
                        className="flex gap-4 py-3 border-b last:border-b-0"
                      >
                        <div className="w-40 flex-shrink-0">
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(evt.timestamp)}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{evt.event_name}</Badge>
                            {isAnonymous && profile.user_id && (
                              <Badge variant="outline" className="text-xs">
                                merged
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground font-mono">
                              {sourceIdentity}
                            </span>
                          </div>
                          {evt.properties && Object.keys(evt.properties).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                              {Object.entries(evt.properties).map(([k, v]) => (
                                <span key={k} className="text-xs text-muted-foreground">
                                  <span className="font-medium">{k}:</span> {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {hasMoreEvents && (
                    <div className="pt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleCount((c) => c + 100)}
                      >
                        Load more ({events.length - visibleCount} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
