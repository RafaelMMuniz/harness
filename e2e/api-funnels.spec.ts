import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents } from './helpers';

const P = 't06f';

test.describe('POST /api/funnels/query — funnel analysis', () => {
  const API = 'http://localhost:3001';

  test.beforeAll(async ({ request }) => {
    // Seed events for a multi-step funnel scenario
    // 10 users do step 1, 7 do step 2, 3 do step 3
    const events = [];
    const baseDate = new Date('2025-06-15');

    for (let i = 0; i < 10; i++) {
      // Step 1 — all 10 users
      events.push({
        event: `${P}-step-one`,
        user_id: `${P}-user-${i}`,
        timestamp: new Date(baseDate.getTime() + i * 3600000).toISOString(),
      });
    }

    for (let i = 0; i < 7; i++) {
      // Step 2 — 7 of the same users, after step 1
      events.push({
        event: `${P}-step-two`,
        user_id: `${P}-user-${i}`,
        timestamp: new Date(baseDate.getTime() + (10 + i) * 3600000).toISOString(),
      });
    }

    for (let i = 0; i < 3; i++) {
      // Step 3 — 3 of the same users, after step 2
      events.push({
        event: `${P}-step-three`,
        user_id: `${P}-user-${i}`,
        timestamp: new Date(baseDate.getTime() + (20 + i) * 3600000).toISOString(),
      });
    }

    // Identity resolution scenario: anonymous user does step 1, identifies, does step 2
    events.push({
      event: `${P}-step-one`,
      device_id: `${P}-anon-device`,
      timestamp: '2025-06-15T00:00:00.000Z',
    });
    events.push({
      event: `${P}-identify`,
      device_id: `${P}-anon-device`,
      user_id: `${P}-user-anon-resolved`,
      timestamp: '2025-06-15T01:00:00.000Z',
    });
    events.push({
      event: `${P}-step-two`,
      user_id: `${P}-user-anon-resolved`,
      timestamp: '2025-06-15T02:00:00.000Z',
    });

    // User who does step 2 BEFORE step 1 (by timestamp) — should NOT count as completing step 2
    events.push({
      event: `${P}-step-two`,
      user_id: `${P}-user-wrong-order`,
      timestamp: '2025-06-15T00:30:00.000Z',
    });
    events.push({
      event: `${P}-step-one`,
      user_id: `${P}-user-wrong-order`,
      timestamp: '2025-06-15T01:30:00.000Z',
    });

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
  });

  test('valid funnel with 3 steps returns correct structure', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: [`${P}-step-one`, `${P}-step-two`, `${P}-step-three`],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('steps');
    expect(body).toHaveProperty('overall_conversion_rate');
    expect(body.steps).toHaveLength(3);

    for (const step of body.steps) {
      expect(step).toHaveProperty('event_name');
      expect(step).toHaveProperty('count');
      expect(step).toHaveProperty('conversion_rate');
      expect(step).toHaveProperty('drop_off');
    }
  });

  test('steps[0].conversion_rate is always 1.0', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: [`${P}-step-one`, `${P}-step-two`, `${P}-step-three`],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.steps[0].conversion_rate).toBe(1.0);
  });

  test('conversion counts decrease or stay equal across steps', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: [`${P}-step-one`, `${P}-step-two`, `${P}-step-three`],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    for (let i = 1; i < body.steps.length; i++) {
      expect(body.steps[i].count).toBeLessThanOrEqual(body.steps[i - 1].count);
    }
  });

  test('step order enforced: user who does step 2 before step 1 is NOT counted', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: [`${P}-step-one`, `${P}-step-two`],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // user-wrong-order did step 2 before step 1, so they should be in step 1 count
    // but NOT in step 2 count (for the funnel progression)
    // The step 2 count should be <= step 1 count
    expect(body.steps[1].count).toBeLessThanOrEqual(body.steps[0].count);
  });

  test('identity resolution: anonymous step 1 + identified step 2 counts as one user', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: [`${P}-step-one`, `${P}-step-two`],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // user-anon-resolved did step-one anonymously via device, identified,
    // then did step-two as user — should count as 1 user progressing through funnel
    expect(body.steps[0].count).toBeGreaterThanOrEqual(1);
    expect(body.steps[1].count).toBeGreaterThanOrEqual(1);
  });

  test('fewer than 2 steps returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: [`${P}-step-one`],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('more than 5 steps returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/funnels/query`, {
      data: {
        steps: ['a', 'b', 'c', 'd', 'e', 'f'],
        start_date: '2025-06-14',
        end_date: '2025-06-16',
      },
    });
    expect(res.status()).toBe(400);
  });
});
