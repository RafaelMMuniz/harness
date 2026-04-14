const API_BASE = '/api'

export async function fetchEvents(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/events?${qs}`)
  if (!res.ok) throw new Error((await res.json()).error || res.statusText)
  return res.json()
}

export async function fetchEventNames(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/events/names`)
  if (!res.ok) throw new Error('Failed to fetch event names')
  return res.json()
}

export async function fetchStatsOverview() {
  const res = await fetch(`${API_BASE}/stats/overview`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchTrends(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/trends?${qs}`)
  if (!res.ok) throw new Error((await res.json()).error || res.statusText)
  return res.json()
}

export async function fetchFunnelAnalysis(body: { steps: string[]; start_date: string; end_date: string }) {
  const res = await fetch(`${API_BASE}/funnels/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.json()).error || res.statusText)
  return res.json()
}

export async function fetchUserProfile(id: string) {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Failed to fetch user')
  }
  return res.json()
}

export async function fetchUserEvents(userId: string) {
  const qs = new URLSearchParams({ user_id: userId, limit: '100', offset: '0' }).toString()
  const res = await fetch(`${API_BASE}/events?${qs}`)
  if (!res.ok) throw new Error('Failed to fetch user events')
  return res.json()
}

export async function fetchEventProperties(eventName: string) {
  const res = await fetch(`${API_BASE}/events/${encodeURIComponent(eventName)}/properties`)
  if (!res.ok) throw new Error('Failed to fetch properties')
  return res.json()
}

export async function fetchSavedAnalyses() {
  const res = await fetch(`${API_BASE}/saved-analyses`)
  if (!res.ok) throw new Error('Failed to fetch saved analyses')
  return res.json()
}

export async function saveAnalysis(body: { name: string; type: 'trend' | 'funnel'; config: object }) {
  const res = await fetch(`${API_BASE}/saved-analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to save analysis')
  return res.json()
}

export async function deleteSavedAnalysis(id: number) {
  const res = await fetch(`${API_BASE}/saved-analyses/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}
