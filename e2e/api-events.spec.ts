import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents } from './helpers';

test.describe('POST /api/events — single event ingestion', () => {
  test('accepts event with all fields and returns 201 with stored event', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-full-event',
      device_id: 't01-device-full',
      user_id: 't01-user-full',
      timestamp: '2025-06-15T12:00:00.000Z',
      properties: { url: '/home', button: 'signup' },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.event).toBe('test-t01-full-event');
    expect(body.device_id).toBe('t01-device-full');
    expect(body.user_id).toBe('t01-user-full');
    expect(body.timestamp).toBe('2025-06-15T12:00:00.000Z');
    expect(body.properties).toEqual({ url: '/home', button: 'signup' });
  });

  test('accepts event with minimal fields (event + device_id only) and returns 201', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-device-only',
      device_id: 't01-device-minimal',
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.event).toBe('test-t01-device-only');
    expect(body.device_id).toBe('t01-device-minimal');
  });

  test('accepts event with minimal fields (event + user_id only) and returns 201', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-user-only',
      user_id: 't01-user-minimal',
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.event).toBe('test-t01-user-only');
    expect(body.user_id).toBe('t01-user-minimal');
  });

  test('rejects event missing event name with 400', async ({ request }) => {
    const res = await createEvent(request, {
      event: '',
      device_id: 't01-device-noname',
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('rejects event missing both device_id and user_id with 400', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-no-identity',
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('sets server timestamp when timestamp is omitted and returns 201', async ({ request }) => {
    const before = new Date().toISOString();
    const res = await createEvent(request, {
      event: 'test-t01-auto-timestamp',
      device_id: 't01-device-autots',
    });
    const after = new Date().toISOString();

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    // Verify it's a valid ISO 8601 string within the expected window
    const ts = new Date(body.timestamp);
    expect(ts.getTime()).toBeGreaterThanOrEqual(new Date(before).getTime() - 1000);
    expect(ts.getTime()).toBeLessThanOrEqual(new Date(after).getTime() + 1000);
  });

  test('round-trips properties as object (not stringified JSON)', async ({ request }) => {
    const props = { amount: 42, currency: 'USD', nested: { key: 'value' } };
    const res = await createEvent(request, {
      event: 'test-t01-props-roundtrip',
      device_id: 't01-device-props',
      properties: props,
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(typeof body.properties).toBe('object');
    expect(body.properties).toEqual(props);
  });
});

test.describe('POST /api/events/batch — batch event ingestion', () => {
  test('accepts batch of valid events and returns 200 with accepted count', async ({ request }) => {
    const events = [
      { event: 'test-t01-batch-a', device_id: 't01-batch-dev-1' },
      { event: 'test-t01-batch-b', device_id: 't01-batch-dev-2' },
      { event: 'test-t01-batch-c', user_id: 't01-batch-user-1' },
    ];

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(3);
    expect(body.errors).toEqual([]);
  });

  test('handles mix of valid and invalid events — reports errors per invalid event', async ({ request }) => {
    const events = [
      { event: 'test-t01-batch-valid', device_id: 't01-batch-mix-dev' },
      { event: '', device_id: 't01-batch-mix-noname' },          // invalid: empty event name
      { event: 'test-t01-batch-no-id' } as any,                  // invalid: no identity
      { event: 'test-t01-batch-valid-2', user_id: 't01-batch-mix-user' },
    ];

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(2);
    expect(body.errors).toHaveLength(2);
    // Each error should identify which event failed and why
    for (const err of body.errors) {
      expect(err).toHaveProperty('index');
      expect(err).toHaveProperty('message');
      expect(typeof err.index).toBe('number');
      expect(typeof err.message).toBe('string');
    }
    // Verify the indices match the invalid events
    const indices = body.errors.map((e: { index: number }) => e.index).sort();
    expect(indices).toEqual([1, 2]);
  });

  test('rejects empty batch array with 400', async ({ request }) => {
    const res = await createBatchEvents(request, []);
    expect(res.status()).toBe(400);
  });

  test('rejects batch with more than 1000 events with 400', async ({ request }) => {
    const events = Array.from({ length: 1001 }, (_, i) => ({
      event: `test-t01-batch-overflow-${i}`,
      device_id: `t01-overflow-dev-${i}`,
    }));

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(400);
  });
});
