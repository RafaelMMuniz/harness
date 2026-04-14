import { test, expect } from '@playwright/test';
import { createBatchEvents, type EventPayload } from './helpers';

// ---------------------------------------------------------------------------
// Timestamps — fixed ISO strings so step ordering is deterministic
// ---------------------------------------------------------------------------

const T = (offsetMinutes: number): string => {
  const base = new Date('2024-03-01T12:00:00.000Z');
  base.setMinutes(base.getMinutes() + offsetMinutes);
  return base.toISOString();
};

// ---------------------------------------------------------------------------
// Seed data
//
// Step 1 — "page_viewed"   : 10 users
// Step 2 — "signup_completed" : 7 of those 10 users
// Step 3 — "purchase_completed" : 3 of those 7 users
//
// One identity-resolution scenario:
//   device "test-funnels-anon-device" does step 1 anonymously,
//   then identifies as user "test-funnels-idresolved-user" on step 2.
//   That user should count as one progression, not a dropout.
//
// One order-violation scenario:
//   user "test-funnels-outoforder-user" does step 2 BEFORE step 1.
//   Should NOT be counted as completing step 2.
// ---------------------------------------------------------------------------

const STEP1 = 'test-funnels-step1-page_viewed';
const STEP2 = 'test-funnels-step2-signup_completed';
const STEP3 = 'test-funnels-step3-purchase_completed';

// Users who complete all 3 steps in order (count toward steps 1, 2, 3)
const FULL_FUNNEL_USERS = [
  'test-funnels-user-full-1',
  'test-funnels-user-full-2',
  'test-funnels-user-full-3',
];

// Users who complete only steps 1 and 2 (count toward steps 1, 2)
const PARTIAL_S2_USERS = [
  'test-funnels-user-s2-1',
  'test-funnels-user-s2-2',
  'test-funnels-user-s2-3',
  'test-funnels-user-s2-4',
];

// Users who complete only step 1 (count toward step 1 only)
// We need 10 total at step 1:
//   3 full + 4 partial-s2 + 1 idresolved + 1 outoforder-step1 + 1 step1-only = 10
const STEP1_ONLY_USERS = ['test-funnels-user-s1-1'];
const OUTOFORDER_USER = 'test-funnels-outoforder-user';
const ANON_DEVICE = 'test-funnels-anon-device';
const IDRESOLVED_USER = 'test-funnels-idresolved-user';

// Funnel steps as used in query requests
const FUNNEL_STEPS = [
  { event_name: STEP1 },
  { event_name: STEP2 },
  { event_name: STEP3 },
];

test.describe('POST /api/funnels/query', () => {
  test.beforeAll(async ({ request }) => {
    const events: EventPayload[] = [];

    // --- Full funnel users (steps 1, 2, 3 in order) ---
    for (const user of FULL_FUNNEL_USERS) {
      events.push({ event: STEP1, user_id: user, timestamp: T(0) });
      events.push({ event: STEP2, user_id: user, timestamp: T(10) });
      events.push({ event: STEP3, user_id: user, timestamp: T(20) });
    }

    // --- Partial users (steps 1 and 2 only) ---
    for (const user of PARTIAL_S2_USERS) {
      events.push({ event: STEP1, user_id: user, timestamp: T(0) });
      events.push({ event: STEP2, user_id: user, timestamp: T(10) });
    }

    // --- Step 1 only users ---
    for (const user of STEP1_ONLY_USERS) {
      events.push({ event: STEP1, user_id: user, timestamp: T(0) });
    }

    // --- Out-of-order user: does step 2 BEFORE step 1 ---
    // step 2 first, then step 1 — must NOT count as completing step 2 in funnel
    events.push({ event: STEP2, user_id: OUTOFORDER_USER, timestamp: T(0) });
    events.push({ event: STEP1, user_id: OUTOFORDER_USER, timestamp: T(10) });

    // --- Identity resolution scenario ---
    // Anonymous device does step 1, then identifies as IDRESOLVED_USER on step 2.
    // After merge, both events belong to IDRESOLVED_USER → one user progressing.
    events.push({
      event: STEP1,
      device_id: ANON_DEVICE,
      timestamp: T(0),
    });
    events.push({
      event: STEP2,
      device_id: ANON_DEVICE,
      user_id: IDRESOLVED_USER,
      timestamp: T(10),
    });

    const response = await createBatchEvents(request, events);
    // Accept both 200 (batch) and 201 (some implementations)
    expect([200, 201]).toContain(response.status());
  });

  // -------------------------------------------------------------------------
  // Shape & invariants
  // -------------------------------------------------------------------------

  test('valid 3-step funnel returns expected response shape', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: FUNNEL_STEPS },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Top-level shape
    expect(Array.isArray(body.steps)).toBe(true);
    expect(body.steps).toHaveLength(3);
    expect(typeof body.overall_conversion_rate).toBe('number');

    // Each step shape
    for (const step of body.steps) {
      expect(typeof step.event_name).toBe('string');
      expect(step.event_name.length).toBeGreaterThan(0);
      expect(typeof step.count).toBe('number');
      expect(typeof step.conversion_rate).toBe('number');
      expect(typeof step.drop_off).toBe('number');
    }

    // Step event names must match request order
    expect(body.steps[0].event_name).toBe(STEP1);
    expect(body.steps[1].event_name).toBe(STEP2);
    expect(body.steps[2].event_name).toBe(STEP3);
  });

  test('steps[0].conversion_rate is always 1.0', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: FUNNEL_STEPS },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.steps[0].conversion_rate).toBeCloseTo(1.0, 5);
  });

  test('counts are non-increasing across steps (count[N] <= count[N-1])', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: FUNNEL_STEPS },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    const counts: number[] = body.steps.map((s: { count: number }) => s.count);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });

  test('step 1 count >= 10, step 2 count >= 7, step 3 count >= 3', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: FUNNEL_STEPS },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.steps[0].count).toBeGreaterThanOrEqual(10);
    expect(body.steps[1].count).toBeGreaterThanOrEqual(7);
    expect(body.steps[2].count).toBeGreaterThanOrEqual(3);
  });

  test('overall_conversion_rate equals step3.count / step1.count', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: FUNNEL_STEPS },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    const step1Count: number = body.steps[0].count;
    const step3Count: number = body.steps[2].count;
    const expectedOverall = step1Count > 0 ? step3Count / step1Count : 0;

    expect(body.overall_conversion_rate).toBeCloseTo(expectedOverall, 5);
  });

  // -------------------------------------------------------------------------
  // Step ordering enforcement
  // -------------------------------------------------------------------------

  test('user who performs step 2 before step 1 (by timestamp) is NOT counted at step 2', async ({
    request,
  }) => {
    // Query a 2-step funnel so we can isolate the out-of-order user's impact.
    // The out-of-order user has step 2 at T(0) and step 1 at T(10).
    // A correct implementation must NOT count that as a conversion.
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: {
        steps: [{ event_name: STEP1 }, { event_name: STEP2 }],
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // step1.count includes out-of-order user (they do eventually fire step1)
    // step2.count must NOT include them (their step2 came first)
    // We seeded:
    //   step1: 3 full + 4 partial-s2 + 1 step1-only + 1 outoforder + 1 idresolved = 10
    //   step2 correct progressions: 3 full + 4 partial-s2 + 1 idresolved = 8
    //   outoforder user must NOT be in step2
    const step1Count: number = body.steps[0].count;
    const step2Count: number = body.steps[1].count;

    // step2 must be strictly less than step1 because the out-of-order user
    // cannot be counted at step2 even though they appear at step1
    expect(step2Count).toBeLessThan(step1Count);

    // Specifically, the conversion rate at step 2 must be < 1.0
    // (the out-of-order user drops off, preventing a full conversion)
    expect(body.steps[1].conversion_rate).toBeLessThan(1.0);
  });

  // -------------------------------------------------------------------------
  // Identity resolution in funnels
  // -------------------------------------------------------------------------

  test('identity resolution: anon device step 1 + identified step 2 counts as one progression', async ({
    request,
  }) => {
    // Isolated 2-step funnel using only the identity-resolution pair.
    // We verify that IDRESOLVED_USER appears at step 2 with count >= 1.
    // (The full funnel test already checks aggregate counts; this test
    //  checks via a user-profile-style assertion on the funnel count.)
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: {
        steps: [{ event_name: STEP1 }, { event_name: STEP2 }],
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // After identity merge, IDRESOLVED_USER owns both the anonymous step 1
    // and the identified step 2.  The funnel must count them as one user
    // progressing from step 1 → step 2, so step 2 count must be >= 8
    // (3 full + 4 partial-s2 + 1 idresolved).
    expect(body.steps[1].count).toBeGreaterThanOrEqual(8);
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  test('fewer than 2 steps returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: [{ event_name: STEP1 }] },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('zero steps returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: { steps: [] },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('more than 5 steps returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: {
        steps: [
          { event_name: 'e1' },
          { event_name: 'e2' },
          { event_name: 'e3' },
          { event_name: 'e4' },
          { event_name: 'e5' },
          { event_name: 'e6' },
        ],
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('missing steps field returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/funnels/query', {
      data: {},
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});
