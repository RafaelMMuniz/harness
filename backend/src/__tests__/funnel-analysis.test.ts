/**
 * Funnel Analysis Tests — BR-303
 *
 * Tests funnel queries: step ordering, conversion rates, drop-offs, identity resolution.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer, post } from './test-server.js';

describe('BR-303: Funnel Analysis', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // ─── Basic Funnel ──────────────────────────────────────────────────

  describe('Basic funnel computation', () => {
    it('computes conversion rates for a 2-step funnel', async () => {
      // User A: completes both steps
      await post('/api/events', { event: 'F_Step1', user_id: 'funnel-userA', timestamp: '2025-04-01T00:00:00.000Z' });
      await post('/api/events', { event: 'F_Step2', user_id: 'funnel-userA', timestamp: '2025-04-01T01:00:00.000Z' });

      // User B: only step 1
      await post('/api/events', { event: 'F_Step1', user_id: 'funnel-userB', timestamp: '2025-04-01T00:00:00.000Z' });

      const res = await post('/api/funnels/query', {
        steps: ['F_Step1', 'F_Step2'],
        start_date: '2025-04-01T00:00:00.000Z',
        end_date: '2025-04-01T23:59:59.999Z',
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.steps).toHaveLength(2);
      expect(data.steps[0].event_name).toBe('F_Step1');
      expect(data.steps[0].count).toBe(2); // A and B
      expect(data.steps[1].event_name).toBe('F_Step2');
      expect(data.steps[1].count).toBe(1); // only A
      expect(data.overall_conversion_rate).toBe(0.5);
    });

    it('computes a 3-step funnel with drop-offs', async () => {
      // 3 users start, 2 reach step 2, 1 reaches step 3
      await post('/api/events', { event: 'F3_Page', user_id: 'f3-userA', timestamp: '2025-04-02T00:00:00.000Z' });
      await post('/api/events', { event: 'F3_Page', user_id: 'f3-userB', timestamp: '2025-04-02T00:00:00.000Z' });
      await post('/api/events', { event: 'F3_Page', user_id: 'f3-userC', timestamp: '2025-04-02T00:00:00.000Z' });

      await post('/api/events', { event: 'F3_Signup', user_id: 'f3-userA', timestamp: '2025-04-02T01:00:00.000Z' });
      await post('/api/events', { event: 'F3_Signup', user_id: 'f3-userB', timestamp: '2025-04-02T01:00:00.000Z' });

      await post('/api/events', { event: 'F3_Purchase', user_id: 'f3-userA', timestamp: '2025-04-02T02:00:00.000Z' });

      const res = await post('/api/funnels/query', {
        steps: ['F3_Page', 'F3_Signup', 'F3_Purchase'],
        start_date: '2025-04-02T00:00:00.000Z',
        end_date: '2025-04-02T23:59:59.999Z',
      });
      const data = await res.json();

      expect(data.steps[0].count).toBe(3);
      expect(data.steps[1].count).toBe(2);
      expect(data.steps[2].count).toBe(1);

      // Drop-off between step 1 and 2
      expect(data.steps[1].drop_off).toBe(1);
      // Drop-off between step 2 and 3
      expect(data.steps[2].drop_off).toBe(1);

      // Overall conversion = 1/3
      expect(data.overall_conversion_rate).toBeCloseTo(1 / 3, 5);
    });

    it('supports up to 5 steps', async () => {
      for (let step = 1; step <= 5; step++) {
        await post('/api/events', {
          event: `F5_Step${step}`,
          user_id: 'f5-user',
          timestamp: `2025-04-03T0${step}:00:00.000Z`,
        });
      }

      const res = await post('/api/funnels/query', {
        steps: ['F5_Step1', 'F5_Step2', 'F5_Step3', 'F5_Step4', 'F5_Step5'],
        start_date: '2025-04-03T00:00:00.000Z',
        end_date: '2025-04-03T23:59:59.999Z',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.steps).toHaveLength(5);
      for (const step of data.steps) {
        expect(step.count).toBe(1);
      }
    });
  });

  // ─── Step Ordering ─────────────────────────────────────────────────

  describe('Step order is respected by timestamp', () => {
    it('user who does step 2 before step 1 is NOT counted as converting', async () => {
      // User does step 2 first, then step 1 — wrong order
      await post('/api/events', { event: 'Order_Step2', user_id: 'order-userWrong', timestamp: '2025-04-04T00:00:00.000Z' });
      await post('/api/events', { event: 'Order_Step1', user_id: 'order-userWrong', timestamp: '2025-04-04T01:00:00.000Z' });

      // User does steps in correct order
      await post('/api/events', { event: 'Order_Step1', user_id: 'order-userCorrect', timestamp: '2025-04-04T00:00:00.000Z' });
      await post('/api/events', { event: 'Order_Step2', user_id: 'order-userCorrect', timestamp: '2025-04-04T01:00:00.000Z' });

      const res = await post('/api/funnels/query', {
        steps: ['Order_Step1', 'Order_Step2'],
        start_date: '2025-04-04T00:00:00.000Z',
        end_date: '2025-04-04T23:59:59.999Z',
      });
      const data = await res.json();

      expect(data.steps[0].count).toBe(2); // Both users did step 1
      expect(data.steps[1].count).toBe(1); // Only correct-order user converted
    });
  });

  // ─── Identity Resolution in Funnels ────────────────────────────────

  describe('Identity resolution in funnels', () => {
    it('anonymous step 1 and identified step 2 count as one user progressing', async () => {
      const deviceId = 'funnel-anon-device-017';
      const userId = 'funnel-anon-user-017@example.com';

      // Anonymous step 1
      await post('/api/events', {
        event: 'FunnelID_Step1',
        device_id: deviceId,
        timestamp: '2025-04-05T00:00:00.000Z',
      });

      // Identify
      await post('/api/events', {
        event: 'Login',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-04-05T01:00:00.000Z',
      });

      // Identified step 2
      await post('/api/events', {
        event: 'FunnelID_Step2',
        device_id: deviceId,
        user_id: userId,
        timestamp: '2025-04-05T02:00:00.000Z',
      });

      const res = await post('/api/funnels/query', {
        steps: ['FunnelID_Step1', 'FunnelID_Step2'],
        start_date: '2025-04-05T00:00:00.000Z',
        end_date: '2025-04-05T23:59:59.999Z',
      });
      const data = await res.json();

      expect(data.steps[0].count).toBe(1);
      expect(data.steps[1].count).toBe(1);
      expect(data.overall_conversion_rate).toBe(1.0);
    });

    it('multi-device user in funnel: step 1 on phone, step 2 on laptop', async () => {
      const phone = 'funnel-phone-018';
      const laptop = 'funnel-laptop-018';
      const userId = 'funnel-multi-018@example.com';

      // Step 1 on phone (anonymous)
      await post('/api/events', {
        event: 'FMulti_Step1',
        device_id: phone,
        timestamp: '2025-04-06T00:00:00.000Z',
      });

      // Identify phone
      await post('/api/events', {
        event: 'Login',
        device_id: phone,
        user_id: userId,
        timestamp: '2025-04-06T01:00:00.000Z',
      });

      // Identify laptop
      await post('/api/events', {
        event: 'Login',
        device_id: laptop,
        user_id: userId,
        timestamp: '2025-04-06T02:00:00.000Z',
      });

      // Step 2 on laptop
      await post('/api/events', {
        event: 'FMulti_Step2',
        device_id: laptop,
        user_id: userId,
        timestamp: '2025-04-06T03:00:00.000Z',
      });

      const res = await post('/api/funnels/query', {
        steps: ['FMulti_Step1', 'FMulti_Step2'],
        start_date: '2025-04-06T00:00:00.000Z',
        end_date: '2025-04-06T23:59:59.999Z',
      });
      const data = await res.json();

      expect(data.steps[0].count).toBe(1);
      expect(data.steps[1].count).toBe(1);
      expect(data.overall_conversion_rate).toBe(1.0);
    });
  });

  // ─── Validation ────────────────────────────────────────────────────

  describe('Funnel validation', () => {
    it('rejects funnel with fewer than 2 steps', async () => {
      const res = await post('/api/funnels/query', {
        steps: ['OnlyOneStep'],
      });
      expect(res.status).toBe(400);
    });

    it('rejects funnel with more than 5 steps', async () => {
      const res = await post('/api/funnels/query', {
        steps: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
      });
      expect(res.status).toBe(400);
    });

    it('handles empty funnel (no matching events)', async () => {
      const res = await post('/api/funnels/query', {
        steps: ['NonexistentStep_A', 'NonexistentStep_B'],
        start_date: '2025-04-01T00:00:00.000Z',
        end_date: '2025-04-01T23:59:59.999Z',
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.steps[0].count).toBe(0);
      expect(data.steps[1].count).toBe(0);
    });
  });
});
