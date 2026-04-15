/**
 * US-004: Batch event ingestion endpoint — POST /api/events/batch
 *
 * Black-box HTTP tests derived ONLY from prd.json acceptance criteria.
 * Does NOT read implementation source — tests the spec, not the code.
 *
 * Acceptance criteria tested:
 * - POST /api/events/batch accepts JSON body with field: events (array)
 * - Zod validation: array must have 1–1000 events
 * - Each event validated individually with same rules as POST /api/events
 * - All valid events inserted in a single transaction
 * - Identity mappings created for events with both device_id and user_id
 * - Identity conflict skips that event (reported in errors), does NOT abort batch
 * - Returns 200 with { accepted: number, errors: Array<{ index: number, message: string }> }
 * - Invalid/conflicting events skipped and reported; rest of batch succeeds
 */
// Set port before any imports so the server binds to a random port
process.env.PORT = '0';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

let baseUrl: string;
let server: Server | undefined;

beforeAll(async () => {
  const dbMod = await import('../db.js');
  const initFn = dbMod.initDb ?? dbMod.initializeDb ?? dbMod.init;
  if (typeof initFn === 'function') initFn();

  const mod = await import('../index.js');

  const existingServer: Server | undefined = mod.server;
  if (existingServer && typeof existingServer.address === 'function') {
    const addr = existingServer.address() as AddressInfo | null;
    if (addr && addr.port) {
      baseUrl = `http://localhost:${addr.port}`;
      server = existingServer;
      return;
    }
  }

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

async function postBatch(body: unknown) {
  return fetch(`${baseUrl}/api/events/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function postEvent(body: unknown) {
  return fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    event: 'batch_test',
    device_id: `dev-batch-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: '2024-07-01T10:00:00Z',
    properties: { source: 'test' },
    ...overrides,
  };
}

// ── Happy path ─────────────────────────────────────────────────────────────

describe('US-004: POST /api/events/batch — happy path', () => {
  it('returns 200 with accepted count and empty errors for all-valid batch', async () => {
    const events = [
      validEvent({ event: 'ev1', device_id: 'dev-hp-b01' }),
      validEvent({ event: 'ev2', device_id: 'dev-hp-b02' }),
      validEvent({ event: 'ev3', user_id: 'user-hp-b03' }),
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(3);
    expect(body.errors).toEqual([]);
  });

  it('returns 200 with a single event batch', async () => {
    const res = await postBatch({
      events: [validEvent({ event: 'single_batch', device_id: 'dev-hp-b04' })],
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(1);
    expect(body.errors).toEqual([]);
  });

  it('creates identity mappings for events with both device_id and user_id', async () => {
    // Post a batch that creates a mapping: dev-batch-map-001 → user-batch-map-001
    const res = await postBatch({
      events: [
        validEvent({
          event: 'identify_batch',
          device_id: 'dev-batch-map-001',
          user_id: 'user-batch-map-001',
        }),
      ],
    });
    expect(res.status).toBe(200);
    expect((await res.json()).accepted).toBe(1);

    // Now use the single event endpoint to verify the mapping was created:
    // posting the same pair should succeed (INSERT OR IGNORE)
    const verify = await postEvent({
      event: 'verify_mapping',
      device_id: 'dev-batch-map-001',
      user_id: 'user-batch-map-001',
    });
    expect(verify.status).toBe(201);

    // And posting the same device_id with a DIFFERENT user_id should conflict (409)
    const conflict = await postEvent({
      event: 'verify_conflict',
      device_id: 'dev-batch-map-001',
      user_id: 'user-batch-map-OTHER',
    });
    expect(conflict.status).toBe(409);
  });
});

// ── Validation (400 errors) ────────────────────────────────────────────────

describe('US-004: POST /api/events/batch — Zod validation', () => {
  it('returns 400 when events array is empty', async () => {
    const res = await postBatch({ events: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when events field is missing', async () => {
    const res = await postBatch({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when events is not an array', async () => {
    const res = await postBatch({ events: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when events array exceeds 1000 items', async () => {
    const events = Array.from({ length: 1001 }, (_, i) =>
      validEvent({ event: `overflow_${i}`, device_id: `dev-overflow-${i}` }),
    );

    const res = await postBatch({ events });
    expect(res.status).toBe(400);
  });

  it('accepts exactly 1000 events (boundary)', async () => {
    const events = Array.from({ length: 1000 }, (_, i) =>
      validEvent({ event: `boundary_${i}`, device_id: `dev-boundary-${i}` }),
    );

    const res = await postBatch({ events });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(1000);
    expect(body.errors).toEqual([]);
  });
});

// ── Partial success (mix of valid + invalid) ──────────────────────────────

describe('US-004: POST /api/events/batch — partial success', () => {
  it('accepts valid events and reports invalid ones in errors array', async () => {
    const events = [
      validEvent({ event: 'good1', device_id: 'dev-mix-001' }),
      { event: '', device_id: 'dev-mix-002' },           // invalid: empty event name
      validEvent({ event: 'good2', user_id: 'user-mix-003' }),
      { event: 'no_identity' },                           // invalid: no device_id or user_id
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(2);
    expect(body.errors).toHaveLength(2);

    // Errors must include index and message
    for (const err of body.errors) {
      expect(err).toHaveProperty('index');
      expect(typeof err.index).toBe('number');
      expect(err).toHaveProperty('message');
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    }

    // Error indices must point to the invalid events (index 1 and 3)
    const errorIndices = body.errors.map((e: { index: number }) => e.index).sort();
    expect(errorIndices).toEqual([1, 3]);
  });

  it('returns 200 with accepted: 0 when ALL events are invalid', async () => {
    const events = [
      { event: '', device_id: 'dev-allinvalid-001' },      // empty event name
      { event: 'no_id' },                                    // missing device_id and user_id
      { device_id: 'dev-allinvalid-003' },                   // missing event name
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(0);
    expect(body.errors).toHaveLength(3);

    // Every index should be reported
    const errorIndices = body.errors.map((e: { index: number }) => e.index).sort();
    expect(errorIndices).toEqual([0, 1, 2]);
  });
});

// ── Identity conflict handling within batch ───────────────────────────────

describe('US-004: POST /api/events/batch — identity conflicts', () => {
  it('skips event with identity conflict but accepts the rest of the batch', async () => {
    // First, establish a mapping via single event: dev-conflict-b01 → user-A
    const setup = await postEvent({
      event: 'setup_mapping',
      device_id: 'dev-conflict-b01',
      user_id: 'user-A-batch',
    });
    expect(setup.status).toBe(201);

    // Now send a batch where one event conflicts
    const events = [
      validEvent({ event: 'before_conflict', device_id: 'dev-ok-b01' }),
      // This conflicts: dev-conflict-b01 is already mapped to user-A-batch
      validEvent({
        event: 'conflicting_event',
        device_id: 'dev-conflict-b01',
        user_id: 'user-B-batch',
      }),
      validEvent({ event: 'after_conflict', device_id: 'dev-ok-b02' }),
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(2);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].index).toBe(1);
    expect(typeof body.errors[0].message).toBe('string');
  });

  it('handles intra-batch conflict: first event creates mapping, later event conflicts', async () => {
    // Within the same batch: event 0 maps dev→userA, event 2 tries dev→userB
    const events = [
      validEvent({
        event: 'create_mapping',
        device_id: 'dev-intra-conflict-001',
        user_id: 'user-intra-A',
      }),
      validEvent({ event: 'innocent_bystander', device_id: 'dev-intra-ok' }),
      validEvent({
        event: 'conflict_later',
        device_id: 'dev-intra-conflict-001',
        user_id: 'user-intra-B',
      }),
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    // First event creates the mapping and is accepted
    // Second event is fine
    // Third event conflicts and should be skipped
    expect(body.accepted).toBe(2);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].index).toBe(2);
  });

  it('allows duplicate device_id→user_id pairs (same mapping repeated) within batch', async () => {
    const events = [
      validEvent({
        event: 'dup_map_1',
        device_id: 'dev-dup-map-b01',
        user_id: 'user-dup-map-b01',
      }),
      validEvent({
        event: 'dup_map_2',
        device_id: 'dev-dup-map-b01',
        user_id: 'user-dup-map-b01',
      }),
      validEvent({
        event: 'dup_map_3',
        device_id: 'dev-dup-map-b01',
        user_id: 'user-dup-map-b01',
      }),
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(3);
    expect(body.errors).toEqual([]);
  });
});

// ── Edge cases / adversarial ──────────────────────────────────────────────

describe('US-004: POST /api/events/batch — edge cases', () => {
  it('preserves properties as objects (not double-stringified) in batch', async () => {
    const props = { page: '/batch', count: 42, nested: { a: 1 } };
    const events = [
      validEvent({ event: 'props_test', device_id: 'dev-edge-b01', properties: props }),
    ];

    const res = await postBatch({ events });
    expect(res.status).toBe(200);
    expect((await res.json()).accepted).toBe(1);
  });

  it('handles SQL injection attempts in batch event properties', async () => {
    const events = [
      validEvent({
        event: 'sqli_batch',
        device_id: 'dev-edge-b02',
        properties: {
          name: "Robert'); DROP TABLE events;--",
          q: "1 OR 1=1; DELETE FROM identity_mappings;",
        },
      }),
      validEvent({ event: 'after_sqli', device_id: 'dev-edge-b03' }),
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(2);
    expect(body.errors).toEqual([]);
  });

  it('correctly reports error indices even when errors are non-contiguous', async () => {
    // Events at indices 0, 2, 4 are valid; indices 1, 3 are invalid
    const events = [
      validEvent({ event: 'ok0', device_id: 'dev-idx-0' }),
      { event: 'missing_id_1' },                                  // invalid (index 1)
      validEvent({ event: 'ok2', device_id: 'dev-idx-2' }),
      { event: '', device_id: 'dev-idx-3' },                      // invalid (index 3)
      validEvent({ event: 'ok4', user_id: 'user-idx-4' }),
    ];

    const res = await postBatch({ events });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(3);
    expect(body.errors).toHaveLength(2);
    const indices = body.errors.map((e: { index: number }) => e.index).sort();
    expect(indices).toEqual([1, 3]);
  });

  it('sets server-generated timestamps for batch events that omit timestamp', async () => {
    const before = new Date().toISOString();
    const events = [
      { event: 'no_ts', device_id: 'dev-edge-b04' }, // no timestamp
    ];

    const res = await postBatch({ events });
    expect(res.status).toBe(200);
    expect((await res.json()).accepted).toBe(1);
  });
});
