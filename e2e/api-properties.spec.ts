import { test, expect } from '@playwright/test';
import { createBatchEvents, type EventPayload } from './helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function propertiesUrl(eventName: string): string {
  return `http://localhost:3001/api/events/${encodeURIComponent(eventName)}/properties`;
}

// ---------------------------------------------------------------------------
// GET /api/events/:eventName/properties — response shape
// ---------------------------------------------------------------------------

test.describe('GET /api/events/:eventName/properties — response shape', () => {
  const EVENT = 'test-props-shape-event';

  test.beforeAll(async ({ request }) => {
    // Seed events with a mix of property types
    const events: EventPayload[] = [
      {
        event: EVENT,
        device_id: 'test-props-shape-device-1',
        properties: {
          amount: 99.99,
          quantity: 3,
          url: '/home',
          button_name: 'Buy',
          is_trial: false,
        },
      },
      {
        event: EVENT,
        device_id: 'test-props-shape-device-2',
        properties: {
          amount: 49.0,
          quantity: 1,
          url: '/pricing',
          button_name: 'Subscribe',
          is_trial: true,
        },
      },
      {
        event: EVENT,
        device_id: 'test-props-shape-device-3',
        properties: {
          amount: 149.5,
          quantity: 5,
          url: '/checkout',
          button_name: 'Complete Purchase',
          is_trial: false,
        },
      },
    ];

    await createBatchEvents(request, events);
  });

  test('returns an array of property descriptors', async ({ request }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('each property descriptor has name, type, and sample_values fields', async ({
    request,
  }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);

    for (const prop of body) {
      expect(typeof prop.name).toBe('string');
      expect(prop.name.length).toBeGreaterThan(0);

      expect(['string', 'number', 'boolean']).toContain(prop.type);

      expect(Array.isArray(prop.sample_values)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/events/:eventName/properties — type detection
// ---------------------------------------------------------------------------

test.describe('GET /api/events/:eventName/properties — type detection', () => {
  const EVENT = 'test-props-types-event';

  test.beforeAll(async ({ request }) => {
    const events: EventPayload[] = [
      {
        event: EVENT,
        device_id: 'test-props-types-device-1',
        properties: {
          amount: 99.99,
          quantity: 3,
          url: '/home',
          button_name: 'Buy',
          is_active: true,
        },
      },
      {
        event: EVENT,
        device_id: 'test-props-types-device-2',
        properties: {
          amount: 29.0,
          quantity: 10,
          url: '/landing',
          button_name: 'Get Started',
          is_active: false,
        },
      },
      {
        event: EVENT,
        device_id: 'test-props-types-device-3',
        properties: {
          amount: 199.99,
          quantity: 1,
          url: '/checkout',
          button_name: 'Complete',
          is_active: true,
        },
      },
    ];

    await createBatchEvents(request, events);
  });

  test('numeric properties (amount, quantity) are detected as type=number', async ({
    request,
  }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body: { name: string; type: string; sample_values: unknown[] }[] =
      await response.json();

    const amountProp = body.find((p) => p.name === 'amount');
    expect(amountProp).toBeDefined();
    expect(amountProp!.type).toBe('number');

    const quantityProp = body.find((p) => p.name === 'quantity');
    expect(quantityProp).toBeDefined();
    expect(quantityProp!.type).toBe('number');
  });

  test('string properties (url, button_name) are detected as type=string', async ({
    request,
  }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body: { name: string; type: string; sample_values: unknown[] }[] =
      await response.json();

    const urlProp = body.find((p) => p.name === 'url');
    expect(urlProp).toBeDefined();
    expect(urlProp!.type).toBe('string');

    const buttonNameProp = body.find((p) => p.name === 'button_name');
    expect(buttonNameProp).toBeDefined();
    expect(buttonNameProp!.type).toBe('string');
  });

  test('boolean properties (is_active) are detected as type=boolean', async ({
    request,
  }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body: { name: string; type: string; sample_values: unknown[] }[] =
      await response.json();

    const isActiveProp = body.find((p) => p.name === 'is_active');
    expect(isActiveProp).toBeDefined();
    expect(isActiveProp!.type).toBe('boolean');
  });

  test('sample_values for a numeric property contains numbers', async ({
    request,
  }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body: { name: string; type: string; sample_values: unknown[] }[] =
      await response.json();

    const amountProp = body.find((p) => p.name === 'amount');
    expect(amountProp).toBeDefined();
    expect(amountProp!.sample_values.length).toBeGreaterThan(0);

    for (const val of amountProp!.sample_values) {
      expect(typeof val).toBe('number');
    }
  });

  test('sample_values for a string property contains strings', async ({
    request,
  }) => {
    const response = await request.get(propertiesUrl(EVENT));

    expect(response.status()).toBe(200);

    const body: { name: string; type: string; sample_values: unknown[] }[] =
      await response.json();

    const urlProp = body.find((p) => p.name === 'url');
    expect(urlProp).toBeDefined();
    expect(urlProp!.sample_values.length).toBeGreaterThan(0);

    for (const val of urlProp!.sample_values) {
      expect(typeof val).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/events/:eventName/properties — unknown event name
// ---------------------------------------------------------------------------

test.describe('GET /api/events/:eventName/properties — unknown event name', () => {
  test('returns 404 or empty array for an event name that has never been seeded', async ({
    request,
  }) => {
    const response = await request.get(
      propertiesUrl('test-props-this-event-name-does-not-exist-xyz'),
    );

    // The API may return either a 404 status or a 200 with an empty array —
    // both are acceptable representations of "no data found".
    const isNotFound = response.status() === 404;
    const isEmptyOk = response.status() === 200;

    expect(isNotFound || isEmptyOk).toBe(true);

    if (isEmptyOk) {
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    }

    if (isNotFound) {
      const body = await response.json();
      // A 404 should carry an explanatory error message
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    }
  });
});
