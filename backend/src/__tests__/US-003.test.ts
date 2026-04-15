/**
 * US-003: Event ingestion API endpoint
 *
 * Black-box tests derived ONLY from acceptance criteria in prd.json:
 * - POST /api/events accepts JSON: event (string, required), device_id (string, optional),
 *   user_id (string, optional), timestamp (string, optional ISO 8601), properties (object, optional)
 * - Zod validation: event required + non-empty, at least one of device_id / user_id
 * - Missing timestamp → server fills current UTC ISO 8601
 * - Valid → 201 with stored event object including generated id
 * - Invalid → 400 with JSON error body containing human-readable message
 * - Both device_id + user_id → identity mapping created (INSERT OR IGNORE)
 * - device_id already mapped to DIFFERENT user_id → 409 { error: 'device_id is already mapped to a different user' }
 * - Properties object serialized to JSON string before storage
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_DIR = path.resolve(__dirname, '..', '..');
const DB_PATH = path.resolve(PROJECT_ROOT, 'minipanel.db');
const BASE_URL = 'http://localhost:3001';

let serverProcess: ChildProcess;

function waitForServer(port: number, timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not start within ${timeoutMs}ms`));
        return;
      }
      try {
        const res = await fetch(`http://localhost:${port}/api/health`);
        if (res.ok) {
          resolve();
          return;
        }
      } catch {
        // not ready yet
      }
      setTimeout(check, 200);
    };
    check();
  });
}

describe('US-003: Event ingestion API — POST /api/events', () => {
  beforeAll(async () => {
    // Clean DB for deterministic state
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }

    serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: SERVER_DIR,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    serverProcess.stderr?.on('data', () => {});
    serverProcess.stdout?.on('data', () => {});

    await waitForServer(3001);
  }, 15000);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  // ─── Happy path ────────────────────────────────────────────

  it('should accept a valid event with device_id only and return 201', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        device_id: 'dev-001',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('number');
    expect(body.event_name ?? body.event).toBe('page_view');
    expect(body.device_id).toBe('dev-001');
  });

  it('should accept a valid event with user_id only and return 201', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'signup',
        user_id: 'user-001',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.user_id).toBe('user-001');
  });

  it('should accept a valid event with both device_id and user_id', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'purchase',
        device_id: 'dev-both-001',
        user_id: 'user-both-001',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.device_id).toBe('dev-both-001');
    expect(body.user_id).toBe('user-both-001');
  });

  // ─── Timestamp handling ────────────────────────────────────

  it('should auto-fill timestamp when omitted, in ISO 8601 UTC format', async () => {
    const before = new Date().toISOString();

    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'ts_test',
        device_id: 'dev-ts-001',
      }),
    });

    const after = new Date().toISOString();

    expect(res.status).toBe(201);
    const body = await res.json();
    const ts = body.timestamp;

    // Must be a valid ISO 8601 string
    expect(new Date(ts).toISOString()).toBe(ts);
    // Must be between before and after
    expect(ts >= before).toBe(true);
    expect(ts <= after).toBe(true);
  });

  it('should accept and preserve a provided ISO 8601 timestamp', async () => {
    const customTs = '2024-06-15T10:30:00.000Z';

    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'ts_custom',
        device_id: 'dev-ts-002',
        timestamp: customTs,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.timestamp).toBe(customTs);
  });

  // ─── Properties handling ───────────────────────────────────

  it('should accept and store a properties object', async () => {
    const props = { page: '/home', referrer: 'google.com', count: 42 };

    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'props_test',
        device_id: 'dev-props-001',
        properties: props,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();

    // The returned properties should be the original object (or its JSON string)
    // Verify that the data is retrievable — parse if string, compare if object
    const returnedProps =
      typeof body.properties === 'string'
        ? JSON.parse(body.properties)
        : body.properties;
    expect(returnedProps).toEqual(props);
  });

  it('should serialize properties to JSON string in the database', async () => {
    const props = { key: 'db_check', nested: { a: 1 } };

    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'props_db_test',
        device_id: 'dev-props-002',
        properties: props,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();

    // Verify in DB that properties is stored as a JSON string
    const db = new Database(DB_PATH, { readonly: true });
    const row = db
      .prepare('SELECT properties FROM events WHERE id = ?')
      .get(body.id) as { properties: string } | undefined;
    db.close();

    expect(row).toBeDefined();
    expect(typeof row!.properties).toBe('string');
    expect(JSON.parse(row!.properties)).toEqual(props);
  });

  // ─── Validation errors (400) ───────────────────────────────

  it('should return 400 when event name is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: 'dev-no-event',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('should return 400 when event name is empty string', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '',
        device_id: 'dev-empty-event',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('should return 400 when neither device_id nor user_id is provided', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'lonely_event',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('should return 400 for a completely empty body', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  // ─── Identity mapping (both device_id + user_id) ──────────

  it('should create an identity mapping when both device_id and user_id are present', async () => {
    const deviceId = 'dev-identity-001';
    const userId = 'user-identity-001';

    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'identify_test',
        device_id: deviceId,
        user_id: userId,
      }),
    });

    expect(res.status).toBe(201);

    // Verify mapping in DB
    const db = new Database(DB_PATH, { readonly: true });
    const mapping = db
      .prepare(
        'SELECT device_id, user_id FROM identity_mappings WHERE device_id = ?'
      )
      .get(deviceId) as { device_id: string; user_id: string } | undefined;
    db.close();

    expect(mapping).toBeDefined();
    expect(mapping!.device_id).toBe(deviceId);
    expect(mapping!.user_id).toBe(userId);
  });

  it('should not error when re-sending the same device_id + user_id pair (INSERT OR IGNORE)', async () => {
    const deviceId = 'dev-idempotent-001';
    const userId = 'user-idempotent-001';

    // First event
    const res1 = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'first_event',
        device_id: deviceId,
        user_id: userId,
      }),
    });
    expect(res1.status).toBe(201);

    // Second event with same mapping — should still succeed
    const res2 = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'second_event',
        device_id: deviceId,
        user_id: userId,
      }),
    });
    expect(res2.status).toBe(201);

    // Only one mapping should exist
    const db = new Database(DB_PATH, { readonly: true });
    const count = db
      .prepare(
        'SELECT COUNT(*) as cnt FROM identity_mappings WHERE device_id = ?'
      )
      .get(deviceId) as { cnt: number };
    db.close();

    expect(count.cnt).toBe(1);
  });

  // ─── Identity conflict (409) ──────────────────────────────

  it('should return 409 when device_id is already mapped to a different user_id', async () => {
    const deviceId = 'dev-conflict-001';
    const userId1 = 'user-conflict-001';
    const userId2 = 'user-conflict-002';

    // First event establishes the mapping
    const res1 = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'establish_mapping',
        device_id: deviceId,
        user_id: userId1,
      }),
    });
    expect(res1.status).toBe(201);

    // Second event with same device_id but different user_id → 409
    const res2 = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'conflict_event',
        device_id: deviceId,
        user_id: userId2,
      }),
    });

    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.error).toBe('device_id is already mapped to a different user');
  });

  it('should NOT insert the event when identity conflict occurs (409)', async () => {
    const deviceId = 'dev-conflict-noevent-001';
    const userId1 = 'user-conflict-noevent-001';
    const userId2 = 'user-conflict-noevent-002';

    // Establish mapping
    await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'setup_mapping',
        device_id: deviceId,
        user_id: userId1,
      }),
    });

    // Attempt conflicting event
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'should_not_be_stored',
        device_id: deviceId,
        user_id: userId2,
      }),
    });
    expect(res.status).toBe(409);

    // Verify the conflicting event was NOT inserted
    const db = new Database(DB_PATH, { readonly: true });
    const row = db
      .prepare(
        "SELECT COUNT(*) as cnt FROM events WHERE event_name = 'should_not_be_stored'"
      )
      .get() as { cnt: number };
    db.close();

    expect(row.cnt).toBe(0);
  });

  // ─── Adversarial edge cases ────────────────────────────────

  it('should handle properties with special characters (SQL injection attempt)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'sqli_test',
        device_id: 'dev-sqli',
        properties: { value: "'; DROP TABLE events; --" },
      }),
    });

    expect(res.status).toBe(201);

    // Events table should still exist
    const db = new Database(DB_PATH, { readonly: true });
    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='events'"
      )
      .get() as { name: string } | undefined;
    db.close();
    expect(table).toBeDefined();
  });

  it('should return the generated id in the response body', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'id_check',
        device_id: 'dev-id-001',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(Number.isInteger(body.id)).toBe(true);
    expect(body.id).toBeGreaterThan(0);
  });
});
