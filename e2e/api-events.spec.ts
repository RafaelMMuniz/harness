import { test, expect } from '@playwright/test';
import {
  createEvent,
  createBatchEvents,
  type EventPayload,
} from './helpers';

// ---------------------------------------------------------------------------
// POST /api/events
// ---------------------------------------------------------------------------

test.describe('POST /api/events', () => {
  test('all fields present returns 201 with stored event including generated id', async ({
    request,
  }) => {
    const payload: EventPayload = {
      event: 'api-events-all-fields',
      device_id: 'api-events-device-1',
      user_id: 'api-events-user-1',
      timestamp: '2024-01-15T10:00:00.000Z',
      properties: { plan: 'pro', amount: 99, trial: false },
    };

    const response = await createEvent(request, payload);

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(body.event).toBe(payload.event);
    expect(body.device_id).toBe(payload.device_id);
    expect(body.user_id).toBe(payload.user_id);
    expect(body.timestamp).toBe(payload.timestamp);
  });

  test('minimal fields (event + device_id only) returns 201', async ({
    request,
  }) => {
    const response = await createEvent(request, {
      event: 'api-events-minimal-device',
      device_id: 'api-events-device-2',
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(typeof body.id).toBe('string');
    expect(body.event).toBe('api-events-minimal-device');
    expect(body.device_id).toBe('api-events-device-2');
  });

  test('minimal fields (event + user_id only) returns 201', async ({
    request,
  }) => {
    const response = await createEvent(request, {
      event: 'api-events-minimal-user',
      user_id: 'api-events-user-2',
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(typeof body.id).toBe('string');
    expect(body.event).toBe('api-events-minimal-user');
    expect(body.user_id).toBe('api-events-user-2');
  });

  test('missing event name returns 400 with { error } body', async ({
    request,
  }) => {
    // Cast to any so we can send a deliberately invalid payload
    const response = await createEvent(request, {
      device_id: 'api-events-device-3',
    } as EventPayload);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('missing both device_id and user_id returns 400 with { error } body', async ({
    request,
  }) => {
    const response = await createEvent(request, {
      event: 'api-events-no-identity',
    } as EventPayload);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('omitted timestamp returns 201 with server-set ISO 8601 timestamp', async ({
    request,
  }) => {
    const before = new Date().toISOString();

    const response = await createEvent(request, {
      event: 'api-events-no-timestamp',
      device_id: 'api-events-device-4',
    });

    const after = new Date().toISOString();

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(typeof body.timestamp).toBe('string');

    // Must parse as a valid date
    const ts = new Date(body.timestamp);
    expect(Number.isNaN(ts.getTime())).toBe(false);

    // Must be a valid ISO 8601 string (contains T and ends with Z or offset)
    expect(body.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    );

    // Server-assigned time must be within the test window
    expect(ts >= new Date(before)).toBe(true);
    expect(ts <= new Date(after)).toBe(true);
  });

  test('properties object round-trips as object (not stringified JSON)', async ({
    request,
  }) => {
    const properties = {
      page: '/home',
      duration_ms: 1234,
      is_logged_in: true,
    };

    const response = await createEvent(request, {
      event: 'api-events-properties-roundtrip',
      device_id: 'api-events-device-5',
      properties,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    // Properties must come back as a plain object, not a JSON string
    expect(typeof body.properties).toBe('object');
    expect(body.properties).not.toBeNull();
    expect(typeof body.properties).not.toBe('string');

    expect(body.properties.page).toBe('/home');
    expect(body.properties.duration_ms).toBe(1234);
    expect(body.properties.is_logged_in).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/events/batch
// ---------------------------------------------------------------------------

test.describe('POST /api/events/batch', () => {
  test('array of valid events returns 200 with { accepted: N, errors: [] }', async ({
    request,
  }) => {
    const events: EventPayload[] = [
      { event: 'api-events-batch-event-a', device_id: 'api-events-batch-device-1' },
      { event: 'api-events-batch-event-b', device_id: 'api-events-batch-device-2' },
      { event: 'api-events-batch-event-c', user_id: 'api-events-batch-user-1' },
    ];

    const response = await createBatchEvents(request, events);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.accepted).toBe(events.length);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors).toHaveLength(0);
  });

  test('mix of valid and invalid events: accepted = valid count, errors has { index, message }', async ({
    request,
  }) => {
    const events = [
      // index 0 — valid
      { event: 'api-events-batch-mix-valid-1', device_id: 'api-events-batch-device-3' },
      // index 1 — invalid: missing event name
      { device_id: 'api-events-batch-device-4' } as EventPayload,
      // index 2 — valid
      { event: 'api-events-batch-mix-valid-2', user_id: 'api-events-batch-user-2' },
      // index 3 — invalid: missing identity
      { event: 'api-events-batch-mix-no-identity' } as EventPayload,
    ];

    const response = await createBatchEvents(request, events);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.accepted).toBe(2);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors).toHaveLength(2);

    // Each error must have an index and a message
    for (const err of body.errors) {
      expect(typeof err.index).toBe('number');
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    }

    // Error indices must correspond to the invalid events (1 and 3)
    const errorIndices: number[] = body.errors.map((e: { index: number }) => e.index).sort();
    expect(errorIndices).toEqual([1, 3]);
  });

  test('empty array returns 400', async ({ request }) => {
    const response = await createBatchEvents(request, []);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('more than 1000 events returns 400', async ({ request }) => {
    // Build 1001 minimal valid events
    const events: EventPayload[] = Array.from({ length: 1001 }, (_, i) => ({
      event: 'api-events-batch-overflow',
      device_id: `api-events-batch-overflow-device-${i}`,
    }));

    const response = await createBatchEvents(request, events);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});
