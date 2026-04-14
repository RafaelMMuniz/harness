/**
 * Trends Analysis Tests — BR-201, BR-300, BR-301, BR-302
 *
 * Tests trend queries, numeric aggregations, and dimensional breakdowns.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, post, get } from './test-server.js';

describe('BR-201/300/302: Trends, Aggregations, Breakdowns', () => {
  beforeAll(async () => {
    await startTestServer();

    // Seed test data
    const events = [];

    // Purchase events with amounts over 3 days
    for (let day = 1; day <= 3; day++) {
      for (let i = 0; i < 5; i++) {
        events.push({
          event: 'TrendPurchase',
          user_id: `trend-user-${i}@example.com`,
          device_id: `trend-device-${day}-${i}`,
          timestamp: `2025-03-0${day}T${String(10 + i).padStart(2, '0')}:00:00.000Z`,
          properties: { amount: (day * 10) + i, currency: 'USD', plan: i < 3 ? 'pro' : 'free' },
        });
      }
    }

    // Page views with varied pages
    const pages = ['/home', '/pricing', '/features', '/docs', '/blog', '/about'];
    for (let i = 0; i < 30; i++) {
      events.push({
        event: 'TrendPageView',
        device_id: `trend-pv-device-${i}`,
        timestamp: `2025-03-01T${String(i % 24).padStart(2, '0')}:00:00.000Z`,
        properties: { page: pages[i % pages.length] },
      });
    }

    await post('/api/events/batch', { events });
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // ─── BR-201: Basic Trend Queries ───────────────────────────────────

  describe('BR-201: Trend Analysis', () => {
    it('returns total_count and unique_users for an event over time (daily)', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-03',
        granularity: 'day',
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.event_name).toBe('TrendPurchase');
      expect(data.granularity).toBe('day');
      expect(data.data).toBeDefined();
      expect(data.data.length).toBe(3); // 3 days

      for (const point of data.data) {
        expect(point.date).toBeDefined();
        expect(point.total_count).toBeDefined();
        expect(point.unique_users).toBeDefined();
        expect(point.total_count).toBe(5); // 5 events per day
      }
    });

    it('supports weekly granularity', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-31',
        granularity: 'week',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.granularity).toBe('week');
      expect(data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('defaults to last 30 days when no date range specified', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.start_date).toBeDefined();
      expect(data.end_date).toBeDefined();
      expect(data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('fills in zero for days with no events', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-05', // days 4-5 have no events
        granularity: 'day',
      });
      const data = await res.json();
      expect(data.data).toHaveLength(5);

      const day4 = data.data.find((d: { date: string }) => d.date === '2025-03-04');
      const day5 = data.data.find((d: { date: string }) => d.date === '2025-03-05');
      expect(day4.total_count).toBe(0);
      expect(day5.total_count).toBe(0);
    });

    it('requires event_name parameter', async () => {
      const res = await get('/api/trends', {});
      expect(res.status).toBe(400);
    });
  });

  // ─── BR-300: Numeric Aggregations ──────────────────────────────────

  describe('BR-300: Numeric Aggregations', () => {
    it('computes sum of numeric property', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        granularity: 'day',
        measure: 'sum',
        property: 'amount',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      const day1 = data.data.find((d: { date: string }) => d.date === '2025-03-01');
      // Day 1 amounts: 10+0, 10+1, 10+2, 10+3, 10+4 = 60
      expect(day1.value).toBe(60);
    });

    it('computes average of numeric property', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        granularity: 'day',
        measure: 'avg',
        property: 'amount',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      const day1 = data.data.find((d: { date: string }) => d.date === '2025-03-01');
      // Average of 10, 11, 12, 13, 14 = 12
      expect(day1.value).toBe(12);
    });

    it('computes min of numeric property', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        granularity: 'day',
        measure: 'min',
        property: 'amount',
      });
      const data = await res.json();
      const day1 = data.data.find((d: { date: string }) => d.date === '2025-03-01');
      expect(day1.value).toBe(10);
    });

    it('computes max of numeric property', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        granularity: 'day',
        measure: 'max',
        property: 'amount',
      });
      const data = await res.json();
      const day1 = data.data.find((d: { date: string }) => d.date === '2025-03-01');
      expect(day1.value).toBe(14);
    });

    it('requires property parameter for numeric measures', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        measure: 'sum',
        // missing property
      });
      expect(res.status).toBe(400);
    });

    it('rejects numeric aggregation on non-numeric property', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        measure: 'sum',
        property: 'currency', // string property
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('not numeric');
    });
  });

  // ─── BR-302: Dimensional Breakdown ─────────────────────────────────

  describe('BR-302: Dimensional Breakdown', () => {
    it('breaks down by string property with top values + __other__', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPageView',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        granularity: 'day',
        breakdown_by: 'page',
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      // Should return series instead of flat data
      expect(data.series).toBeDefined();
      expect(Array.isArray(data.series)).toBe(true);
      expect(data.series.length).toBeGreaterThanOrEqual(2);

      // Each series has key and data
      for (const s of data.series) {
        expect(s.key).toBeDefined();
        expect(s.data).toBeDefined();
        expect(Array.isArray(s.data)).toBe(true);
      }

      // If more than 5 unique values, should have __other__
      const keys = data.series.map((s: { key: string }) => s.key);
      if (keys.length > 5) {
        expect(keys).toContain('__other__');
      }
    });

    it('breakdown works with unique_users measure', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-03',
        granularity: 'day',
        measure: 'unique_users',
        breakdown_by: 'plan',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.series).toBeDefined();

      const keys = data.series.map((s: { key: string }) => s.key);
      expect(keys).toContain('pro');
      expect(keys).toContain('free');
    });

    it('breakdown works with numeric aggregation (sum of amount by plan)', async () => {
      const res = await get('/api/trends', {
        event_name: 'TrendPurchase',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        granularity: 'day',
        measure: 'sum',
        property: 'amount',
        breakdown_by: 'plan',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.series).toBeDefined();
    });
  });

  // ─── Properties Endpoint ───────────────────────────────────────────

  describe('GET /api/events/:eventName/properties', () => {
    it('returns property descriptors with types and sample values', async () => {
      const res = await get('/api/events/TrendPurchase/properties');
      expect(res.status).toBe(200);
      const props = await res.json();
      expect(Array.isArray(props)).toBe(true);

      const amountProp = props.find((p: { name: string }) => p.name === 'amount');
      expect(amountProp).toBeDefined();
      expect(amountProp.type).toBe('number');

      const currencyProp = props.find((p: { name: string }) => p.name === 'currency');
      expect(currencyProp).toBeDefined();
      expect(currencyProp.type).toBe('string');
    });

    it('returns empty array for nonexistent event', async () => {
      const res = await get('/api/events/NonexistentEvent_XYZ/properties');
      expect(res.status).toBe(200);
      const props = await res.json();
      expect(props).toEqual([]);
    });
  });
});
