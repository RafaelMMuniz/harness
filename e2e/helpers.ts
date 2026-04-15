import { APIRequestContext, APIResponse } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

// --- Event helpers ---

interface CreateEventParams {
  event: string;
  device_id?: string;
  user_id?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
}

export async function createEvent(
  request: APIRequestContext,
  params: CreateEventParams,
): Promise<APIResponse> {
  return request.post(`${API_BASE}/api/events`, { data: params });
}

export async function createBatchEvents(
  request: APIRequestContext,
  events: CreateEventParams[],
): Promise<APIResponse> {
  return request.post(`${API_BASE}/api/events/batch`, { data: { events } });
}

// --- Query helpers ---

interface GetEventsFilters {
  event_name?: string;
  user_id?: string;
  device_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export async function getEvents(
  request: APIRequestContext,
  filters?: GetEventsFilters,
): Promise<APIResponse> {
  const params = new URLSearchParams();
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
  }
  const query = params.toString();
  const url = query ? `${API_BASE}/api/events?${query}` : `${API_BASE}/api/events`;
  return request.get(url);
}

export async function getEventNames(
  request: APIRequestContext,
): Promise<APIResponse> {
  return request.get(`${API_BASE}/api/events/names`);
}

// --- Stats helpers ---

export async function getStatsOverview(
  request: APIRequestContext,
): Promise<APIResponse> {
  return request.get(`${API_BASE}/api/stats/overview`);
}

// --- User helpers ---

export async function getUserProfile(
  request: APIRequestContext,
  id: string,
): Promise<APIResponse> {
  return request.get(`${API_BASE}/api/users/${encodeURIComponent(id)}`);
}
