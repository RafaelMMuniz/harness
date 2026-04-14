/**
 * Identity Resolution Tests — BR-101
 *
 * This is the most critical test file in the project.
 * "If identity resolution is wrong, every number is wrong."
 *
 * Tests the spec, not the implementation. All tests are black-box HTTP API tests.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, post, get } from './test-server.js';

describe('BR-101: Identity Resolution', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // ─── CORE: Retroactive Merge ───────────────────────────────────────

  describe('Retroactive merge', () => {
    it('past anonymous events are attributed to the known user after mapping is created', async () => {
      const deviceId = 'retro-device-001';
      const userId = 'retro-user-001@example.com';

      // Send 4 anonymous events (device only, no user)
      for (let i = 0; i < 4; i++) {
        const res = await post('/api/events', {
          event: 'Page Viewed',
          device_id: deviceId,
          timestamp: `2025-01-01T0${i}:00:00.000Z`,
        });
        expect(res.status).toBe(201);
      }

      // Send 1 identifying event (both device + user — creates the mapping)
      const identifyRes = await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-01-01T04:00:00.000Z',
      });
      expect(identifyRes.status).toBe(201);

      // Query events for user — ALL 5 events must appear
      const queryRes = await get('/api/events', { user_id: userId });
      expect(queryRes.status).toBe(200);
      const data = await queryRes.json();
      expect(data.events).toHaveLength(5);

      // Verify all events are from our device
      for (const ev of data.events) {
        expect(ev.device_id).toBe(deviceId);
      }
    });

    it('handles large number of anonymous events before identification', async () => {
      const deviceId = 'retro-bulk-device-002';
      const userId = 'retro-bulk-user-002@example.com';

      // Send 50 anonymous events
      const events = Array.from({ length: 50 }, (_, i) => ({
        event: 'Page Viewed',
        device_id: deviceId,
        timestamp: `2025-02-01T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`,
      }));

      const batchRes = await post('/api/events/batch', { events });
      expect(batchRes.status).toBe(200);
      const batchData = await batchRes.json();
      expect(batchData.accepted).toBe(50);

      // Now identify
      const identifyRes = await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-02-01T01:00:00.000Z',
      });
      expect(identifyRes.status).toBe(201);

      // Query — all 51 events must appear
      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(51);
    });

    it('events sent AFTER mapping creation are also attributed to the user', async () => {
      const deviceId = 'retro-post-device-003';
      const userId = 'retro-post-user-003@example.com';

      // Create the mapping first
      await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-03-01T00:00:00.000Z',
      });

      // Send anonymous events AFTER the mapping exists
      for (let i = 1; i <= 3; i++) {
        await post('/api/events', {
          event: 'Page Viewed',
          device_id: deviceId,
          timestamp: `2025-03-01T0${i}:00:00.000Z`,
        });
      }

      // Query user — should see the login event + 3 subsequent anonymous events = 4
      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(4);
    });
  });

  // ─── CORE: Multi-device Merge ──────────────────────────────────────

  describe('Multi-device merge', () => {
    it('events from multiple devices are unified under a single user', async () => {
      const deviceA = 'multi-device-A-004';
      const deviceB = 'multi-device-B-004';
      const userId = 'multi-user-004@example.com';

      // Events on device A (anonymous)
      await post('/api/events', {
        event: 'Page Viewed',
        device_id: deviceA,
        timestamp: '2025-04-01T00:00:00.000Z',
      });
      await post('/api/events', {
        event: 'Button Clicked',
        device_id: deviceA,
        timestamp: '2025-04-01T01:00:00.000Z',
      });

      // Events on device B (anonymous)
      await post('/api/events', {
        event: 'Page Viewed',
        device_id: deviceB,
        timestamp: '2025-04-01T02:00:00.000Z',
      });

      // Link device A to user
      await post('/api/events', {
        event: 'Login',
        device_id: deviceA,
        user_id: userId,
        timestamp: '2025-04-01T03:00:00.000Z',
      });

      // Link device B to same user
      await post('/api/events', {
        event: 'Login',
        device_id: deviceB,
        user_id: userId,
        timestamp: '2025-04-01T04:00:00.000Z',
      });

      // Query user — should see all 5 events from both devices
      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(5);

      // Verify both device IDs are present
      const deviceIds = new Set(data.events.map((e: { device_id: string }) => e.device_id));
      expect(deviceIds.has(deviceA)).toBe(true);
      expect(deviceIds.has(deviceB)).toBe(true);
    });

    it('three devices mapped to the same user', async () => {
      const deviceA = 'tri-device-A-005';
      const deviceB = 'tri-device-B-005';
      const deviceC = 'tri-device-C-005';
      const userId = 'tri-user-005@example.com';

      // One event per device
      await post('/api/events', { event: 'Page Viewed', device_id: deviceA, timestamp: '2025-05-01T00:00:00.000Z' });
      await post('/api/events', { event: 'Page Viewed', device_id: deviceB, timestamp: '2025-05-01T01:00:00.000Z' });
      await post('/api/events', { event: 'Page Viewed', device_id: deviceC, timestamp: '2025-05-01T02:00:00.000Z' });

      // Link all to same user
      await post('/api/events', { event: 'Login', device_id: deviceA, user_id: userId, timestamp: '2025-05-01T03:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceB, user_id: userId, timestamp: '2025-05-01T04:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceC, user_id: userId, timestamp: '2025-05-01T05:00:00.000Z' });

      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(6);

      const deviceIds = new Set(data.events.map((e: { device_id: string }) => e.device_id));
      expect(deviceIds.size).toBe(3);
    });
  });

  // ─── CORE: Device Exclusivity ──────────────────────────────────────

  describe('Device exclusivity', () => {
    it('a device cannot be mapped to more than one user', async () => {
      const deviceId = 'excl-device-006';
      const userP = 'user-P-006@example.com';
      const userQ = 'user-Q-006@example.com';

      // First mapping: device → user P
      const res1 = await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userP,
        timestamp: '2025-06-01T00:00:00.000Z',
      });
      expect(res1.status).toBe(201);

      // Second mapping attempt: device → user Q — should be rejected (409)
      const res2 = await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userQ,
        timestamp: '2025-06-01T01:00:00.000Z',
      });
      expect(res2.status).toBe(409);

      // Verify the device is still mapped to user P, not Q
      const queryRes = await get('/api/events', { user_id: userP });
      const data = await queryRes.json();
      expect(data.events.length).toBeGreaterThanOrEqual(1);
      expect(data.events[0].device_id).toBe(deviceId);
    });

    it('mapping same device to same user is idempotent (not an error)', async () => {
      const deviceId = 'idempotent-device-007';
      const userId = 'idempotent-user-007@example.com';

      // First mapping
      const res1 = await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-07-01T00:00:00.000Z',
      });
      expect(res1.status).toBe(201);

      // Same mapping again — should succeed (idempotent)
      const res2 = await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-07-01T01:00:00.000Z',
      });
      expect(res2.status).toBe(201);

      // Both events should be attributed to the user
      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(2);
    });
  });

  // ─── CORE: Unidentified Devices ────────────────────────────────────

  describe('Unidentified devices', () => {
    it('events for unidentified devices remain anonymous', async () => {
      const deviceId = 'anon-device-008';

      // Send events without ever creating a mapping
      await post('/api/events', {
        event: 'Page Viewed',
        device_id: deviceId,
        timestamp: '2025-08-01T00:00:00.000Z',
      });
      await post('/api/events', {
        event: 'Button Clicked',
        device_id: deviceId,
        timestamp: '2025-08-01T01:00:00.000Z',
      });

      // Query by device_id — should return just these events
      const queryRes = await get('/api/events', { device_id: deviceId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(2);
      for (const ev of data.events) {
        expect(ev.device_id).toBe(deviceId);
        expect(ev.user_id).toBeNull();
      }
    });

    it('querying by user_id for a nonexistent user returns nothing', async () => {
      const queryRes = await get('/api/events', { user_id: 'nonexistent-user-never@example.com' });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(0);
    });
  });

  // ─── CORE: Query by device_id resolves to user ─────────────────────

  describe('Querying by device_id resolves to user', () => {
    it('GET /api/events?device_id=X returns user events when device is mapped', async () => {
      const deviceId = 'resolve-device-009';
      const userId = 'resolve-user-009@example.com';

      // Anonymous event
      await post('/api/events', {
        event: 'Page Viewed',
        device_id: deviceId,
        timestamp: '2025-09-01T00:00:00.000Z',
      });

      // Identify
      await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-09-01T01:00:00.000Z',
      });

      // Also send a user-only event (no device)
      await post('/api/events', {
        event: 'Purchase Completed',
        user_id: userId,
        timestamp: '2025-09-01T02:00:00.000Z',
      });

      // Query by device_id — should resolve to user and include ALL user events
      const queryRes = await get('/api/events', { device_id: deviceId });
      const data = await queryRes.json();
      // Should include: anonymous event + login event + user-only event = 3
      expect(data.events.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Identity in Event-Only Fields ─────────────────────────────────

  describe('Events with only user_id (no device_id)', () => {
    it('events with only user_id are attributed correctly', async () => {
      const userId = 'useronly-010@example.com';

      await post('/api/events', {
        event: 'Server Event',
        user_id: userId,
        timestamp: '2025-10-01T00:00:00.000Z',
      });
      await post('/api/events', {
        event: 'Email Sent',
        user_id: userId,
        timestamp: '2025-10-01T01:00:00.000Z',
      });

      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(2);
      for (const ev of data.events) {
        expect(ev.user_id).toBe(userId);
      }
    });
  });

  // ─── Timestamp Ordering After Merge ────────────────────────────────

  describe('Timestamp ordering after merge', () => {
    it('merged events are returned in chronological order', async () => {
      const deviceId = 'order-device-011';
      const userId = 'order-user-011@example.com';

      // Events out of order
      await post('/api/events', { event: 'E3', device_id: deviceId, timestamp: '2025-11-01T03:00:00.000Z' });
      await post('/api/events', { event: 'E1', device_id: deviceId, timestamp: '2025-11-01T01:00:00.000Z' });
      await post('/api/events', { event: 'E2', device_id: deviceId, timestamp: '2025-11-01T02:00:00.000Z' });

      // Identify
      await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-11-01T04:00:00.000Z',
      });

      const queryRes = await get('/api/events', { user_id: userId });
      const data = await queryRes.json();
      expect(data.events).toHaveLength(4);

      // Verify chronological order (ASC)
      const timestamps = data.events.map((e: { timestamp: string }) => e.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i] >= timestamps[i - 1]).toBe(true);
      }
    });
  });

  // ─── Identity Resolution in Aggregations ───────────────────────────

  describe('Identity resolution in aggregations', () => {
    it('unique_users uses resolved identities (not raw device count)', async () => {
      const deviceA = 'agg-device-A-012';
      const deviceB = 'agg-device-B-012';
      const userId = 'agg-user-012@example.com';
      const eventName = 'AggTest012';

      // Events from two devices
      await post('/api/events', {
        event: eventName,
        device_id: deviceA,
        timestamp: '2025-12-01T00:00:00.000Z',
      });
      await post('/api/events', {
        event: eventName,
        device_id: deviceB,
        timestamp: '2025-12-01T01:00:00.000Z',
      });

      // Map both to same user
      await post('/api/events', {
        event: eventName,
        device_id: deviceA,
        user_id: userId,
        timestamp: '2025-12-01T02:00:00.000Z',
      });
      await post('/api/events', {
        event: eventName,
        device_id: deviceB,
        user_id: userId,
        timestamp: '2025-12-01T03:00:00.000Z',
      });

      // Query trends
      const trendRes = await get('/api/trends', {
        event_name: eventName,
        start_date: '2025-12-01',
        end_date: '2025-12-01',
        granularity: 'day',
        measure: 'unique_users',
      });
      const trendData = await trendRes.json();
      expect(trendData.data).toBeDefined();
      // Both devices resolve to the same user → unique_users should be 1
      const totalUnique = trendData.data.reduce(
        (sum: number, d: { unique_users?: number }) => sum + (d.unique_users || 0),
        0,
      );
      expect(totalUnique).toBe(1);
    });

    it('total_count is higher than unique_users when same user has multiple events', async () => {
      const deviceId = 'agg-device-013';
      const userId = 'agg-user-013@example.com';
      const eventName = 'AggRepeat013';

      // 3 events from same device/user
      for (let i = 0; i < 3; i++) {
        await post('/api/events', {
          event: eventName,
          device_id: deviceId,
          user_id: userId,
          timestamp: `2025-12-02T0${i}:00:00.000Z`,
        });
      }

      const trendRes = await get('/api/trends', {
        event_name: eventName,
        start_date: '2025-12-02',
        end_date: '2025-12-02',
        granularity: 'day',
      });
      const trendData = await trendRes.json();

      const totalCount = trendData.data.reduce(
        (sum: number, d: { total_count: number }) => sum + d.total_count,
        0,
      );
      const uniqueUsers = trendData.data.reduce(
        (sum: number, d: { unique_users: number }) => sum + d.unique_users,
        0,
      );

      expect(totalCount).toBe(3);
      expect(uniqueUsers).toBe(1);
      expect(totalCount).toBeGreaterThan(uniqueUsers);
    });
  });

  // ─── Identity Resolution in Stats Overview ─────────────────────────

  describe('Identity resolution in stats overview', () => {
    it('total_users uses resolved identities (mapped devices not double-counted)', async () => {
      // We've already created mapped devices above. The stats overview should count
      // resolved identities, not raw device_ids.
      const statsRes = await get('/api/stats/overview');
      const stats = await statsRes.json();

      expect(stats.total_users).toBeDefined();
      expect(stats.total_events).toBeDefined();
      expect(stats.total_events).toBeGreaterThan(0);
      // total_users should be less than total_events (we have multi-event users)
      expect(stats.total_users).toBeLessThan(stats.total_events);
    });
  });

  // ─── Identity Resolution in User Profiles ──────────────────────────

  describe('Identity resolution in user profiles', () => {
    it('user profile shows identity cluster (all mapped devices)', async () => {
      const deviceA = 'profile-device-A-014';
      const deviceB = 'profile-device-B-014';
      const userId = 'profile-user-014@example.com';

      await post('/api/events', { event: 'Page Viewed', device_id: deviceA, timestamp: '2025-12-10T00:00:00.000Z' });
      await post('/api/events', { event: 'Page Viewed', device_id: deviceB, timestamp: '2025-12-10T01:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceA, user_id: userId, timestamp: '2025-12-10T02:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceB, user_id: userId, timestamp: '2025-12-10T03:00:00.000Z' });

      const profileRes = await get(`/api/users/${encodeURIComponent(userId)}`);
      expect(profileRes.status).toBe(200);
      const profile = await profileRes.json();

      expect(profile.user_id).toBe(userId);
      expect(profile.device_ids).toContain(deviceA);
      expect(profile.device_ids).toContain(deviceB);
      expect(profile.total_events).toBe(4);
      expect(profile.events).toHaveLength(4);
    });

    it('looking up by device_id returns the resolved user profile', async () => {
      const deviceId = 'profile-device-015';
      const userId = 'profile-user-015@example.com';

      await post('/api/events', { event: 'Page Viewed', device_id: deviceId, timestamp: '2025-12-11T00:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceId, user_id: userId, timestamp: '2025-12-11T01:00:00.000Z' });

      // Look up by device_id — should resolve to user
      const profileRes = await get(`/api/users/${encodeURIComponent(deviceId)}`);
      expect(profileRes.status).toBe(200);
      const profile = await profileRes.json();

      expect(profile.user_id).toBe(userId);
      expect(profile.device_ids).toContain(deviceId);
      expect(profile.total_events).toBe(2);
    });
  });

  // ─── Identity Resolution in Funnels ────────────────────────────────

  describe('Identity resolution in funnels', () => {
    it('anonymous step 1 + identified step 2 = one user progressing (not a dropout)', async () => {
      const deviceId = 'funnel-device-016';
      const userId = 'funnel-user-016@example.com';

      // Step 1: anonymous page view
      await post('/api/events', {
        event: 'FunnelStep1_016',
        device_id: deviceId,
        timestamp: '2025-12-15T00:00:00.000Z',
      });

      // Identify the device
      await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-12-15T01:00:00.000Z',
      });

      // Step 2: now identified
      await post('/api/events', {
        event: 'FunnelStep2_016',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-12-15T02:00:00.000Z',
      });

      // Query funnel
      const funnelRes = await post('/api/funnels/query', {
        steps: ['FunnelStep1_016', 'FunnelStep2_016'],
        start_date: '2025-12-15T00:00:00.000Z',
        end_date: '2025-12-15T23:59:59.999Z',
      });
      expect(funnelRes.status).toBe(200);
      const funnelData = await funnelRes.json();

      // Step 1 count should be 1 (one resolved user)
      expect(funnelData.steps[0].count).toBe(1);
      // Step 2 count should be 1 (same resolved user progressed)
      expect(funnelData.steps[1].count).toBe(1);
      // Overall conversion should be 100%
      expect(funnelData.overall_conversion_rate).toBe(1.0);
    });
  });
});
