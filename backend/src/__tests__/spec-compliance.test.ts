/**
 * Spec Compliance Tests — verification scenarios from CLAUDE.md
 *
 * Each test maps directly to a "Verification" section in the spec.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, post, get } from './test-server.js';

describe('Spec Compliance — CLAUDE.md Verification Scenarios', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // BR-101 Verification #1
  it('BR-101 V1: send anonymous events for device X, link to user Y, query user Y → all events appear', async () => {
    const deviceX = 'spec-v1-deviceX';
    const userY = 'spec-v1-userY@example.com';

    // Send anonymous event for device X
    await post('/api/events', { event: 'Page Viewed', device_id: deviceX, timestamp: '2025-01-10T00:00:00.000Z' });
    // Send 3 more for device X
    await post('/api/events', { event: 'Page Viewed', device_id: deviceX, timestamp: '2025-01-10T01:00:00.000Z' });
    await post('/api/events', { event: 'Button Clicked', device_id: deviceX, timestamp: '2025-01-10T02:00:00.000Z' });
    await post('/api/events', { event: 'Page Viewed', device_id: deviceX, timestamp: '2025-01-10T03:00:00.000Z' });

    // Send identified event linking device X to user Y
    await post('/api/events', { event: 'Login', device_id: deviceX, user_id: userY, timestamp: '2025-01-10T04:00:00.000Z' });

    // Query events for user Y — All 5 events MUST appear
    const res = await get('/api/events', { user_id: userY });
    const data = await res.json();
    expect(data.events).toHaveLength(5);
  });

  // BR-101 Verification #2
  it('BR-101 V2: link devices A and B to user Z, query user Z → events from both devices appear', async () => {
    const deviceA = 'spec-v2-deviceA';
    const deviceB = 'spec-v2-deviceB';
    const userZ = 'spec-v2-userZ@example.com';

    // Send anonymous events for device A
    await post('/api/events', { event: 'Page Viewed', device_id: deviceA, timestamp: '2025-01-11T00:00:00.000Z' });
    await post('/api/events', { event: 'Page Viewed', device_id: deviceA, timestamp: '2025-01-11T01:00:00.000Z' });

    // Send anonymous events for device B
    await post('/api/events', { event: 'Page Viewed', device_id: deviceB, timestamp: '2025-01-11T02:00:00.000Z' });

    // Link both to user Z
    await post('/api/events', { event: 'Login', device_id: deviceA, user_id: userZ, timestamp: '2025-01-11T03:00:00.000Z' });
    await post('/api/events', { event: 'Login', device_id: deviceB, user_id: userZ, timestamp: '2025-01-11T04:00:00.000Z' });

    // Query for user Z — events from both devices MUST appear
    const res = await get('/api/events', { user_id: userZ });
    const data = await res.json();
    expect(data.events).toHaveLength(5);

    const deviceIds = new Set(data.events.map((e: { device_id: string }) => e.device_id));
    expect(deviceIds.has(deviceA)).toBe(true);
    expect(deviceIds.has(deviceB)).toBe(true);
  });

  // BR-200 Verification
  it('BR-200: developer sends event via API, finds it in explorer by filtering on event name', async () => {
    const uniqueEventName = 'SpecVerify200_UniqueEvent';

    // Send event via API
    const createRes = await post('/api/events', {
      event: uniqueEventName,
      device_id: 'spec-v200-device',
      timestamp: '2025-02-01T00:00:00.000Z',
      properties: { page: '/test' },
    });
    expect(createRes.status).toBe(201);

    // Find it in explorer by filtering on event name
    const queryRes = await get('/api/events', { event_name: uniqueEventName });
    const data = await queryRes.json();
    expect(data.events.length).toBeGreaterThanOrEqual(1);
    expect(data.events[0].event).toBe(uniqueEventName);
    expect(data.events[0].properties).toEqual({ page: '/test' });
  });

  // BR-201 Verification #2
  it('BR-201 V2: unique users count < total event count when users repeat events', async () => {
    const eventName = 'SpecVerify201_Repeat';
    const userId = 'spec-v201-user@example.com';

    // Same user, 5 events
    for (let i = 0; i < 5; i++) {
      await post('/api/events', {
        event: eventName,
        user_id: userId,
        device_id: 'spec-v201-device',
        timestamp: `2025-02-02T0${i}:00:00.000Z`,
      });
    }

    const trendRes = await get('/api/trends', {
      event_name: eventName,
      start_date: '2025-02-02',
      end_date: '2025-02-02',
      granularity: 'day',
    });
    const trendData = await trendRes.json();

    const totalCount = trendData.data.reduce((s: number, d: { total_count: number }) => s + d.total_count, 0);
    const uniqueUsers = trendData.data.reduce((s: number, d: { unique_users: number }) => s + d.unique_users, 0);

    expect(totalCount).toBe(5);
    expect(uniqueUsers).toBe(1);
    expect(uniqueUsers).toBeLessThan(totalCount);
  });

  // BR-300 Verification
  it('BR-300: analyst measures "sum of amount" on Purchase Completed → correct daily revenue', async () => {
    const eventName = 'SpecVerify300_Purchase';

    await post('/api/events', {
      event: eventName,
      user_id: 'spec-v300-user-a',
      timestamp: '2025-03-01T10:00:00.000Z',
      properties: { amount: 100, currency: 'USD' },
    });
    await post('/api/events', {
      event: eventName,
      user_id: 'spec-v300-user-b',
      timestamp: '2025-03-01T11:00:00.000Z',
      properties: { amount: 250, currency: 'USD' },
    });
    await post('/api/events', {
      event: eventName,
      user_id: 'spec-v300-user-c',
      timestamp: '2025-03-02T10:00:00.000Z',
      properties: { amount: 75, currency: 'USD' },
    });

    const trendRes = await get('/api/trends', {
      event_name: eventName,
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      granularity: 'day',
      measure: 'sum',
      property: 'amount',
    });
    expect(trendRes.status).toBe(200);
    const trendData = await trendRes.json();

    // Find day data points
    const day1 = trendData.data.find((d: { date: string }) => d.date === '2025-03-01');
    const day2 = trendData.data.find((d: { date: string }) => d.date === '2025-03-02');

    expect(day1.value).toBe(350); // 100 + 250
    expect(day2.value).toBe(75);
  });

  // BR-302 Verification
  it('BR-302: breakdown "Page Viewed" by page → separate series for top pages', async () => {
    const eventName = 'SpecVerify302_PageViewed';

    // Create events with different page values
    const pages = ['/home', '/pricing', '/features', '/docs', '/blog', '/about'];
    for (const page of pages) {
      for (let i = 0; i < 3; i++) {
        await post('/api/events', {
          event: eventName,
          device_id: `spec-v302-device-${page}-${i}`,
          timestamp: '2025-04-01T10:00:00.000Z',
          properties: { page },
        });
      }
    }

    const trendRes = await get('/api/trends', {
      event_name: eventName,
      start_date: '2025-04-01',
      end_date: '2025-04-01',
      granularity: 'day',
      breakdown_by: 'page',
    });
    expect(trendRes.status).toBe(200);
    const trendData = await trendRes.json();

    // Should have series (with breakdown)
    expect(trendData.series).toBeDefined();
    expect(trendData.series.length).toBeGreaterThanOrEqual(2);

    // Each series should have a key and data array
    for (const s of trendData.series) {
      expect(s.key).toBeDefined();
      expect(s.data).toBeDefined();
      expect(Array.isArray(s.data)).toBe(true);
    }
  });

  // BR-303 Verification
  it('BR-303: anonymous step 1 + identified step 2 = one user, not a dropout', async () => {
    const deviceId = 'spec-v303-device';
    const userId = 'spec-v303-user@example.com';

    // Step 1: anonymous page view
    await post('/api/events', {
      event: 'SpecV303_PageViewed',
      device_id: deviceId,
      timestamp: '2025-05-01T00:00:00.000Z',
    });

    // Identify
    await post('/api/events', {
      event: 'Login',
      device_id: deviceId,
      user_id: userId,
      timestamp: '2025-05-01T01:00:00.000Z',
    });

    // Step 2: signup (now identified)
    await post('/api/events', {
      event: 'SpecV303_SignupCompleted',
      user_id: userId,
      device_id: deviceId,
      timestamp: '2025-05-01T02:00:00.000Z',
    });

    // Step 3: purchase
    await post('/api/events', {
      event: 'SpecV303_PurchaseCompleted',
      user_id: userId,
      device_id: deviceId,
      timestamp: '2025-05-01T03:00:00.000Z',
    });

    const funnelRes = await post('/api/funnels/query', {
      steps: ['SpecV303_PageViewed', 'SpecV303_SignupCompleted', 'SpecV303_PurchaseCompleted'],
      start_date: '2025-05-01T00:00:00.000Z',
      end_date: '2025-05-01T23:59:59.999Z',
    });
    expect(funnelRes.status).toBe(200);
    const data = await funnelRes.json();

    // User viewed page anonymously, signed up with identity → same user → not a dropout
    expect(data.steps[0].count).toBe(1);
    expect(data.steps[1].count).toBe(1);
    expect(data.steps[2].count).toBe(1);
    expect(data.overall_conversion_rate).toBe(1.0);
  });

  // BR-304 Verification
  it('BR-304: support lead searches user and sees events from both phone and laptop', async () => {
    const phone = 'spec-v304-phone';
    const laptop = 'spec-v304-laptop';
    const userId = 'charlie-spec@example.com';

    // Events from phone
    await post('/api/events', { event: 'Page Viewed', device_id: phone, timestamp: '2025-06-01T00:00:00.000Z' });
    await post('/api/events', { event: 'Button Clicked', device_id: phone, timestamp: '2025-06-01T01:00:00.000Z' });

    // Events from laptop
    await post('/api/events', { event: 'Page Viewed', device_id: laptop, timestamp: '2025-06-01T02:00:00.000Z' });

    // Identify both
    await post('/api/events', { event: 'Login', device_id: phone, user_id: userId, timestamp: '2025-06-01T03:00:00.000Z' });
    await post('/api/events', { event: 'Login', device_id: laptop, user_id: userId, timestamp: '2025-06-01T04:00:00.000Z' });

    // Look up user
    const profileRes = await get(`/api/users/${encodeURIComponent(userId)}`);
    expect(profileRes.status).toBe(200);
    const profile = await profileRes.json();

    expect(profile.user_id).toBe(userId);
    expect(profile.device_ids).toContain(phone);
    expect(profile.device_ids).toContain(laptop);
    expect(profile.total_events).toBe(5);
    expect(profile.events).toHaveLength(5);

    // Verify both devices present in events
    const deviceIds = new Set(profile.events.map((e: { device_id: string }) => e.device_id));
    expect(deviceIds.has(phone)).toBe(true);
    expect(deviceIds.has(laptop)).toBe(true);
  });
});
