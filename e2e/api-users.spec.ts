import { test, expect } from '@playwright/test';
import { createEvent, getUserProfile } from './helpers';

// Unique prefix for this test file
const P = 't01u';

test.describe('GET /api/users/:id — user profile lookup', () => {
  // Seed: create a user with a device mapping and multiple events
  test.beforeAll(async ({ request }) => {
    // Anonymous events from a device
    await createEvent(request, {
      event: `${P}-page-viewed`,
      device_id: `${P}-device-alpha`,
      timestamp: '2025-06-10T08:00:00.000Z',
      properties: { url: '/home' },
    });
    await createEvent(request, {
      event: `${P}-button-clicked`,
      device_id: `${P}-device-alpha`,
      timestamp: '2025-06-10T09:00:00.000Z',
      properties: { button: 'cta' },
    });

    // Identify: link device to user (creates identity mapping)
    await createEvent(request, {
      event: `${P}-sign-up`,
      device_id: `${P}-device-alpha`,
      user_id: `${P}-user-known`,
      timestamp: '2025-06-10T10:00:00.000Z',
      properties: { plan: 'free' },
    });

    // Post-identification event with user_id only
    await createEvent(request, {
      event: `${P}-purchase`,
      user_id: `${P}-user-known`,
      timestamp: '2025-06-11T12:00:00.000Z',
      properties: { amount: 99 },
    });
  });

  test('returns user profile for known user_id with correct shape', async ({ request }) => {
    const res = await getUserProfile(request, `${P}-user-known`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.user_id).toBe(`${P}-user-known`);
    expect(Array.isArray(body.device_ids)).toBe(true);
    expect(body.device_ids).toContain(`${P}-device-alpha`);
    expect(typeof body.total_events).toBe('number');
    expect(body.total_events).toBeGreaterThanOrEqual(4);
    expect(body).toHaveProperty('first_seen');
    expect(body).toHaveProperty('last_seen');

    // Verify chronological order of first/last seen
    const firstSeen = new Date(body.first_seen).getTime();
    const lastSeen = new Date(body.last_seen).getTime();
    expect(lastSeen).toBeGreaterThanOrEqual(firstSeen);
  });

  test('resolves device_id to mapped user and returns full user profile', async ({ request }) => {
    // Looking up the device should resolve to the user it's mapped to
    const res = await getUserProfile(request, `${P}-device-alpha`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Should resolve to the user, not return a device-level profile
    expect(body.user_id).toBe(`${P}-user-known`);
    expect(body.device_ids).toContain(`${P}-device-alpha`);
    expect(body.total_events).toBeGreaterThanOrEqual(4);
  });

  test('returns 404 for unknown ID', async ({ request }) => {
    const res = await getUserProfile(request, `${P}-nonexistent-user-xyz`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
