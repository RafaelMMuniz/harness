import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents, type EventPayload } from './helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

function trendsUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return `http://localhost:3001/api/trends?${qs}`;
}

// ---------------------------------------------------------------------------
// GET /api/trends — core shape
// ---------------------------------------------------------------------------

test.describe('GET /api/trends — response shape', () => {
  const EVENT = 'test-trends-shape-event';
  const DEVICE = 'test-trends-shape-device-1';

  test.beforeAll(async ({ request }) => {
    // Seed three events spread across three distinct days
    await createBatchEvents(request, [
      { event: EVENT, device_id: DEVICE, timestamp: isoDate(2) },
      { event: EVENT, device_id: DEVICE, timestamp: isoDate(1) },
      { event: EVENT, device_id: DEVICE, timestamp: isoDate(0) },
    ]);
  });

  test('valid event_name returns envelope with event_name, granularity, start_date, end_date, and data array', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.event_name).toBe(EVENT);
    expect(typeof body.granularity).toBe('string');
    expect(typeof body.start_date).toBe('string');
    expect(typeof body.end_date).toBe('string');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('each data bucket has date, total_count, and unique_users fields', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);

    for (const bucket of body.data) {
      expect(typeof bucket.date).toBe('string');
      expect(typeof bucket.total_count).toBe('number');
      expect(typeof bucket.unique_users).toBe('number');
    }
  });

  test('missing event_name returns 400', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/trends');

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/trends — granularity
// ---------------------------------------------------------------------------

test.describe('GET /api/trends — granularity', () => {
  const EVENT = 'test-trends-granularity-event';
  const DEVICE = 'test-trends-gran-device-1';

  test.beforeAll(async ({ request }) => {
    // Seed events spread over 14 days so both day and week produce multiple buckets
    const events: EventPayload[] = Array.from({ length: 14 }, (_, i) => ({
      event: EVENT,
      device_id: DEVICE,
      timestamp: isoDate(13 - i),
    }));
    await createBatchEvents(request, events);
  });

  test('granularity=day returns daily buckets (dates are consecutive calendar days)', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(1);

    // Consecutive buckets should differ by exactly one day
    for (let i = 1; i < body.data.length; i++) {
      const prev = new Date(body.data[i - 1].date).getTime();
      const curr = new Date(body.data[i].date).getTime();
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    }
  });

  test('granularity=week returns weekly buckets (dates differ by 7 days)', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'week' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);

    if (body.data.length > 1) {
      for (let i = 1; i < body.data.length; i++) {
        const prev = new Date(body.data[i - 1].date).getTime();
        const curr = new Date(body.data[i].date).getTime();
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(7);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/trends — zero-fill (no gaps in series)
// ---------------------------------------------------------------------------

test.describe('GET /api/trends — zero-filled buckets', () => {
  const EVENT = 'test-trends-zerofill-event';
  const DEVICE = 'test-trends-zerofill-device-1';

  test.beforeAll(async ({ request }) => {
    // Seed events only on day 6 and day 0, leaving a gap of 5 days in the middle
    await createBatchEvents(request, [
      { event: EVENT, device_id: DEVICE, timestamp: isoDate(6) },
      { event: EVENT, device_id: DEVICE, timestamp: isoDate(0) },
    ]);
  });

  test('returns a bucket for every day in the range, zero-filling days with no events', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    const data: { date: string; total_count: number; unique_users: number }[] =
      body.data;

    // Default range is last 30 days — should contain at least 7 contiguous days
    expect(data.length).toBeGreaterThanOrEqual(7);

    // Verify no gaps: every consecutive pair is exactly one day apart
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].date).getTime();
      const curr = new Date(data[i].date).getTime();
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    }

    // At least some buckets must be zero (there IS a gap between day 6 and day 0)
    const zeroBuckets = data.filter((b) => b.total_count === 0);
    expect(zeroBuckets.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/trends — unique_users with resolved identities
// ---------------------------------------------------------------------------

test.describe('GET /api/trends — unique_users uses resolved identities', () => {
  const EVENT = 'test-trends-identity-event';
  const DEVICE = 'test-trends-identity-device-1';
  const USER = 'test-trends-identity-user-1';
  const TODAY = isoDate(0);

  test.beforeAll(async ({ request }) => {
    // Three anonymous events for the same device, then identity link
    await createBatchEvents(request, [
      { event: EVENT, device_id: DEVICE, timestamp: TODAY },
      { event: EVENT, device_id: DEVICE, timestamp: TODAY },
      { event: EVENT, device_id: DEVICE, timestamp: TODAY },
      {
        event: 'test-trends-identity-link',
        device_id: DEVICE,
        user_id: USER,
        timestamp: TODAY,
      },
    ]);
  });

  test('device mapped to user counts as one unique_user, not multiple', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    const data: { date: string; total_count: number; unique_users: number }[] =
      body.data;

    // Find the bucket for today
    const todayStr = new Date(TODAY).toISOString().slice(0, 10);
    const todayBucket = data.find((b) => b.date.startsWith(todayStr));

    expect(todayBucket).toBeDefined();
    // Three events but only one resolved identity
    expect(todayBucket!.total_count).toBeGreaterThanOrEqual(3);
    expect(todayBucket!.unique_users).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/trends — numeric aggregations (measure=sum / measure=avg)
// ---------------------------------------------------------------------------

test.describe('GET /api/trends — numeric aggregations', () => {
  const EVENT = 'test-trends-numeric-event';
  const DEVICE_A = 'test-trends-numeric-device-a';
  const DEVICE_B = 'test-trends-numeric-device-b';
  const TODAY = isoDate(0);

  test.beforeAll(async ({ request }) => {
    // Seed events with known amounts so we can verify sum/avg
    // Today: 100 + 200 + 50 = 350 sum, avg = 116.67
    await createBatchEvents(request, [
      {
        event: EVENT,
        device_id: DEVICE_A,
        timestamp: TODAY,
        properties: { amount: 100 },
      },
      {
        event: EVENT,
        device_id: DEVICE_A,
        timestamp: TODAY,
        properties: { amount: 200 },
      },
      {
        event: EVENT,
        device_id: DEVICE_B,
        timestamp: TODAY,
        properties: { amount: 50 },
      },
    ]);
  });

  test('measure=sum&property=amount returns data array with { date, value } and correct sums', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({
        event_name: EVENT,
        granularity: 'day',
        measure: 'sum',
        property: 'amount',
      }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    // Every bucket must have date and value
    for (const bucket of body.data) {
      expect(typeof bucket.date).toBe('string');
      expect(typeof bucket.value).toBe('number');
    }

    // Today's bucket must sum to 350
    const todayStr = new Date(TODAY).toISOString().slice(0, 10);
    const todayBucket = body.data.find((b: { date: string }) =>
      b.date.startsWith(todayStr),
    );
    expect(todayBucket).toBeDefined();
    expect(todayBucket.value).toBe(350);
  });

  test('measure=avg&property=amount returns averaged values per bucket', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({
        event_name: EVENT,
        granularity: 'day',
        measure: 'avg',
        property: 'amount',
      }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);

    // Today: (100 + 200 + 50) / 3 = 116.666...
    const todayStr = new Date(TODAY).toISOString().slice(0, 10);
    const todayBucket = body.data.find((b: { date: string }) =>
      b.date.startsWith(todayStr),
    );
    expect(todayBucket).toBeDefined();
    expect(todayBucket.value).toBeCloseTo(116.67, 1);
  });

  test('measure=sum without property param returns 400', async ({ request }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day', measure: 'sum' }),
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('measure=sum on a non-numeric property returns 400', async ({
    request,
  }) => {
    // Seed an event with a clearly string property
    await createEvent(request, {
      event: EVENT,
      device_id: DEVICE_A,
      timestamp: TODAY,
      properties: { label: 'hello' },
    });

    const response = await request.get(
      trendsUrl({
        event_name: EVENT,
        granularity: 'day',
        measure: 'sum',
        property: 'label',
      }),
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/trends — breakdown_by
// ---------------------------------------------------------------------------

test.describe('GET /api/trends — breakdown_by', () => {
  const EVENT = 'test-trends-breakdown-event';
  // 6 distinct values so top-5 + __other__ grouping is exercised
  const PAGES = ['/home', '/pricing', '/docs', '/blog', '/about', '/contact'];

  test.beforeAll(async ({ request }) => {
    const TODAY = isoDate(0);
    const events: EventPayload[] = [];

    // Seed 3 events per page value (18 events total, 6 distinct page values)
    for (const page of PAGES) {
      for (let i = 0; i < 3; i++) {
        events.push({
          event: EVENT,
          device_id: `test-trends-breakdown-device-${page.replace(/\//g, '')}-${i}`,
          timestamp: TODAY,
          properties: { page },
        });
      }
    }

    await createBatchEvents(request, events);
  });

  test('breakdown_by=property returns { series: [{ key, data }] } with top 5 plus __other__', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({
        event_name: EVENT,
        granularity: 'day',
        breakdown_by: 'page',
      }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.series)).toBe(true);

    // Must have at most 6 series (top 5 + __other__)
    expect(body.series.length).toBeGreaterThanOrEqual(2);
    expect(body.series.length).toBeLessThanOrEqual(6);

    // Each series must have a key and a data array
    for (const series of body.series) {
      expect(typeof series.key).toBe('string');
      expect(Array.isArray(series.data)).toBe(true);
    }

    // The __other__ bucket must be present (we seeded 6 distinct values)
    const keys: string[] = body.series.map((s: { key: string }) => s.key);
    expect(keys).toContain('__other__');
  });

  test('without breakdown_by returns flat data array (backward compatible)', async ({
    request,
  }) => {
    const response = await request.get(
      trendsUrl({ event_name: EVENT, granularity: 'day' }),
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Must have a flat data array, not a series array
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.series).toBeUndefined();
  });
});
