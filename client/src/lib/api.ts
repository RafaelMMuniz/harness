const API_BASE = '';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface EventRecord {
  id: number;
  event_name: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: Record<string, unknown> | null;
}

export interface EventsResponse {
  events: EventRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface StatsOverview {
  total_events: number;
  total_users: number;
  event_counts_by_name: Record<string, number>;
  date_range: { earliest: string; latest: string };
}

export interface UserProfile {
  user_id: string;
  device_ids: string[];
  total_events: number;
  first_seen: string;
  last_seen: string;
  events: EventRecord[];
}

export interface TrendPoint {
  date: string;
  total_count: number;
  unique_users: number;
  [key: string]: unknown;
}

export interface TrendsResponse {
  data?: TrendPoint[];
  series?: Array<{ key: string; data: TrendPoint[] }>;
}

export interface FunnelStep {
  event_name: string;
  count: number;
  conversion_rate: number;
  drop_off: number;
}

export interface FunnelResponse {
  steps: FunnelStep[];
  overall_conversion_rate: number;
}

export interface SavedAnalysis {
  id: number;
  name: string;
  type: string;
  config: object;
  created_at: string;
  updated_at: string;
}

export async function fetchEvents(params?: Record<string, string>): Promise<EventsResponse> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<EventsResponse>(`/api/events${query}`);
}

export async function fetchEventNames(): Promise<string[]> {
  return request<string[]>('/api/events/names');
}

export async function fetchStatsOverview(): Promise<StatsOverview> {
  return request<StatsOverview>('/api/stats/overview');
}

export async function fetchUserProfile(id: string): Promise<UserProfile> {
  return request<UserProfile>(`/api/users/${encodeURIComponent(id)}`);
}

export async function fetchTrends(params: Record<string, string>): Promise<TrendsResponse> {
  const query = new URLSearchParams(params).toString();
  return request<TrendsResponse>(`/api/trends?${query}`);
}

export async function fetchEventProperties(eventName: string): Promise<string[]> {
  const raw = await request<Array<{ name: string; type: string; sample_values: unknown[] }>>(
    `/api/events/${encodeURIComponent(eventName)}/properties`
  );
  return raw.map((p) => p.name);
}

export async function fetchFunnelQuery(body: {
  steps: string[];
  start_date: string;
  end_date: string;
}): Promise<FunnelResponse> {
  return request<FunnelResponse>('/api/funnels/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchSavedAnalyses(): Promise<SavedAnalysis[]> {
  return request<SavedAnalysis[]>('/api/saved-analyses');
}

export async function createSavedAnalysis(data: {
  name: string;
  type: string;
  config: object;
}): Promise<SavedAnalysis> {
  return request<SavedAnalysis>('/api/saved-analyses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteSavedAnalysis(id: number): Promise<void> {
  await fetch(`${API_BASE}/api/saved-analyses/${id}`, { method: 'DELETE' });
}
