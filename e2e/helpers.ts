import type { APIRequestContext, APIResponse } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

// --- Types ---

export interface EventPayload {
  event: string;
  device_id?: string;
  user_id?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
}

export interface EventFilters {
  event_name?: string;
  user_id?: string;
  device_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// --- Helpers ---

export async function createEvent(
  request: APIRequestContext,
  payload: EventPayload,
): Promise<APIResponse> {
  return request.post(`${API_BASE}/api/events`, { data: payload });
}

export async function createBatchEvents(
  request: APIRequestContext,
  events: EventPayload[],
): Promise<APIResponse> {
  return request.post(`${API_BASE}/api/events/batch`, { data: { events } });
}

export async function getEvents(
  request: APIRequestContext,
  filters?: EventFilters,
): Promise<APIResponse> {
  const params = new URLSearchParams();
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
  }
  const qs = params.toString();
  const url = qs ? `${API_BASE}/api/events?${qs}` : `${API_BASE}/api/events`;
  return request.get(url);
}

export async function getEventNames(
  request: APIRequestContext,
): Promise<APIResponse> {
  return request.get(`${API_BASE}/api/events/names`);
}

export async function getStatsOverview(
  request: APIRequestContext,
): Promise<APIResponse> {
  return request.get(`${API_BASE}/api/stats/overview`);
}

export async function getUserProfile(
  request: APIRequestContext,
  id: string,
): Promise<APIResponse> {
  return request.get(`${API_BASE}/api/users/${encodeURIComponent(id)}`);
}
