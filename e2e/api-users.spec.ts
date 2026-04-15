import { test, expect } from '@playwright/test';
import { createEvent, getUserProfile } from './helpers';

const PREFIX = 'test-t01-users';

test.describe('GET /api/users/:id — user profile', () => {
  test.beforeAll(async ({ request }) => {
    // Create anonymous events for a device, then identify it
    await createEvent(request, {
      event: `${PREFIX}-page-view`,
      device_id: `${PREFIX}-device-A`,
      timestamp: '2025-04-01T08:00:00.000Z',
      properties: { url: '/home' },
    });
    await createEvent(request, {
      event: `${PREFIX}-click`,
      device_id: `${PREFIX}-device-A`,
      timestamp: '2025-04-01T09:00:00.000Z',
    });
    // Identify: link device to user (creates identity mapping)
    await createEvent(request, {
      event: `${PREFIX}-sign-up`,
      device_id: `${PREFIX}-device-A`,
      user_id: `${PREFIX}-user-1`,
      timestamp: '2025-04-01T10:00:00.000Z',
    });
    // One more event as the identified user
    await createEvent(request, {
      event: `${PREFIX}-purchase`,
      user_id: `${PREFIX}-user-1`,
      timestamp: '2025-04-01T11:00:00.000Z',
      properties: { amount: 29.99 },
    });
  });

  test('with known user_id returns { user_id, device_ids, total_events, first_seen, last_seen }', async ({ request }) => {
    const res = await getUserProfile(request, `${PREFIX}-user-1`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user_id).toBe(`${PREFIX}-user-1`);
    expect(Array.isArray(body.device_ids)).toBe(true);
    expect(body.device_ids).toContain(`${PREFIX}-device-A`);
    expect(typeof body.total_events).toBe('number');
    expect(body.total_events).toBeGreaterThanOrEqual(4);
    expect(body).toHaveProperty('first_seen');
    expect(body).toHaveProperty('last_seen');
  });

  test('with device_id that has a mapping returns the resolved user profile', async ({ request }) => {
    const res = await getUserProfile(request, `${PREFIX}-device-A`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Should resolve to the mapped user
    expect(body.user_id).toBe(`${PREFIX}-user-1`);
    expect(body.device_ids).toContain(`${PREFIX}-device-A`);
  });

  test('with unknown ID returns 404 with { error } body', async ({ request }) => {
    const res = await getUserProfile(request, `${PREFIX}-nonexistent-id`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
