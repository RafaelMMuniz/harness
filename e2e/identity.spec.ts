import { test, expect } from '@playwright/test';
import { createEvent, getEvents } from './helpers';

// Unique prefix for this test file — avoids collisions with other specs
const P = 't02';

test.describe('BR-101 — Identity resolution', () => {
  test('retroactive merge: anonymous events resolve to user after identification', async ({ request }) => {
    const deviceId = `${P}-device-retro`;
    const userId = `${P}-user-retro`;

    // Create 4 anonymous events with only device_id
    for (let i = 0; i < 4; i++) {
      const res = await createEvent(request, {
        event: `${P}-anon-action`,
        device_id: deviceId,
        timestamp: `2025-07-01T0${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Create 1 identifying event — this triggers the device→user mapping
    const identifyRes = await createEvent(request, {
      event: `${P}-identify`,
      device_id: deviceId,
      user_id: userId,
      timestamp: '2025-07-01T05:00:00.000Z',
    });
    expect(identifyRes.status()).toBe(201);

    // Query by user_id — all 5 events (4 anonymous + 1 identifying) should appear
    const queryRes = await getEvents(request, { user_id: userId });
    expect(queryRes.ok()).toBe(true);
    const body = await queryRes.json();
    expect(body.events.length).toBe(5);
  });

  test('multi-device merge: events from multiple devices resolve to same user', async ({ request }) => {
    const deviceA = `${P}-device-multi-a`;
    const deviceB = `${P}-device-multi-b`;
    const userId = `${P}-user-multi`;

    // Create events for device A (anonymous)
    for (let i = 0; i < 2; i++) {
      const res = await createEvent(request, {
        event: `${P}-browse`,
        device_id: deviceA,
        timestamp: `2025-07-02T0${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Create events for device B (anonymous)
    for (let i = 0; i < 3; i++) {
      const res = await createEvent(request, {
        event: `${P}-browse`,
        device_id: deviceB,
        timestamp: `2025-07-02T1${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Link device A to user
    const linkA = await createEvent(request, {
      event: `${P}-login-a`,
      device_id: deviceA,
      user_id: userId,
      timestamp: '2025-07-02T20:00:00.000Z',
    });
    expect(linkA.status()).toBe(201);

    // Link device B to same user
    const linkB = await createEvent(request, {
      event: `${P}-login-b`,
      device_id: deviceB,
      user_id: userId,
      timestamp: '2025-07-02T21:00:00.000Z',
    });
    expect(linkB.status()).toBe(201);

    // Query by user_id — events from both devices should appear
    const queryRes = await getEvents(request, { user_id: userId });
    expect(queryRes.ok()).toBe(true);
    const body = await queryRes.json();
    // 2 (device A anon) + 3 (device B anon) + 1 (link A) + 1 (link B) = 7
    expect(body.events.length).toBe(7);
  });

  test('collision rejection: device already mapped to a different user returns 409', async ({ request }) => {
    const deviceId = `${P}-device-collision`;
    const userP = `${P}-user-p`;
    const userQ = `${P}-user-q`;

    // First mapping: device → user P (should succeed)
    const first = await createEvent(request, {
      event: `${P}-signup`,
      device_id: deviceId,
      user_id: userP,
      timestamp: '2025-07-03T01:00:00.000Z',
    });
    expect(first.status()).toBe(201);

    // Second mapping attempt: same device → different user Q (should be rejected)
    const second = await createEvent(request, {
      event: `${P}-signup`,
      device_id: deviceId,
      user_id: userQ,
      timestamp: '2025-07-03T02:00:00.000Z',
    });
    expect(second.status()).toBe(409);
  });

  test('unresolved device: device with no mapping returns only its own events', async ({ request }) => {
    const deviceId = `${P}-device-unresolved`;

    // Create events for a device that is NEVER linked to a user
    for (let i = 0; i < 3; i++) {
      const res = await createEvent(request, {
        event: `${P}-anon-browse`,
        device_id: deviceId,
        timestamp: `2025-07-04T0${i}:00:00.000Z`,
      });
      expect(res.status()).toBe(201);
    }

    // Query by device_id — only events from this device should appear
    const queryRes = await getEvents(request, { device_id: deviceId });
    expect(queryRes.ok()).toBe(true);
    const body = await queryRes.json();
    expect(body.events.length).toBe(3);
    // Verify every returned event belongs to this device
    for (const ev of body.events) {
      expect(ev.device_id).toBe(deviceId);
    }
  });
});
