import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// POST /api/saved-analyses  — CRUD for saved analyses
//
// Tests are self-contained: each test creates its own data.
// No shared beforeAll seed is needed.
// ---------------------------------------------------------------------------

const SAVED_API = 'http://localhost:3001/api/saved-analyses';

// ---------------------------------------------------------------------------
// Helper: build a minimal valid saved-analysis payload
// ---------------------------------------------------------------------------

function makeTrendPayload(suffix: string) {
  return {
    name: `test-saved-trend-${suffix}`,
    type: 'trend' as const,
    config: {
      event_name: `test-saved-event-${suffix}`,
      measure: 'total_count',
      granularity: 'daily',
      date_range: 'last_30_days',
    },
  };
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

test.describe('POST /api/saved-analyses', () => {
  test('valid trend analysis returns 201 with saved object including id and timestamps', async ({
    request,
  }) => {
    const payload = makeTrendPayload('create-basic');

    const response = await request.post(SAVED_API, { data: payload });

    expect(response.status()).toBe(201);

    const body = await response.json();

    // Must return a string id
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);

    // Echoed fields
    expect(body.name).toBe(payload.name);
    expect(body.type).toBe(payload.type);

    // Config must be preserved as an object (not stringified)
    expect(typeof body.config).toBe('object');
    expect(body.config).not.toBeNull();
    expect(body.config.event_name).toBe(payload.config.event_name);
    expect(body.config.measure).toBe(payload.config.measure);

    // Timestamps
    expect(typeof body.created_at).toBe('string');
    expect(typeof body.updated_at).toBe('string');
    expect(new Date(body.created_at).getTime()).not.toBeNaN();
    expect(new Date(body.updated_at).getTime()).not.toBeNaN();
  });

  test('funnel type with valid config returns 201', async ({ request }) => {
    const payload = {
      name: 'test-saved-funnel-create',
      type: 'funnel',
      config: {
        steps: [
          { event_name: 'test-saved-funnel-step1' },
          { event_name: 'test-saved-funnel-step2' },
        ],
      },
    };

    const response = await request.post(SAVED_API, { data: payload });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(typeof body.id).toBe('string');
    expect(body.type).toBe('funnel');
  });

  test('missing name returns 400 with { error } body', async ({ request }) => {
    const response = await request.post(SAVED_API, {
      data: {
        type: 'trend',
        config: { event_name: 'test-saved-no-name' },
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('missing type returns 400 with { error } body', async ({ request }) => {
    const response = await request.post(SAVED_API, {
      data: {
        name: 'test-saved-no-type',
        config: { event_name: 'test-saved-some-event' },
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------------

test.describe('GET /api/saved-analyses', () => {
  test('returns array sorted by updated_at descending', async ({ request }) => {
    // Create two analyses with a gap so updated_at differs
    const firstResponse = await request.post(SAVED_API, {
      data: makeTrendPayload('list-first'),
    });
    expect(firstResponse.status()).toBe(201);
    const first = await firstResponse.json();

    // Small delay to ensure updated_at differs between records
    await new Promise((resolve) => setTimeout(resolve, 50));

    const secondResponse = await request.post(SAVED_API, {
      data: makeTrendPayload('list-second'),
    });
    expect(secondResponse.status()).toBe(201);
    const second = await secondResponse.json();

    const listResponse = await request.get(SAVED_API);
    expect(listResponse.status()).toBe(200);

    const body = await listResponse.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);

    // Find our two analyses in the list
    const found = body.filter((a: { id: string }) => a.id === first.id || a.id === second.id);
    expect(found.length).toBe(2);

    // The second (more recently created) must appear before the first in the list
    const secondIndex = body.findIndex((a: { id: string }) => a.id === second.id);
    const firstIndex = body.findIndex((a: { id: string }) => a.id === first.id);
    expect(secondIndex).toBeLessThan(firstIndex);

    // Verify overall sort order: each updated_at must be >= the next entry's
    for (let i = 0; i < body.length - 1; i++) {
      const current = new Date(body[i].updated_at).getTime();
      const next = new Date(body[i + 1].updated_at).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  test('response is an array (empty or non-empty)', async ({ request }) => {
    const response = await request.get(SAVED_API);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each item in list has id, name, type, config, created_at, updated_at', async ({
    request,
  }) => {
    // Ensure at least one item exists
    await request.post(SAVED_API, { data: makeTrendPayload('list-shape') });

    const response = await request.get(SAVED_API);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);

    for (const item of body) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.type).toBe('string');
      expect(typeof item.config).toBe('object');
      expect(item.config).not.toBeNull();
      expect(typeof item.created_at).toBe('string');
      expect(typeof item.updated_at).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// READ (single)
// ---------------------------------------------------------------------------

test.describe('GET /api/saved-analyses/:id', () => {
  test('returns the specific saved analysis by id', async ({ request }) => {
    const payload = makeTrendPayload('get-by-id');

    const createResponse = await request.post(SAVED_API, { data: payload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    const getResponse = await request.get(`${SAVED_API}/${created.id}`);
    expect(getResponse.status()).toBe(200);

    const body = await getResponse.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe(payload.name);
    expect(body.type).toBe(payload.type);
    expect(body.config.event_name).toBe(payload.config.event_name);
  });

  test('non-existent id returns 404', async ({ request }) => {
    const response = await request.get(`${SAVED_API}/test-saved-nonexistent-id-00000000`);

    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

test.describe('DELETE /api/saved-analyses/:id', () => {
  test('returns 200 and subsequent GET returns 404', async ({ request }) => {
    // Create an analysis to delete
    const createResponse = await request.post(SAVED_API, {
      data: makeTrendPayload('delete-me'),
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // Delete it
    const deleteResponse = await request.delete(`${SAVED_API}/${created.id}`);
    expect(deleteResponse.status()).toBe(200);

    // Subsequent GET must return 404
    const getAfterDelete = await request.get(`${SAVED_API}/${created.id}`);
    expect(getAfterDelete.status()).toBe(404);
  });

  test('deleted item no longer appears in list', async ({ request }) => {
    const createResponse = await request.post(SAVED_API, {
      data: makeTrendPayload('delete-from-list'),
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // Confirm it exists in list before deletion
    const listBefore = await request.get(SAVED_API);
    expect(listBefore.status()).toBe(200);
    const beforeBody = await listBefore.json();
    const existsBefore = beforeBody.some((a: { id: string }) => a.id === created.id);
    expect(existsBefore).toBe(true);

    // Delete
    const deleteResponse = await request.delete(`${SAVED_API}/${created.id}`);
    expect(deleteResponse.status()).toBe(200);

    // Must not appear in list anymore
    const listAfter = await request.get(SAVED_API);
    expect(listAfter.status()).toBe(200);
    const afterBody = await listAfter.json();
    const existsAfter = afterBody.some((a: { id: string }) => a.id === created.id);
    expect(existsAfter).toBe(false);
  });

  test('deleting a non-existent id returns 404', async ({ request }) => {
    const response = await request.delete(`${SAVED_API}/test-saved-nonexistent-delete-00000000`);

    expect(response.status()).toBe(404);
  });
});
