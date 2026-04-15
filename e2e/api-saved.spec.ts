import { test, expect } from '@playwright/test';

const P = 't06s';

test.describe('Saved analyses CRUD', () => {
  const API = 'http://localhost:3001';
  let savedId: number;

  test('POST /api/saved-analyses creates a new saved analysis and returns 201', async ({ request }) => {
    const res = await request.post(`${API}/api/saved-analyses`, {
      data: {
        name: `${P}-my-trend-analysis`,
        type: 'trend',
        config: {
          event_name: 'Page Viewed',
          measure: 'total_count',
          granularity: 'day',
          date_range: 'last_30_days',
        },
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe(`${P}-my-trend-analysis`);
    expect(body.type).toBe('trend');
    expect(body.config).toBeDefined();
    savedId = body.id;
  });

  test('GET /api/saved-analyses returns array sorted by updated_at descending', async ({ request }) => {
    // Create another saved analysis first
    await request.post(`${API}/api/saved-analyses`, {
      data: {
        name: `${P}-second-analysis`,
        type: 'funnel',
        config: { steps: ['Step A', 'Step B'] },
      },
    });

    const res = await request.get(`${API}/api/saved-analyses`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);

    // Verify sorted by updated_at descending
    for (let i = 1; i < body.length; i++) {
      const prev = new Date(body[i - 1].updated_at).getTime();
      const curr = new Date(body[i].updated_at).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  test('GET /api/saved-analyses/:id returns the specific saved analysis', async ({ request }) => {
    // First create one to get a known ID
    const createRes = await request.post(`${API}/api/saved-analyses`, {
      data: {
        name: `${P}-specific-analysis`,
        type: 'trend',
        config: { event_name: 'Button Clicked' },
      },
    });
    const created = await createRes.json();

    const res = await request.get(`${API}/api/saved-analyses/${created.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.id).toBe(created.id);
    expect(body.name).toBe(`${P}-specific-analysis`);
  });

  test('DELETE /api/saved-analyses/:id returns 200 and subsequent GET returns 404', async ({ request }) => {
    // Create one to delete
    const createRes = await request.post(`${API}/api/saved-analyses`, {
      data: {
        name: `${P}-to-delete`,
        type: 'trend',
        config: { event_name: 'Sign Up' },
      },
    });
    const created = await createRes.json();

    // Delete it
    const deleteRes = await request.delete(`${API}/api/saved-analyses/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    // Verify it's gone
    const getRes = await request.get(`${API}/api/saved-analyses/${created.id}`);
    expect(getRes.status()).toBe(404);
  });
});
