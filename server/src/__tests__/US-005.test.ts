/**
 * US-005: Identity resolution query logic
 *
 * Black-box HTTP tests derived ONLY from prd.json acceptance criteria + orchestration briefing.
 * Does NOT read implementation source — tests the spec, not the code.
 *
 * Acceptance criteria tested:
 * - GET /api/events?user_id=<id> returns all resolved events for that user
 *   (including anonymous device events retroactively merged via identity_mappings)
 * - GET /api/events?device_id=<id> resolves device → user and returns all events
 *   for the resolved user
 * - Response includes event objects with parsed properties (JSON object, not string)
 * - Events sorted by timestamp ascending (oldest first)
 * - Retroactive merge: events recorded before the identity mapping are included
 *
 * Edge cases:
 * - Device with no mapping → returns only that device's events
 * - User with no events → returns empty array
 * - Multi-device merge: multiple devices mapped to same user, all events returned
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

async function postEvent(body: unknown) {
  return fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getEvents(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${baseUrl}/api/events?${qs}`);
}

// Use unique prefixes per test to avoid cross-test pollution in shared SQLite
const PREFIX = `us005-${Date.now()}-`;

// ── Seed data ──────────────────────────────────────────────────────────────

describe('US-005: Identity resolution query logic', () => {
  // Identifiers scoped to this test run
  const deviceA = `${PREFIX}dev-A`;
  const deviceB = `${PREFIX}dev-B`;
  const deviceUnmapped = `${PREFIX}dev-unmapped`;
  const userAlice = `${PREFIX}user-alice`;
  const userNoEvents = `${PREFIX}user-empty`;

  beforeAll(async () => {
    // 1. Anonymous events from deviceA BEFORE any mapping exists (retroactive test)
    const anon1 = await postEvent({
      event: 'anon_page_view',
      device_id: deviceA,
      timestamp: '2024-01-01T10:00:00Z',
      properties: { page: '/landing' },
    });
    expect(anon1.status).toBe(201);

    const anon2 = await postEvent({
      event: 'anon_click',
      device_id: deviceA,
      timestamp: '2024-01-01T11:00:00Z',
      properties: { button: 'signup' },
    });
    expect(anon2.status).toBe(201);

    // 2. Anonymous events from deviceB BEFORE mapping
    const anon3 = await postEvent({
      event: 'anon_visit',
      device_id: deviceB,
      timestamp: '2024-01-02T09:00:00Z',
      properties: { source: 'mobile' },
    });
    expect(anon3.status).toBe(201);

    // 3. Events from an unmapped device (should never get merged)
    const unmapped = await postEvent({
      event: 'unmapped_event',
      device_id: deviceUnmapped,
      timestamp: '2024-01-01T12:00:00Z',
      properties: { context: 'unmapped' },
    });
    expect(unmapped.status).toBe(201);

    // 4. Create identity mapping: deviceA → userAlice (by posting event with both)
    const identify1 = await postEvent({
      event: 'identify',
      device_id: deviceA,
      user_id: userAlice,
      timestamp: '2024-01-03T08:00:00Z',
    });
    expect(identify1.status).toBe(201);

    // 5. Create identity mapping: deviceB → userAlice (multi-device merge)
    const identify2 = await postEvent({
      event: 'identify',
      device_id: deviceB,
      user_id: userAlice,
      timestamp: '2024-01-03T09:00:00Z',
    });
    expect(identify2.status).toBe(201);

    // 6. Post an event with only user_id for userAlice (direct user event)
    const directEvent = await postEvent({
      event: 'purchase',
      user_id: userAlice,
      timestamp: '2024-01-04T15:00:00Z',
      properties: { amount: 49.99, plan: 'pro' },
    });
    expect(directEvent.status).toBe(201);
  });

  // ── GET /api/events?user_id= ─────────────────────────────────────────────

  describe('GET /api/events?user_id= (identity resolution)', () => {
    it('returns all resolved events for the user including retroactive anonymous events', async () => {
      const res = await getEvents({ user_id: userAlice });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(Array.isArray(events)).toBe(true);

      // Should include:
      // - 2 anonymous events from deviceA (retroactive)
      // - 1 anonymous event from deviceB (retroactive, multi-device)
      // - 2 identify events (deviceA+userAlice, deviceB+userAlice)
      // - 1 direct user event (purchase)
      // Total: 6
      expect(events.length).toBe(6);

      // Verify all expected event names are present
      const eventNames = events.map((e: { event?: string; event_name?: string }) => e.event ?? e.event_name);
      expect(eventNames).toContain('anon_page_view');
      expect(eventNames).toContain('anon_click');
      expect(eventNames).toContain('anon_visit');
      expect(eventNames).toContain('identify');
      expect(eventNames).toContain('purchase');
    });

    it('returns events sorted by timestamp ascending (oldest first)', async () => {
      const res = await getEvents({ user_id: userAlice });
      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      const timestamps = events.map((e: { timestamp: string }) => e.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i] >= timestamps[i - 1]).toBe(true);
      }

      // First event should be the earliest (2024-01-01T10:00:00Z)
      expect(timestamps[0]).toBe('2024-01-01T10:00:00Z');
      // Last event should be the latest (2024-01-04T15:00:00Z)
      expect(timestamps[timestamps.length - 1]).toBe('2024-01-04T15:00:00Z');
    });

    it('returns event objects with parsed properties (JSON object, not string)', async () => {
      const res = await getEvents({ user_id: userAlice });
      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      // Find the purchase event which has rich properties
      const purchase = events.find(
        (e: { event?: string; event_name?: string }) => (e.event ?? e.event_name) === 'purchase',
      );
      expect(purchase).toBeDefined();
      expect(typeof purchase.properties).toBe('object');
      expect(purchase.properties).not.toBeNull();
      expect(purchase.properties.amount).toBe(49.99);
      expect(purchase.properties.plan).toBe('pro');

      // Check that properties for the anon_page_view event are also objects
      const pageView = events.find(
        (e: { event?: string; event_name?: string }) => (e.event ?? e.event_name) === 'anon_page_view',
      );
      expect(pageView).toBeDefined();
      expect(typeof pageView.properties).toBe('object');
      expect(pageView.properties.page).toBe('/landing');
    });

    it('does NOT include events from unmapped devices', async () => {
      const res = await getEvents({ user_id: userAlice });
      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      const eventNames = events.map((e: { event?: string; event_name?: string }) => e.event ?? e.event_name);
      expect(eventNames).not.toContain('unmapped_event');
    });

    it('returns empty array for a user with no events', async () => {
      const res = await getEvents({ user_id: userNoEvents });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(0);
    });
  });

  // ── GET /api/events?device_id= ───────────────────────────────────────────

  describe('GET /api/events?device_id= (device resolution)', () => {
    it('resolves device to user and returns ALL events for that resolved user', async () => {
      // Query by deviceA — should resolve to userAlice and return ALL of Alice's events
      const res = await getEvents({ device_id: deviceA });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      // Should be the same 6 events as querying by user_id=userAlice
      expect(events.length).toBe(6);

      const eventNames = events.map((e: { event?: string; event_name?: string }) => e.event ?? e.event_name);
      expect(eventNames).toContain('anon_page_view');
      expect(eventNames).toContain('anon_click');
      expect(eventNames).toContain('anon_visit');
      expect(eventNames).toContain('purchase');
    });

    it('resolves deviceB to the same user and returns the same events', async () => {
      // Query by deviceB — same user, so same results
      const res = await getEvents({ device_id: deviceB });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(events.length).toBe(6);
    });

    it('returns events sorted by timestamp ascending for device queries', async () => {
      const res = await getEvents({ device_id: deviceA });
      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      const timestamps = events.map((e: { timestamp: string }) => e.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i] >= timestamps[i - 1]).toBe(true);
      }
    });

    it('returns only device events when device has no mapping', async () => {
      const res = await getEvents({ device_id: deviceUnmapped });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      // Only the 1 unmapped event
      expect(events.length).toBe(1);
      const name = events[0].event ?? events[0].event_name;
      expect(name).toBe('unmapped_event');
    });

    it('returns parsed properties for device-resolved queries', async () => {
      const res = await getEvents({ device_id: deviceUnmapped });
      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      expect(typeof events[0].properties).toBe('object');
      expect(events[0].properties.context).toBe('unmapped');
    });
  });

  // ── Retroactive merge (the critical case) ────────────────────────────────

  describe('Retroactive merge', () => {
    const lateDevice = `${PREFIX}dev-late`;
    const lateUser = `${PREFIX}user-late`;

    it('includes events posted BEFORE the identity mapping in the resolved set', async () => {
      // Post 3 anonymous events first
      for (let i = 0; i < 3; i++) {
        const res = await postEvent({
          event: `late_anon_${i}`,
          device_id: lateDevice,
          timestamp: `2024-06-0${i + 1}T12:00:00Z`,
          properties: { seq: i },
        });
        expect(res.status).toBe(201);
      }

      // Now create the mapping
      const identify = await postEvent({
        event: 'late_identify',
        device_id: lateDevice,
        user_id: lateUser,
        timestamp: '2024-06-10T12:00:00Z',
      });
      expect(identify.status).toBe(201);

      // Query by user_id — should get all 4 events (3 anonymous + 1 identify)
      const res = await getEvents({ user_id: lateUser });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(events.length).toBe(4);

      // Verify the anonymous events are present (retroactive merge)
      const names = events.map((e: { event?: string; event_name?: string }) => e.event ?? e.event_name);
      expect(names).toContain('late_anon_0');
      expect(names).toContain('late_anon_1');
      expect(names).toContain('late_anon_2');
      expect(names).toContain('late_identify');
    });
  });

  // ── Multi-device merge ───────────────────────────────────────────────────

  describe('Multi-device merge', () => {
    const mdUser = `${PREFIX}user-multi`;
    const mdDev1 = `${PREFIX}dev-multi-1`;
    const mdDev2 = `${PREFIX}dev-multi-2`;
    const mdDev3 = `${PREFIX}dev-multi-3`;

    beforeAll(async () => {
      // Events from 3 different devices
      await postEvent({
        event: 'md_ev1',
        device_id: mdDev1,
        timestamp: '2024-08-01T10:00:00Z',
      });
      await postEvent({
        event: 'md_ev2',
        device_id: mdDev2,
        timestamp: '2024-08-02T10:00:00Z',
      });
      await postEvent({
        event: 'md_ev3',
        device_id: mdDev3,
        timestamp: '2024-08-03T10:00:00Z',
      });

      // Map all 3 devices to the same user
      await postEvent({
        event: 'md_id1',
        device_id: mdDev1,
        user_id: mdUser,
        timestamp: '2024-08-10T10:00:00Z',
      });
      await postEvent({
        event: 'md_id2',
        device_id: mdDev2,
        user_id: mdUser,
        timestamp: '2024-08-10T11:00:00Z',
      });
      await postEvent({
        event: 'md_id3',
        device_id: mdDev3,
        user_id: mdUser,
        timestamp: '2024-08-10T12:00:00Z',
      });
    });

    it('returns events from ALL devices mapped to the same user', async () => {
      const res = await getEvents({ user_id: mdUser });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;

      // 3 anonymous + 3 identify = 6
      expect(events.length).toBe(6);

      const names = events.map((e: { event?: string; event_name?: string }) => e.event ?? e.event_name);
      expect(names).toContain('md_ev1');
      expect(names).toContain('md_ev2');
      expect(names).toContain('md_ev3');
    });

    it('querying by any of the 3 devices returns the same full set', async () => {
      const results = await Promise.all([
        getEvents({ device_id: mdDev1 }),
        getEvents({ device_id: mdDev2 }),
        getEvents({ device_id: mdDev3 }),
      ]);

      for (const res of results) {
        expect(res.status).toBe(200);
        const body = await res.json();
        const events = Array.isArray(body) ? body : body.events ?? body.data;
        expect(events.length).toBe(6);
      }
    });
  });

  // ── Edge cases / adversarial ──────────────────────────────────────────────

  describe('Edge cases', () => {
    it('returns empty array for a device_id that has no events at all', async () => {
      const res = await getEvents({ device_id: `${PREFIX}nonexistent-device` });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(0);
    });

    it('does not return events from a conflicted mapping attempt', async () => {
      const conflictDev = `${PREFIX}dev-conflict-res`;
      const originalUser = `${PREFIX}user-orig`;
      const conflictUser = `${PREFIX}user-conflict`;

      // Establish mapping: conflictDev → originalUser
      await postEvent({
        event: 'conflict_setup',
        device_id: conflictDev,
        user_id: originalUser,
        timestamp: '2024-09-01T10:00:00Z',
      });

      // Attempt conflicting mapping (should be rejected with 409)
      const conflict = await postEvent({
        event: 'conflict_attempt',
        device_id: conflictDev,
        user_id: conflictUser,
        timestamp: '2024-09-02T10:00:00Z',
      });
      expect(conflict.status).toBe(409);

      // Query conflictUser — should have NO events (the conflicted event was not inserted)
      const res = await getEvents({ user_id: conflictUser });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(events.length).toBe(0);
    });

    it('handles SQL injection in user_id query parameter', async () => {
      const res = await getEvents({ user_id: "'; DROP TABLE events;--" });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(0);
    });

    it('handles SQL injection in device_id query parameter', async () => {
      const res = await getEvents({ device_id: "1 OR 1=1; DELETE FROM events;--" });
      expect(res.status).toBe(200);

      const body = await res.json();
      const events = Array.isArray(body) ? body : body.events ?? body.data;
      expect(Array.isArray(events)).toBe(true);
      // Should NOT return all events — SQL injection should be treated as a literal string
      expect(events.length).toBe(0);
    });
  });
});
