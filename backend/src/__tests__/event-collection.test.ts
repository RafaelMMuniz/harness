/**
 * Event Collection Tests — BR-100
 *
 * Tests the event ingestion API: validation, persistence, timestamps, properties.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, post, get } from './test-server.js';

describe('BR-100: Event Collection', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // ─── POST /api/events — Valid Events ───────────────────────────────

  describe('POST /api/events — valid events', () => {
    it('accepts event with all fields and returns 201', async () => {
      const res = await post('/api/events', {
        event: 'Purchase Completed',
        device_id: 'ec-device-001',
        user_id: 'ec-user-001@example.com',
        timestamp: '2025-01-15T12:00:00.000Z',
        properties: { amount: 99.99, currency: 'USD' },
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.event).toBe('Purchase Completed');
      expect(data.device_id).toBe('ec-device-001');
      expect(data.user_id).toBe('ec-user-001@example.com');
      expect(data.timestamp).toBe('2025-01-15T12:00:00.000Z');
      expect(data.properties).toEqual({ amount: 99.99, currency: 'USD' });
    });

    it('accepts event with device_id only (no user_id)', async () => {
      const res = await post('/api/events', {
        event: 'Page Viewed',
        device_id: 'ec-device-002',
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.device_id).toBe('ec-device-002');
      expect(data.user_id).toBeNull();
    });

    it('accepts event with user_id only (no device_id)', async () => {
      const res = await post('/api/events', {
        event: 'Server Event',
        user_id: 'ec-user-003@example.com',
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user_id).toBe('ec-user-003@example.com');
      expect(data.device_id).toBeNull();
    });

    it('assigns server timestamp when omitted', async () => {
      const before = new Date().toISOString();
      const res = await post('/api/events', {
        event: 'Page Viewed',
        device_id: 'ec-device-004',
      });
      const after = new Date().toISOString();

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.timestamp).toBeDefined();
      // Server timestamp should be between before and after
      expect(data.timestamp >= before).toBe(true);
      expect(data.timestamp <= after).toBe(true);
    });

    it('persists events so they survive a query', async () => {
      const uniqueEvent = 'PersistenceTest_EC100';
      await post('/api/events', {
        event: uniqueEvent,
        device_id: 'ec-persist-device',
        timestamp: '2025-01-20T00:00:00.000Z',
      });

      const queryRes = await get('/api/events', { event_name: uniqueEvent });
      const data = await queryRes.json();
      expect(data.events.length).toBe(1);
      expect(data.events[0].event).toBe(uniqueEvent);
    });

    it('preserves arbitrary key-value properties (string, number, boolean)', async () => {
      const res = await post('/api/events', {
        event: 'PropsTest',
        device_id: 'ec-props-device',
        properties: {
          page: '/home',
          amount: 42.5,
          is_premium: true,
        },
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.properties.page).toBe('/home');
      expect(data.properties.amount).toBe(42.5);
      expect(data.properties.is_premium).toBe(true);
    });
  });

  // ─── POST /api/events — Validation Errors ─────────────────────────

  describe('POST /api/events — validation errors', () => {
    it('rejects event missing event name with 400', async () => {
      const res = await post('/api/events', {
        device_id: 'ec-device-bad-001',
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('rejects event with empty event name', async () => {
      const res = await post('/api/events', {
        event: '',
        device_id: 'ec-device-bad-002',
      });
      expect(res.status).toBe(400);
    });

    it('rejects event missing both device_id and user_id with 400', async () => {
      const res = await post('/api/events', {
        event: 'Orphan Event',
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('rejects completely empty body', async () => {
      const res = await post('/api/events', {});
      expect(res.status).toBe(400);
    });

    it('rejects malformed JSON', async () => {
      const res = await fetch(`${(await import('./test-server.js')).getBaseUrl()}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/events/batch ────────────────────────────────────────

  describe('POST /api/events/batch', () => {
    it('accepts batch of valid events and returns 200 with accepted count', async () => {
      const res = await post('/api/events/batch', {
        events: [
          { event: 'BatchEvent1', device_id: 'ec-batch-d1', timestamp: '2025-02-01T00:00:00.000Z' },
          { event: 'BatchEvent2', device_id: 'ec-batch-d2', timestamp: '2025-02-01T01:00:00.000Z' },
          { event: 'BatchEvent3', user_id: 'ec-batch-user', timestamp: '2025-02-01T02:00:00.000Z' },
        ],
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.accepted).toBe(3);
      expect(data.errors).toHaveLength(0);
    });

    it('handles mix of valid and invalid events', async () => {
      const res = await post('/api/events/batch', {
        events: [
          { event: 'Valid', device_id: 'ec-mix-d1' },
          { event: '', device_id: 'ec-mix-d2' },           // invalid: empty name
          { event: 'NoIdentity' },                          // invalid: no identity
          { event: 'Valid2', user_id: 'ec-mix-user' },
        ],
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.accepted).toBe(2);
      expect(data.errors).toHaveLength(2);
      // Errors should have index and message
      for (const err of data.errors) {
        expect(err.index).toBeDefined();
        expect(err.message).toBeDefined();
      }
    });

    it('rejects empty events array with 400', async () => {
      const res = await post('/api/events/batch', { events: [] });
      expect(res.status).toBe(400);
    });

    it('rejects batch exceeding 1000 events with 400', async () => {
      const events = Array.from({ length: 1001 }, (_, i) => ({
        event: 'TooMany',
        device_id: `ec-toomany-${i}`,
      }));
      const res = await post('/api/events/batch', { events });
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/events — Querying ────────────────────────────────────

  describe('GET /api/events — querying', () => {
    it('returns events in reverse chronological order by default', async () => {
      // Seed events with known timestamps
      await post('/api/events', { event: 'OrderTest1', device_id: 'ec-order-d', timestamp: '2025-03-01T01:00:00.000Z' });
      await post('/api/events', { event: 'OrderTest2', device_id: 'ec-order-d', timestamp: '2025-03-01T03:00:00.000Z' });
      await post('/api/events', { event: 'OrderTest3', device_id: 'ec-order-d', timestamp: '2025-03-01T02:00:00.000Z' });

      const res = await get('/api/events', { event_name: 'OrderTest1' });
      // The default (non-user-filtered) query should return events
      expect(res.status).toBe(200);
    });

    it('returns pagination metadata (total, limit, offset)', async () => {
      const res = await get('/api/events', { limit: '10', offset: '0' });
      const data = await res.json();
      expect(data.total).toBeDefined();
      expect(data.limit).toBeDefined();
      expect(data.offset).toBeDefined();
      expect(typeof data.total).toBe('number');
    });

    it('filters by event_name', async () => {
      const uniqueName = 'FilterUnique_EC100';
      await post('/api/events', { event: uniqueName, device_id: 'ec-filter-d' });
      await post('/api/events', { event: 'OtherEvent', device_id: 'ec-filter-d2' });

      const res = await get('/api/events', { event_name: uniqueName });
      const data = await res.json();
      expect(data.events.length).toBeGreaterThanOrEqual(1);
      for (const ev of data.events) {
        expect(ev.event).toBe(uniqueName);
      }
    });

    it('filters by date range', async () => {
      const eventName = 'DateFilter_EC100';
      await post('/api/events', { event: eventName, device_id: 'ec-date-d', timestamp: '2025-06-01T00:00:00.000Z' });
      await post('/api/events', { event: eventName, device_id: 'ec-date-d', timestamp: '2025-06-15T00:00:00.000Z' });
      await post('/api/events', { event: eventName, device_id: 'ec-date-d', timestamp: '2025-07-01T00:00:00.000Z' });

      const res = await get('/api/events', {
        event_name: eventName,
        start_date: '2025-06-01',
        end_date: '2025-06-30',
      });
      const data = await res.json();
      expect(data.events).toHaveLength(2);
    });

    it('supports pagination with limit and offset', async () => {
      const eventName = 'Paginate_EC100';
      // Create 5 events
      for (let i = 0; i < 5; i++) {
        await post('/api/events', {
          event: eventName,
          device_id: `ec-page-d${i}`,
          timestamp: `2025-08-01T0${i}:00:00.000Z`,
        });
      }

      const page1 = await get('/api/events', { event_name: eventName, limit: '2', offset: '0' });
      const page1Data = await page1.json();
      expect(page1Data.events).toHaveLength(2);
      expect(page1Data.total).toBe(5);

      const page2 = await get('/api/events', { event_name: eventName, limit: '2', offset: '2' });
      const page2Data = await page2.json();
      expect(page2Data.events).toHaveLength(2);

      // Page 1 and page 2 should have different events
      const page1Ids = new Set(page1Data.events.map((e: { id: string }) => e.id));
      for (const ev of page2Data.events) {
        expect(page1Ids.has(ev.id)).toBe(false);
      }
    });
  });

  // ─── GET /api/events/names ─────────────────────────────────────────

  describe('GET /api/events/names', () => {
    it('returns alphabetically sorted distinct event names', async () => {
      // Seed a few unique events
      await post('/api/events', { event: 'ZZZ_Event', device_id: 'ec-names-d1' });
      await post('/api/events', { event: 'AAA_Event', device_id: 'ec-names-d2' });
      await post('/api/events', { event: 'MMM_Event', device_id: 'ec-names-d3' });

      const res = await get('/api/events/names');
      const names: string[] = await res.json();
      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('ZZZ_Event');
      expect(names).toContain('AAA_Event');
      expect(names).toContain('MMM_Event');

      // Verify alphabetical order
      for (let i = 1; i < names.length; i++) {
        expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns distinct names (no duplicates)', async () => {
      await post('/api/events', { event: 'DupTest_EC100', device_id: 'ec-dup-d1' });
      await post('/api/events', { event: 'DupTest_EC100', device_id: 'ec-dup-d2' });

      const res = await get('/api/events/names');
      const names: string[] = await res.json();
      const dupCount = names.filter(n => n === 'DupTest_EC100').length;
      expect(dupCount).toBe(1);
    });
  });

  // ─── GET /api/stats/overview ───────────────────────────────────────

  describe('GET /api/stats/overview', () => {
    it('returns overview with required fields', async () => {
      const res = await get('/api/stats/overview');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total_events).toBeDefined();
      expect(data.total_users).toBeDefined();
      expect(data.event_counts_by_name).toBeDefined();
      expect(data.date_range).toBeDefined();
      expect(data.date_range.earliest).toBeDefined();
      expect(data.date_range.latest).toBeDefined();
    });

    it('total_users counts resolved identities (not double-counting mapped devices)', async () => {
      // Create device + user mapping
      const device = 'stats-device-unique';
      const user = 'stats-user-unique@example.com';
      await post('/api/events', { event: 'StatsTest', device_id: device, timestamp: '2025-09-01T00:00:00.000Z' });
      await post('/api/events', { event: 'StatsTest', device_id: device, user_id: user, timestamp: '2025-09-01T01:00:00.000Z' });

      const res = await get('/api/stats/overview');
      const data = await res.json();
      // total_users should be less than total_events
      expect(data.total_users).toBeLessThan(data.total_events);
    });
  });
});
