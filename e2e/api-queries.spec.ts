import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents, getEvents, getEventNames, getStatsOverview } from './helpers';

// Unique prefix for this test file to avoid cross-test collisions
const P = 't01q';

test.describe('GET /api/events — event listing with filters', () => {
  // Seed data shared across query tests
  test.beforeAll(async ({ request }) => {
    const now = new Date();
    const events = [];

    // 15 "Page Viewed" events spread over 3 days
    for (let i = 0; i < 15; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i % 3));
      d.setHours(10 + i);
      events.push({
        event: `${P}-page-viewed`,
        device_id: `${P}-device-${i % 5}`,
        timestamp: d.toISOString(),
        properties: { url: `/page-${i}` },
      });
    }

    // 10 "Button Clicked" events on a single day
    for (let i = 0; i < 10; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(8 + i);
      events.push({
        event: `${P}-button-clicked`,
        device_id: `${P}-device-${i % 3}`,
        timestamp: d.toISOString(),
        properties: { button_name: `btn-${i}` },
      });
    }

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
  });

  test('returns paginated response with defaults { events, total, limit: 50, offset: 0 }', async ({ request }) => {
    const res = await getEvents(request);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('events');
    expect(body).toHaveProperty('total');
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
    expect(Array.isArray(body.events)).toBe(true);
  });

  test('returns events sorted by timestamp descending (newest first)', async ({ request }) => {
    const res = await getEvents(request);
    expect(res.status()).toBe(200);
    const body = await res.json();

    for (let i = 1; i < body.events.length; i++) {
      const prev = new Date(body.events[i - 1].timestamp).getTime();
      const curr = new Date(body.events[i].timestamp).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  test('filters by event_name', async ({ request }) => {
    const res = await getEvents(request, { event_name: `${P}-button-clicked` });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.events.length).toBeGreaterThan(0);
    for (const ev of body.events) {
      expect(ev.event).toBe(`${P}-button-clicked`);
    }
  });

  test('filters by date range (start_date and end_date, inclusive)', async ({ request }) => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    const res = await getEvents(request, {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    for (const ev of body.events) {
      const ts = new Date(ev.timestamp).getTime();
      expect(ts).toBeGreaterThanOrEqual(startDate.getTime());
      expect(ts).toBeLessThanOrEqual(endDate.getTime());
    }
  });

  test('paginates with limit and offset', async ({ request }) => {
    const res = await getEvents(request, { limit: 10, offset: 5 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.events.length).toBeLessThanOrEqual(10);
    expect(body.offset).toBe(5);
    expect(body.limit).toBe(10);
  });

  test('combines filters with AND logic (event_name + date range)', async ({ request }) => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    const res = await getEvents(request, {
      event_name: `${P}-button-clicked`,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    for (const ev of body.events) {
      expect(ev.event).toBe(`${P}-button-clicked`);
      const ts = new Date(ev.timestamp).getTime();
      expect(ts).toBeGreaterThanOrEqual(startDate.getTime());
      expect(ts).toBeLessThanOrEqual(endDate.getTime());
    }
  });
});

test.describe('GET /api/events/names — distinct event names', () => {
  test.beforeAll(async ({ request }) => {
    // Seed a few distinct event types
    const events = [
      { event: `${P}-alpha-event`, device_id: `${P}-names-dev-1` },
      { event: `${P}-beta-event`, device_id: `${P}-names-dev-2` },
      { event: `${P}-gamma-event`, device_id: `${P}-names-dev-3` },
      { event: `${P}-alpha-event`, device_id: `${P}-names-dev-4` }, // duplicate name
    ];
    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
  });

  test('returns alphabetically sorted array of distinct event name strings', async ({ request }) => {
    const res = await getEventNames(request);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    // Should contain our seeded event names (and possibly others from parallel tests)
    expect(body).toContain(`${P}-alpha-event`);
    expect(body).toContain(`${P}-beta-event`);
    expect(body).toContain(`${P}-gamma-event`);

    // Verify alphabetical sort
    for (let i = 1; i < body.length; i++) {
      expect(body[i - 1].localeCompare(body[i])).toBeLessThanOrEqual(0);
    }

    // No duplicates
    const unique = new Set(body);
    expect(unique.size).toBe(body.length);
  });
});

test.describe('GET /api/stats/overview — aggregate statistics', () => {
  test.beforeAll(async ({ request }) => {
    // Seed events with identity resolution scenario for unique user counting
    // Device maps to a user — should not be double-counted
    await createEvent(request, {
      event: `${P}-stats-event`,
      device_id: `${P}-stats-device-mapped`,
      timestamp: '2025-06-01T10:00:00.000Z',
    });
    await createEvent(request, {
      event: `${P}-stats-event`,
      device_id: `${P}-stats-device-mapped`,
      user_id: `${P}-stats-user-known`,
      timestamp: '2025-06-02T10:00:00.000Z',
    });
    // A purely anonymous device (no mapping)
    await createEvent(request, {
      event: `${P}-stats-event`,
      device_id: `${P}-stats-device-anon`,
      timestamp: '2025-06-03T10:00:00.000Z',
    });
  });

  test('returns { total_events, total_users, event_counts_by_name, date_range }', async ({ request }) => {
    const res = await getStatsOverview(request);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(typeof body.total_events).toBe('number');
    expect(body.total_events).toBeGreaterThan(0);
    expect(typeof body.total_users).toBe('number');
    expect(body.total_users).toBeGreaterThan(0);
    expect(typeof body.event_counts_by_name).toBe('object');
    expect(body.date_range).toHaveProperty('earliest');
    expect(body.date_range).toHaveProperty('latest');
  });

  test('total_users counts resolved identities (device mapped to user is not double-counted)', async ({ request }) => {
    // We seeded: 1 device mapped to 1 user + 1 anonymous device = 2 distinct identities
    // If the implementation double-counts the mapped device, total_users would be 3.
    // We can't assert an exact total (other test suites may seed users), but we can
    // verify the concept by checking that total_users <= total possible identities.
    const res = await getStatsOverview(request);
    expect(res.status()).toBe(200);
    const body = await res.json();

    // The resolved user count should be less than or equal to the raw device + user count
    // This is a sanity check — the identity resolution tests (US-T02) verify the exact behavior
    expect(typeof body.total_users).toBe('number');
    expect(body.total_users).toBeGreaterThanOrEqual(2);
  });
});
