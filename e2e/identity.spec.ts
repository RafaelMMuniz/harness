import { test, expect } from '@playwright/test';
import { createEvent, getEvents } from './helpers';

test('retroactive merge: anonymous events attributed to user after identity link', async ({ request }) => {
  // Seed 4 anonymous events for device X
  await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-X' });
  await createEvent(request, { event: 'button_clicked', device_id: 'test-identity-device-X' });
  await createEvent(request, { event: 'form_submitted', device_id: 'test-identity-device-X' });
  await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-X' });

  // 5th event links device X to user Y — triggers identity mapping
  await createEvent(request, {
    event: 'signup_completed',
    device_id: 'test-identity-device-X',
    user_id: 'test-identity-user-Y',
  });

  // Query all events for user Y — all 5 must appear
  const response = await getEvents(request, { user_id: 'test-identity-user-Y' });
  expect(response.status()).toBe(200);

  const body = await response.json();
  const events: unknown[] = Array.isArray(body) ? body : body.events ?? [];
  expect(events.length).toBeGreaterThanOrEqual(5);
});

test('multi-device merge: events from two devices both attributed to one user', async ({ request }) => {
  // Seed anonymous events for device A
  await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-A' });
  await createEvent(request, { event: 'button_clicked', device_id: 'test-identity-device-A' });

  // Seed anonymous events for device B
  await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-B' });
  await createEvent(request, { event: 'feature_used', device_id: 'test-identity-device-B' });

  // Link device A to user Z
  await createEvent(request, {
    event: 'login',
    device_id: 'test-identity-device-A',
    user_id: 'test-identity-user-Z',
  });

  // Link device B to user Z
  await createEvent(request, {
    event: 'login',
    device_id: 'test-identity-device-B',
    user_id: 'test-identity-user-Z',
  });

  // Query all events for user Z — events from both devices must appear
  const response = await getEvents(request, { user_id: 'test-identity-user-Z' });
  expect(response.status()).toBe(200);

  const body = await response.json();
  const events: unknown[] = Array.isArray(body) ? body : body.events ?? [];
  expect(events.length).toBeGreaterThanOrEqual(6);
});

test('collision rejection: mapping a device to a second user returns 409', async ({ request }) => {
  // First mapping: device C -> user P
  const firstLink = await createEvent(request, {
    event: 'signup_completed',
    device_id: 'test-identity-device-C',
    user_id: 'test-identity-user-P',
  });
  expect(firstLink.status()).toBe(200);

  // Attempt second mapping: device C -> user Q — must be rejected
  const secondLink = await createEvent(request, {
    event: 'signup_completed',
    device_id: 'test-identity-device-C',
    user_id: 'test-identity-user-Q',
  });
  expect(secondLink.status()).toBe(409);
});

test('unresolved device: events queryable by device_id when no user mapping exists', async ({ request }) => {
  // Seed events for device D — never create a user mapping
  await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-D' });
  await createEvent(request, { event: 'button_clicked', device_id: 'test-identity-device-D' });
  await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-D' });

  // Query by device_id — should return only those events
  const response = await getEvents(request, { device_id: 'test-identity-device-D' });
  expect(response.status()).toBe(200);

  const body = await response.json();
  const events: unknown[] = Array.isArray(body) ? body : body.events ?? [];
  expect(events.length).toBeGreaterThanOrEqual(3);
});
