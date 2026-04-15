import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents, type EventPayload } from './helpers';

test.describe('POST /api/events — single event ingestion', () => {
  test('with all fields returns 201 with stored event including generated id', async ({ request }) => {
    const payload: EventPayload = {
      event: 'test-t01-full-event',
      device_id: 'test-t01-device-full',
      user_id: 'test-t01-user-full',
      timestamp: '2025-01-15T10:30:00.000Z',
      properties: { url: '/home', button: 'cta' },
    };
    const res = await createEvent(request, payload);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.event_name ?? body.event).toBe('test-t01-full-event');
    expect(body.device_id).toBe('test-t01-device-full');
    expect(body.user_id).toBe('test-t01-user-full');
    expect(body.timestamp).toBe('2025-01-15T10:30:00.000Z');
  });

  test('with minimal fields (event + device_id only) returns 201', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-minimal-device',
      device_id: 'test-t01-device-min',
    });
    expect(res.status()).toBe(201);
  });

  test('with minimal fields (event + user_id only) returns 201', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-minimal-user',
      user_id: 'test-t01-user-min',
    });
    expect(res.status()).toBe(201);
  });

  test('missing event name returns 400 with { error } body', async ({ request }) => {
    const res = await createEvent(request, {
      event: '',
      device_id: 'test-t01-device-noname',
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('missing both device_id and user_id returns 400 with { error } body', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-no-identity',
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('with omitted timestamp returns 201 and response contains server-set ISO 8601 timestamp', async ({ request }) => {
    const res = await createEvent(request, {
      event: 'test-t01-auto-ts',
      device_id: 'test-t01-device-autots',
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.timestamp).toBeTruthy();
    // Verify ISO 8601 format
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  test('with properties object returns 201 and properties round-trip as object (not stringified JSON)', async ({ request }) => {
    const props = { amount: 42, plan: 'pro', nested: { key: 'val' } };
    const res = await createEvent(request, {
      event: 'test-t01-props-rt',
      device_id: 'test-t01-device-props',
      properties: props,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(typeof body.properties).toBe('object');
    expect(body.properties).not.toBeNull();
    expect(body.properties.amount).toBe(42);
    expect(body.properties.plan).toBe('pro');
  });
});

test.describe('POST /api/events/batch — batch event ingestion', () => {
  test('with array of valid events returns 200 with { accepted: N, errors: [] }', async ({ request }) => {
    const events: EventPayload[] = [
      { event: 'test-t01-batch-a', device_id: 'test-t01-batch-dev-1' },
      { event: 'test-t01-batch-b', device_id: 'test-t01-batch-dev-2' },
      { event: 'test-t01-batch-c', user_id: 'test-t01-batch-user-1' },
    ];
    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(3);
    expect(body.errors).toEqual([]);
  });

  test('with mix of valid and invalid events returns 200, accepted = valid count, errors has entries', async ({ request }) => {
    const events: EventPayload[] = [
      { event: 'test-t01-batch-valid', device_id: 'test-t01-batch-mix-dev' },
      { event: '', device_id: 'test-t01-batch-mix-invalid' }, // invalid: empty event name
      { event: 'test-t01-batch-no-id' } as EventPayload, // invalid: no identity
      { event: 'test-t01-batch-valid2', user_id: 'test-t01-batch-mix-user' },
    ];
    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(2);
    expect(body.errors.length).toBe(2);
    for (const err of body.errors) {
      expect(err).toHaveProperty('index');
      expect(err).toHaveProperty('message');
    }
  });

  test('with empty array returns 400', async ({ request }) => {
    const res = await createBatchEvents(request, []);
    expect(res.status()).toBe(400);
  });

  test('with >1000 events returns 400', async ({ request }) => {
    const events: EventPayload[] = Array.from({ length: 1001 }, (_, i) => ({
      event: `test-t01-batch-overflow-${i}`,
      device_id: `test-t01-overflow-dev-${i}`,
    }));
    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(400);
  });
});
