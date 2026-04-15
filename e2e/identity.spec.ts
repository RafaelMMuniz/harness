import { test, expect } from '@playwright/test';
import { createEvent, getEvents } from './helpers';

const PREFIX = 'test-t02-id';

test.describe('Identity resolution (BR-101 scenarios)', () => {
  test('retroactive merge: anonymous events are attributed after identity linking', async ({ request }) => {
    const deviceId = `${PREFIX}-device-retro`;
    const userId = `${PREFIX}-user-retro`;

    // Create 4 anonymous events with only device_id
    for (let i = 0; i < 4; i++) {
      const res = await createEvent(request, {
        event: `${PREFIX}-anon-event-${i}`,
        device_id: deviceId,
        timestamp: `2025-06-01T0${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Create 1 event that links device to user (triggers identity mapping)
    const linkRes = await createEvent(request, {
      event: `${PREFIX}-identify`,
      device_id: deviceId,
      user_id: userId,
      timestamp: '2025-06-01T04:00:00.000Z',
    });
    expect(linkRes.status()).toBe(201);

    // Query by user_id — all 5 events should be returned
    const eventsRes = await getEvents(request, { user_id: userId });
    expect(eventsRes.status()).toBe(200);
    const body = await eventsRes.json();
    expect(body.events.length).toBe(5);
  });

  test('multi-device merge: events from multiple devices attributed to single user', async ({ request }) => {
    const deviceA = `${PREFIX}-device-multi-A`;
    const deviceB = `${PREFIX}-device-multi-B`;
    const userId = `${PREFIX}-user-multi`;

    // Create 2 anonymous events for device A
    for (let i = 0; i < 2; i++) {
      const res = await createEvent(request, {
        event: `${PREFIX}-devA-event-${i}`,
        device_id: deviceA,
        timestamp: `2025-06-02T0${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Create 2 anonymous events for device B
    for (let i = 0; i < 2; i++) {
      const res = await createEvent(request, {
        event: `${PREFIX}-devB-event-${i}`,
        device_id: deviceB,
        timestamp: `2025-06-02T0${2 + i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Link device A to user
    const linkA = await createEvent(request, {
      event: `${PREFIX}-identify-A`,
      device_id: deviceA,
      user_id: userId,
      timestamp: '2025-06-02T04:00:00.000Z',
    });
    expect(linkA.status()).toBe(201);

    // Link device B to same user
    const linkB = await createEvent(request, {
      event: `${PREFIX}-identify-B`,
      device_id: deviceB,
      user_id: userId,
      timestamp: '2025-06-02T05:00:00.000Z',
    });
    expect(linkB.status()).toBe(201);

    // Query by user_id — events from both devices should appear
    const eventsRes = await getEvents(request, { user_id: userId });
    expect(eventsRes.status()).toBe(200);
    const body = await eventsRes.json();
    // 2 anonymous from A + 2 anonymous from B + 1 link A + 1 link B = 6
    expect(body.events.length).toBe(6);
  });

  test('collision rejection: device already mapped to different user returns 409', async ({ request }) => {
    const deviceId = `${PREFIX}-device-collision`;
    const userP = `${PREFIX}-user-P`;
    const userQ = `${PREFIX}-user-Q`;

    // First event creates the mapping: device -> userP
    const first = await createEvent(request, {
      event: `${PREFIX}-map-P`,
      device_id: deviceId,
      user_id: userP,
      timestamp: '2025-06-03T00:00:00.000Z',
    });
    expect(first.status()).toBe(201);

    // Second event tries to map same device to userQ — should be rejected
    const second = await createEvent(request, {
      event: `${PREFIX}-map-Q`,
      device_id: deviceId,
      user_id: userQ,
      timestamp: '2025-06-03T01:00:00.000Z',
    });
    expect(second.status()).toBe(409);
  });

  test('unresolved device: events for unmapped device returned by device_id only', async ({ request }) => {
    const deviceId = `${PREFIX}-device-unresolved`;

    // Create 3 events for a device that is never mapped to a user
    for (let i = 0; i < 3; i++) {
      const res = await createEvent(request, {
        event: `${PREFIX}-unresolved-${i}`,
        device_id: deviceId,
        timestamp: `2025-06-04T0${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Query by device_id — should return exactly these 3 events
    const eventsRes = await getEvents(request, { device_id: deviceId });
    expect(eventsRes.status()).toBe(200);
    const body = await eventsRes.json();
    expect(body.events.length).toBe(3);
    for (const ev of body.events) {
      expect(ev.device_id).toBe(deviceId);
    }
  });
});
