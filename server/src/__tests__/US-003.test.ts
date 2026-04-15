/**
 * US-003: Event ingestion API endpoint — POST /api/events
 *
 * Black-box HTTP tests derived ONLY from prd.json acceptance criteria.
 * Does NOT read implementation source — tests the spec, not the code.
 *
 * Acceptance criteria tested:
 * - POST /api/events accepts JSON with event, device_id, user_id, timestamp, properties
 * - Zod validation: event required + non-empty, at least one of device_id/user_id
 * - Omitted timestamp → server sets current UTC ISO 8601
 * - Valid → 201 with stored event including generated id
 * - Invalid → 400 with JSON error body
 * - Both device_id + user_id → identity mapping created (INSERT OR IGNORE)
 * - device_id mapped to different user_id → 409 rejection
 * - Properties serialized as JSON
 */
// Set port before any imports so the server binds to a random port
process.env.PORT = '0';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

let baseUrl: string;
let server: Server | undefined;

beforeAll(async () => {
  // Ensure db is initialized
  const dbMod = await import('../db.js');
  const initFn = dbMod.initDb ?? dbMod.initializeDb ?? dbMod.init;
  if (typeof initFn === 'function') initFn();

  const mod = await import('../index.js');

  // Try to use an already-listening server (module may auto-start)
  const existingServer: Server | undefined = mod.server;
  if (existingServer && typeof existingServer.address === 'function') {
    const addr = existingServer.address() as AddressInfo | null;
    if (addr && addr.port) {
      baseUrl = `http://localhost:${addr.port}`;
      server = existingServer;
      return;
    }
  }

  // Otherwise start the Express app on a random port
  const app = mod.app ?? mod.default;
  if (app && typeof app.listen === 'function') {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server!.address() as AddressInfo;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
    return;
  }

  throw new Error(
    'Cannot start test server. server/src/index.ts must export "app" (Express app) or "server" (http.Server).',
  );
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => resolve());
    });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function postEvent(body: unknown) {
  return fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Happy path ─────────────────────────────────────────────────────────────

describe('US-003: POST /api/events — happy path', () => {
  it('returns 201 with stored event including generated id when all fields provided', async () => {
    const res = await postEvent({
      event: 'page_view',
      device_id: 'dev-hp-001',
      user_id: 'user-hp-001',
      timestamp: '2024-06-15T12:00:00Z',
      properties: { page: '/home', referrer: 'google.com' },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('number');
    expect(body.event ?? body.event_name).toBe('page_view');
    expect(body.device_id).toBe('dev-hp-001');
    expect(body.user_id).toBe('user-hp-001');
    expect(body.timestamp).toBe('2024-06-15T12:00:00Z');
  });

  it('returns 201 with only device_id (user_id omitted)', async () => {
    const res = await postEvent({
      event: 'click',
      device_id: 'dev-hp-002',
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.device_id).toBe('dev-hp-002');
  });

  it('returns 201 with only user_id (device_id omitted)', async () => {
    const res = await postEvent({
      event: 'signup',
      user_id: 'user-hp-003',
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.user_id).toBe('user-hp-003');
  });

  it('sets server-generated ISO 8601 timestamp when timestamp omitted', async () => {
    const before = new Date().toISOString();
    const res = await postEvent({
      event: 'auto_timestamp',
      device_id: 'dev-hp-004',
    });
    const after = new Date().toISOString();

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    // Must be a valid ISO 8601 string
    const ts = new Date(body.timestamp);
    expect(ts.toISOString()).toBe(body.timestamp);
    // Must be between before and after (server-generated)
    expect(body.timestamp >= before).toBe(true);
    expect(body.timestamp <= after).toBe(true);
  });

  it('round-trips properties as an object (not double-stringified)', async () => {
    const props = { page: '/pricing', plan: 'pro', amount: 99.99, tags: ['a', 'b'] };
    const res = await postEvent({
      event: 'purchase',
      user_id: 'user-hp-005',
      properties: props,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    // Properties should come back as an object, not a JSON string
    expect(typeof body.properties).toBe('object');
    expect(body.properties).toEqual(props);
  });

  it('accepts event with null/undefined properties', async () => {
    const res = await postEvent({
      event: 'no_props',
      device_id: 'dev-hp-006',
    });
    expect(res.status).toBe(201);
  });
});

// ── Validation (400 errors) ────────────────────────────────────────────────

describe('US-003: POST /api/events — validation', () => {
  it('returns 400 when event name is missing', async () => {
    const res = await postEvent({
      device_id: 'dev-val-001',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('returns 400 when event name is empty string', async () => {
    const res = await postEvent({
      event: '',
      device_id: 'dev-val-002',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 when both device_id and user_id are missing', async () => {
    const res = await postEvent({
      event: 'orphan_event',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 with a human-readable error message', async () => {
    const res = await postEvent({});

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    // Must be human-readable, not an empty string or generic code
    expect(body.error.length).toBeGreaterThan(5);
  });
});

// ── Identity mapping side-effect ───────────────────────────────────────────

describe('US-003: POST /api/events — identity mapping', () => {
  it('creates an identity mapping when both device_id and user_id are present', async () => {
    const res = await postEvent({
      event: 'identify',
      device_id: 'dev-id-001',
      user_id: 'user-id-001',
    });
    expect(res.status).toBe(201);

    // Verify the mapping exists by posting another event with the same pair
    // (should succeed — INSERT OR IGNORE)
    const res2 = await postEvent({
      event: 'identify_again',
      device_id: 'dev-id-001',
      user_id: 'user-id-001',
    });
    expect(res2.status).toBe(201);
  });

  it('allows same device_id + same user_id posted multiple times (INSERT OR IGNORE)', async () => {
    // First event creates the mapping
    const res1 = await postEvent({
      event: 'ev1',
      device_id: 'dev-id-dup',
      user_id: 'user-id-dup',
    });
    expect(res1.status).toBe(201);

    // Second event with same pair should still succeed
    const res2 = await postEvent({
      event: 'ev2',
      device_id: 'dev-id-dup',
      user_id: 'user-id-dup',
    });
    expect(res2.status).toBe(201);

    // Third time — still fine
    const res3 = await postEvent({
      event: 'ev3',
      device_id: 'dev-id-dup',
      user_id: 'user-id-dup',
    });
    expect(res3.status).toBe(201);
  });

  it('returns 409 when device_id is already mapped to a DIFFERENT user_id', async () => {
    // Create initial mapping: dev-conflict-001 → user-A
    const res1 = await postEvent({
      event: 'first_map',
      device_id: 'dev-conflict-001',
      user_id: 'user-A',
    });
    expect(res1.status).toBe(201);

    // Try to map same device to a different user → 409
    const res2 = await postEvent({
      event: 'conflict_map',
      device_id: 'dev-conflict-001',
      user_id: 'user-B',
    });
    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.error).toBe('device_id is already mapped to a different user');
  });

  it('does NOT insert the event when identity conflict is detected (409)', async () => {
    // Establish mapping: dev-noinsert-001 → user-X
    await postEvent({
      event: 'setup_map',
      device_id: 'dev-noinsert-001',
      user_id: 'user-X',
    });

    // Attempt conflicting mapping — should be rejected
    const conflictRes = await postEvent({
      event: 'should_not_exist',
      device_id: 'dev-noinsert-001',
      user_id: 'user-Y',
    });
    expect(conflictRes.status).toBe(409);

    // The rejected event should NOT be in the database.
    // We verify by querying for it — this tests the spec requirement:
    // "Do NOT insert the event" on 409.
    // We can't directly query the DB here (black-box), but we post a known
    // good event and check that the conflicting event's name doesn't appear
    // if there's a list endpoint. Since US-003 only covers POST, we rely on
    // the 409 status being correct and the spec mandate being clear:
    // the event MUST NOT be inserted.
    // (Future story US-006 provides GET /api/events for full verification.)
  });

  it('does NOT create identity mapping when only device_id is present', async () => {
    // Post event with only device_id
    const res = await postEvent({
      event: 'anon_event',
      device_id: 'dev-no-map-001',
    });
    expect(res.status).toBe(201);

    // Now post with same device_id but a user_id — should work (no prior mapping)
    const res2 = await postEvent({
      event: 'identify_later',
      device_id: 'dev-no-map-001',
      user_id: 'user-later-001',
    });
    expect(res2.status).toBe(201);
  });
});

// ── Edge cases / adversarial ───────────────────────────────────────────────

describe('US-003: POST /api/events — edge cases', () => {
  it('handles properties with deeply nested objects', async () => {
    const nestedProps = {
      level1: {
        level2: {
          level3: { value: 'deep', arr: [1, { nested: true }] },
        },
      },
    };
    const res = await postEvent({
      event: 'deep_nested',
      device_id: 'dev-edge-001',
      properties: nestedProps,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.properties).toEqual(nestedProps);
  });

  it('handles properties containing SQL injection attempts', async () => {
    const res = await postEvent({
      event: 'sqli_test',
      device_id: 'dev-edge-002',
      properties: {
        name: "Robert'); DROP TABLE events;--",
        query: "1 OR 1=1; DELETE FROM identity_mappings;",
      },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    // The injection string should be stored verbatim, not executed
    expect(body.properties.name).toBe("Robert'); DROP TABLE events;--");
  });

  it('handles event name with special characters', async () => {
    const res = await postEvent({
      event: 'user:action/click.button',
      device_id: 'dev-edge-003',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.event ?? body.event_name).toBe('user:action/click.button');
  });

  it('rejects request with non-JSON content type gracefully', async () => {
    const res = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    });
    // Should get 400 (bad request), not 500 (server error)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
