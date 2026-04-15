import { test, expect } from '@playwright/test';
import { createBatchEvents } from './helpers';

const P = 't05p';

test.describe('GET /api/events/:eventName/properties — property metadata', () => {
  const API = 'http://localhost:3001';

  test.beforeAll(async ({ request }) => {
    // Seed events with known numeric and string properties
    const events = [];
    for (let i = 0; i < 10; i++) {
      events.push({
        event: `${P}-purchase`,
        device_id: `${P}-dev-${i}`,
        timestamp: new Date(2025, 5, 10 + i).toISOString(),
        properties: {
          amount: 10 + i * 5,
          quantity: i + 1,
          url: `/product-${i}`,
          button_name: `buy-btn-${i % 3}`,
          is_premium: i % 2 === 0,
        },
      });
    }
    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
  });

  test('returns array of property descriptors with { name, type, sample_values }', async ({ request }) => {
    const res = await request.get(`${API}/api/events/${P}-purchase/properties`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    for (const prop of body) {
      expect(prop).toHaveProperty('name');
      expect(prop).toHaveProperty('type');
      expect(prop).toHaveProperty('sample_values');
      expect(['string', 'number', 'boolean']).toContain(prop.type);
      expect(Array.isArray(prop.sample_values)).toBe(true);
    }
  });

  test('correctly detects numeric properties (amount, quantity) vs string properties (url, button_name)', async ({ request }) => {
    const res = await request.get(`${API}/api/events/${P}-purchase/properties`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    const byName: Record<string, { name: string; type: string; sample_values: string[] }> = {};
    for (const prop of body) {
      byName[prop.name] = prop;
    }

    expect(byName['amount']?.type).toBe('number');
    expect(byName['quantity']?.type).toBe('number');
    expect(byName['url']?.type).toBe('string');
    expect(byName['button_name']?.type).toBe('string');
  });

  test('returns 404 or empty array for unknown event name', async ({ request }) => {
    const res = await request.get(`${API}/api/events/${P}-nonexistent-event-xyz/properties`);
    const status = res.status();

    if (status === 200) {
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    } else {
      expect(status).toBe(404);
    }
  });
});
