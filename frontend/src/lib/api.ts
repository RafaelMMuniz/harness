const BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Event {
  id: string;
  event: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: Record<string, unknown> | null;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
}

export interface StatsOverview {
  total_events: number;
  total_users: number;
  event_counts_by_name: Record<string, number>;
  date_range: { earliest: string | null; latest: string | null };
}

export interface TrendBucket {
  date: string;
  total_count?: number;
  unique_users?: number;
  value?: number | null;
}

export interface TrendSeries {
  key: string;
  data: TrendBucket[];
}

export interface TrendsResponse {
  event_name: string;
  granularity: string;
  start_date: string;
  end_date: string;
  data?: TrendBucket[];
  series?: TrendSeries[];
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

export interface PropertyDescriptor {
  name: string;
  type: 'string' | 'number' | 'boolean';
  sample_values: (string | number | boolean)[];
}

export interface UserProfile {
  user_id: string;
  device_ids: string[];
  total_events: number;
  first_seen: string | null;
  last_seen: string | null;
  events: Event[];
}

export interface SavedAnalysis {
  id: string;
  name: string;
  type: 'trend' | 'funnel';
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Events
export function getEvents(params?: Record<string, string>): Promise<EventsResponse> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchJSON(`/events${query}`);
}

export function getEventNames(): Promise<string[]> {
  return fetchJSON('/events/names');
}

export function getStatsOverview(): Promise<StatsOverview> {
  return fetchJSON('/stats/overview');
}

// Trends
export function getTrends(params: Record<string, string>): Promise<TrendsResponse> {
  const query = '?' + new URLSearchParams(params).toString();
  return fetchJSON(`/trends${query}`);
}

// Properties
export function getEventProperties(eventName: string): Promise<PropertyDescriptor[]> {
  return fetchJSON(`/events/${encodeURIComponent(eventName)}/properties`);
}

// Funnels
export function queryFunnel(body: { steps: Array<{ event_name: string }>; start_date?: string; end_date?: string }): Promise<FunnelResponse> {
  return fetchJSON('/funnels/query', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Users
export function getUserProfile(id: string): Promise<UserProfile> {
  return fetchJSON(`/users/${encodeURIComponent(id)}`);
}

// Saved Analyses
export function getSavedAnalyses(): Promise<SavedAnalysis[]> {
  return fetchJSON('/saved-analyses');
}

export function getSavedAnalysis(id: string): Promise<SavedAnalysis> {
  return fetchJSON(`/saved-analyses/${id}`);
}

export function createSavedAnalysis(data: { name: string; type: 'trend' | 'funnel'; config: Record<string, unknown> }): Promise<SavedAnalysis> {
  return fetchJSON('/saved-analyses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteSavedAnalysis(id: string): Promise<void> {
  return fetchJSON(`/saved-analyses/${id}`, { method: 'DELETE' });
}
