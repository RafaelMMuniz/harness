/**
 * User Profiles Tests — BR-304
 *
 * Tests user profile lookup, identity cluster display, event timeline.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, post, get } from './test-server.js';

describe('BR-304: User Profiles', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // ─── Basic Profile Lookup ──────────────────────────────────────────

  describe('Profile lookup by user_id', () => {
    it('returns profile with all required fields', async () => {
      const userId = 'profile-basic@example.com';
      const deviceId = 'profile-basic-device';

      await post('/api/events', { event: 'Page Viewed', device_id: deviceId, timestamp: '2025-05-01T00:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceId, user_id: userId, timestamp: '2025-05-01T01:00:00.000Z' });
      await post('/api/events', { event: 'Purchase', device_id: deviceId, user_id: userId, timestamp: '2025-05-01T02:00:00.000Z' });

      const res = await get(`/api/users/${encodeURIComponent(userId)}`);
      expect(res.status).toBe(200);
      const profile = await res.json();

      expect(profile.user_id).toBe(userId);
      expect(Array.isArray(profile.device_ids)).toBe(true);
      expect(profile.device_ids).toContain(deviceId);
      expect(profile.total_events).toBe(3);
      expect(profile.first_seen).toBeDefined();
      expect(profile.last_seen).toBeDefined();
      expect(profile.events).toBeDefined();
      expect(profile.events).toHaveLength(3);
    });

    it('first_seen and last_seen are correct', async () => {
      const userId = 'profile-timestamps@example.com';
      const deviceId = 'profile-ts-device';

      await post('/api/events', { event: 'First', device_id: deviceId, user_id: userId, timestamp: '2025-05-10T08:00:00.000Z' });
      await post('/api/events', { event: 'Middle', device_id: deviceId, user_id: userId, timestamp: '2025-05-10T12:00:00.000Z' });
      await post('/api/events', { event: 'Last', device_id: deviceId, user_id: userId, timestamp: '2025-05-10T20:00:00.000Z' });

      const res = await get(`/api/users/${encodeURIComponent(userId)}`);
      const profile = await res.json();

      expect(profile.first_seen).toBe('2025-05-10T08:00:00.000Z');
      expect(profile.last_seen).toBe('2025-05-10T20:00:00.000Z');
    });
  });

  // ─── Identity Cluster ──────────────────────────────────────────────

  describe('Identity cluster display', () => {
    it('shows all device identities linked to the user', async () => {
      const userId = 'cluster-user@example.com';
      const deviceA = 'cluster-phone';
      const deviceB = 'cluster-laptop';
      const deviceC = 'cluster-tablet';

      // Create events and mappings
      await post('/api/events', { event: 'Page Viewed', device_id: deviceA, timestamp: '2025-06-01T00:00:00.000Z' });
      await post('/api/events', { event: 'Page Viewed', device_id: deviceB, timestamp: '2025-06-01T01:00:00.000Z' });
      await post('/api/events', { event: 'Page Viewed', device_id: deviceC, timestamp: '2025-06-01T02:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceA, user_id: userId, timestamp: '2025-06-01T03:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceB, user_id: userId, timestamp: '2025-06-01T04:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceC, user_id: userId, timestamp: '2025-06-01T05:00:00.000Z' });

      const res = await get(`/api/users/${encodeURIComponent(userId)}`);
      const profile = await res.json();

      expect(profile.device_ids).toContain(deviceA);
      expect(profile.device_ids).toContain(deviceB);
      expect(profile.device_ids).toContain(deviceC);
      expect(profile.device_ids).toHaveLength(3);
    });

    it('includes merged anonymous events in the profile event list', async () => {
      const userId = 'cluster-anon@example.com';
      const deviceId = 'cluster-anon-device';

      // 3 anonymous events
      await post('/api/events', { event: 'PageA', device_id: deviceId, timestamp: '2025-06-02T00:00:00.000Z' });
      await post('/api/events', { event: 'PageB', device_id: deviceId, timestamp: '2025-06-02T01:00:00.000Z' });
      await post('/api/events', { event: 'PageC', device_id: deviceId, timestamp: '2025-06-02T02:00:00.000Z' });

      // Identify
      await post('/api/events', { event: 'Login', device_id: deviceId, user_id: userId, timestamp: '2025-06-02T03:00:00.000Z' });

      const res = await get(`/api/users/${encodeURIComponent(userId)}`);
      const profile = await res.json();

      expect(profile.total_events).toBe(4);
      expect(profile.events).toHaveLength(4);

      // The anonymous events should be in the list
      const eventNames = profile.events.map((e: { event: string }) => e.event);
      expect(eventNames).toContain('PageA');
      expect(eventNames).toContain('PageB');
      expect(eventNames).toContain('PageC');
      expect(eventNames).toContain('Login');
    });
  });

  // ─── Lookup by Device ID ───────────────────────────────────────────

  describe('Lookup by device_id', () => {
    it('looking up by device_id returns the resolved user profile', async () => {
      const userId = 'device-lookup@example.com';
      const deviceId = 'device-lookup-dev';

      await post('/api/events', { event: 'Page Viewed', device_id: deviceId, timestamp: '2025-07-01T00:00:00.000Z' });
      await post('/api/events', { event: 'Login', device_id: deviceId, user_id: userId, timestamp: '2025-07-01T01:00:00.000Z' });

      // Look up by device_id
      const res = await get(`/api/users/${encodeURIComponent(deviceId)}`);
      expect(res.status).toBe(200);
      const profile = await res.json();

      expect(profile.user_id).toBe(userId);
      expect(profile.device_ids).toContain(deviceId);
    });

    it('looking up unidentified device returns device profile', async () => {
      const deviceId = 'unid-device-lookup';

      await post('/api/events', { event: 'Page Viewed', device_id: deviceId, timestamp: '2025-07-02T00:00:00.000Z' });
      await post('/api/events', { event: 'Button Clicked', device_id: deviceId, timestamp: '2025-07-02T01:00:00.000Z' });

      const res = await get(`/api/users/${encodeURIComponent(deviceId)}`);
      expect(res.status).toBe(200);
      const profile = await res.json();

      expect(profile.total_events).toBe(2);
    });
  });

  // ─── 404 for Unknown User ─────────────────────────────────────────

  describe('Unknown user', () => {
    it('returns 404 for unknown user_id', async () => {
      const res = await get('/api/users/nonexistent-user-xyz');
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ─── Saved Analyses (BR-400) ───────────────────────────────────────

  describe('BR-400: Saved Analyses', () => {
    it('can create, list, get, and delete a saved analysis', async () => {
      // Create
      const createRes = await post('/api/saved-analyses', {
        name: 'My Trend',
        type: 'trend',
        config: { event_name: 'Page Viewed', granularity: 'day' },
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('My Trend');

      // List
      const listRes = await get('/api/saved-analyses');
      const list = await listRes.json();
      expect(list.length).toBeGreaterThanOrEqual(1);

      // Get by ID
      const getRes = await get(`/api/saved-analyses/${created.id}`);
      expect(getRes.status).toBe(200);
      const fetched = await getRes.json();
      expect(fetched.name).toBe('My Trend');
      expect(fetched.config).toEqual({ event_name: 'Page Viewed', granularity: 'day' });

      // Delete
      const { del } = await import('./test-server.js');
      const deleteRes = await del(`/api/saved-analyses/${created.id}`);
      expect(deleteRes.status).toBe(200);

      // Verify deleted
      const getDeletedRes = await get(`/api/saved-analyses/${created.id}`);
      expect(getDeletedRes.status).toBe(404);
    });
  });
});
