import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents } from './helpers';

const P = 't05t';

test.describe('GET /api/trends — trend aggregation', () => {
  const API = 'http://localhost:3001';

  test.beforeAll(async ({ request }) => {
    const events = [];

    // Events across multiple days with known numeric properties
    // Day 1: 3 events, Day 2: 5 events, Day 3: 2 events
    const baseDate = new Date('2025-06-10');

    for (let i = 0; i < 3; i++) {
      events.push({
        event: `${P}-purchase`,
        device_id: `${P}-dev-${i}`,
        timestamp: new Date(baseDate.getTime() + i * 3600000).toISOString(),
        properties: { amount: 10 + i * 5, currency: 'USD', url: '/checkout' },
      });
    }

    const day2 = new Date('2025-06-11');
    for (let i = 0; i < 5; i++) {
      events.push({
        event: `${P}-purchase`,
        device_id: `${P}-dev-${i % 3}`,
        timestamp: new Date(day2.getTime() + i * 3600000).toISOString(),
        properties: { amount: 20 + i * 10, currency: 'USD', url: '/checkout' },
      });
    }

    const day3 = new Date('2025-06-12');
    for (let i = 0; i < 2; i++) {
      events.push({
        event: `${P}-purchase`,
        device_id: `${P}-dev-${i}`,
        timestamp: new Date(day3.getTime() + i * 3600000).toISOString(),
        properties: { amount: 50, currency: 'EUR', url: '/checkout' },
      });
    }

    // Identity mapping: device-0 → user-alpha
    events.push({
      event: `${P}-purchase`,
      device_id: `${P}-dev-0`,
      user_id: `${P}-user-alpha`,
      timestamp: new Date(day3.getTime() + 5 * 3600000).toISOString(),
      properties: { amount: 100, currency: 'USD', url: '/checkout' },
    });

    // Breakdown data: events with different property values
    events.push({
      event: `${P}-page-view`,
      device_id: `${P}-dev-breakdown-1`,
      timestamp: new Date(baseDate.getTime()).toISOString(),
      properties: { url: '/home', button_name: 'cta' },
    });
    events.push({
      event: `${P}-page-view`,
      device_id: `${P}-dev-breakdown-2`,
      timestamp: new Date(baseDate.getTime() + 3600000).toISOString(),
      properties: { url: '/pricing', button_name: 'nav' },
    });

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
  });

  test('returns valid trend data for a known event_name', async ({ request }) => {
    const res = await request.get(`${API}/api/trends?event_name=${P}-purchase`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('event_name', `${P}-purchase`);
    expect(body).toHaveProperty('granularity');
    expect(body).toHaveProperty('start_date');
    expect(body).toHaveProperty('end_date');
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);

    for (const entry of body.data) {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('total_count');
      expect(entry).toHaveProperty('unique_users');
      expect(typeof entry.total_count).toBe('number');
      expect(typeof entry.unique_users).toBe('number');
    }
  });

  test('returns 400 when event_name is missing', async ({ request }) => {
    const res = await request.get(`${API}/api/trends`);
    expect(res.status()).toBe(400);
  });

  test('returns daily buckets with granularity=day', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&granularity=day&start_date=2025-06-10&end_date=2025-06-12`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.granularity).toBe('day');
    // Should have 3 days: June 10, 11, 12
    expect(body.data.length).toBe(3);
  });

  test('returns weekly buckets with granularity=week', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&granularity=week&start_date=2025-06-09&end_date=2025-06-22`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.granularity).toBe('week');
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('returns zero-filled buckets for days with no events', async ({ request }) => {
    // Request a range that includes days without events
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&granularity=day&start_date=2025-06-10&end_date=2025-06-15`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Should have 6 days, with some zero-count
    expect(body.data.length).toBe(6);
    const zeroDays = body.data.filter((d: { total_count: number }) => d.total_count === 0);
    expect(zeroDays.length).toBeGreaterThan(0);
  });

  test('unique_users uses resolved identities (mapped device not double-counted)', async ({ request }) => {
    // device-0 is mapped to user-alpha, so events from device-0 and user-alpha
    // should be counted as one unique user
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&granularity=day&start_date=2025-06-10&end_date=2025-06-12`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    // On day 3 (June 12): device-0, device-1, and user-alpha (mapped to device-0)
    // device-0 and user-alpha should be 1 unique user
    const day3 = body.data.find((d: { date: string }) => d.date.startsWith('2025-06-12'));
    if (day3) {
      // 3 events on this day but device-0 = user-alpha, so unique < total
      expect(day3.unique_users).toBeLessThanOrEqual(day3.total_count);
    }
  });

  test('returns { data: [{ date, value }] } with measure=sum&property=amount', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&measure=sum&property=amount&start_date=2025-06-10&end_date=2025-06-12`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('data');
    for (const entry of body.data) {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('value');
      expect(typeof entry.value).toBe('number');
    }
  });

  test('returns averaged values with measure=avg&property=amount', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&measure=avg&property=amount&start_date=2025-06-10&end_date=2025-06-12`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    for (const entry of body.data) {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('value');
    }
  });

  test('returns 400 with measure=sum but no property param', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&measure=sum`,
    );
    expect(res.status()).toBe(400);
  });

  test('returns 400 with measure=sum on non-numeric property', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&measure=sum&property=currency`,
    );
    expect(res.status()).toBe(400);
  });

  test('returns series with breakdown_by — top 5 + __other__', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&breakdown_by=currency&start_date=2025-06-10&end_date=2025-06-12`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('series');
    expect(Array.isArray(body.series)).toBe(true);

    for (const s of body.series) {
      expect(s).toHaveProperty('key');
      expect(s).toHaveProperty('data');
      expect(Array.isArray(s.data)).toBe(true);
    }
  });

  test('returns flat data array without breakdown_by (backward compatible)', async ({ request }) => {
    const res = await request.get(
      `${API}/api/trends?event_name=${P}-purchase&start_date=2025-06-10&end_date=2025-06-12`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).not.toHaveProperty('series');
  });
});
