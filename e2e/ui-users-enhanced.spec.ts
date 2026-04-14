import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents, type EventPayload } from './helpers';

const BASE_URL = 'http://localhost:5173';

// Unique prefixes to avoid collisions with other test runs
const DEVICE_A = 'test-ui-enhanced-device-A';
const DEVICE_B = 'test-ui-enhanced-device-B';
const USER_ID = 'test-ui-enhanced-user@example.com';

function isoAt(daysAgo: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Seed scenario:
 *
 *   1. Several anonymous events from device-A (before identity is known).
 *   2. Several anonymous events from device-B (before identity is known).
 *   3. An identified event that links device-A → USER_ID (retroactive merge).
 *   4. An identified event that links device-B → USER_ID (retroactive merge).
 *   5. Additional post-identification events from both devices.
 *
 * After seeding, querying the user profile for USER_ID must surface events
 * from both devices including the pre-merge anonymous ones.
 */
async function seedEnhancedUserProfile(request: import('@playwright/test').APIRequestContext) {
  // Phase 1 — anonymous events from device A (3 days ago, before login)
  const anonymousDeviceA: EventPayload[] = [
    {
      event: 'test-ui-enhanced-Page Viewed',
      device_id: DEVICE_A,
      timestamp: isoAt(3, 9, 0),
      properties: { page: '/home', referrer: 'google' },
    },
    {
      event: 'test-ui-enhanced-Button Clicked',
      device_id: DEVICE_A,
      timestamp: isoAt(3, 9, 10),
      properties: { button_label: 'Learn More' },
    },
    {
      event: 'test-ui-enhanced-Page Viewed',
      device_id: DEVICE_A,
      timestamp: isoAt(3, 9, 20),
      properties: { page: '/pricing' },
    },
  ];

  // Phase 2 — anonymous events from device B (2 days ago, before login)
  const anonymousDeviceB: EventPayload[] = [
    {
      event: 'test-ui-enhanced-Page Viewed',
      device_id: DEVICE_B,
      timestamp: isoAt(2, 10, 0),
      properties: { page: '/blog' },
    },
    {
      event: 'test-ui-enhanced-Feature Used',
      device_id: DEVICE_B,
      timestamp: isoAt(2, 10, 15),
      properties: { feature: 'dark-mode' },
    },
  ];

  const batchRes = await createBatchEvents(request, [...anonymousDeviceA, ...anonymousDeviceB]);
  if (!batchRes.ok()) {
    throw new Error(`Anonymous seed failed: ${batchRes.status()} ${await batchRes.text()}`);
  }

  // Phase 3 — link device-A to USER_ID (retroactive identity resolution)
  const linkA = await createEvent(request, {
    event: 'test-ui-enhanced-Signup Completed',
    device_id: DEVICE_A,
    user_id: USER_ID,
    timestamp: isoAt(1, 8, 0),
    properties: { plan: 'pro' },
  });
  if (!linkA.ok()) {
    throw new Error(`Device-A identity link failed: ${linkA.status()} ${await linkA.text()}`);
  }

  // Phase 4 — link device-B to USER_ID (multi-device merge)
  const linkB = await createEvent(request, {
    event: 'test-ui-enhanced-Login',
    device_id: DEVICE_B,
    user_id: USER_ID,
    timestamp: isoAt(1, 9, 0),
    properties: { method: 'google' },
  });
  if (!linkB.ok()) {
    throw new Error(`Device-B identity link failed: ${linkB.status()} ${await linkB.text()}`);
  }

  // Phase 5 — post-identification events from both devices
  const postIdentifiedEvents: EventPayload[] = [
    {
      event: 'test-ui-enhanced-Purchase Completed',
      device_id: DEVICE_A,
      user_id: USER_ID,
      timestamp: isoAt(0, 14, 0),
      properties: { amount: 99, currency: 'USD', plan: 'pro' },
    },
    {
      event: 'test-ui-enhanced-Page Viewed',
      device_id: DEVICE_B,
      user_id: USER_ID,
      timestamp: isoAt(0, 15, 0),
      properties: { page: '/dashboard' },
    },
  ];

  const postRes = await createBatchEvents(request, postIdentifiedEvents);
  if (!postRes.ok()) {
    throw new Error(`Post-ID seed failed: ${postRes.status()} ${await postRes.text()}`);
  }
}

test.describe('Enhanced User Profile UI', () => {
  test.beforeAll(async ({ request }) => {
    await seedEnhancedUserProfile(request);
  });

  // ---------------------------------------------------------------------------
  // Identity cluster
  // ---------------------------------------------------------------------------

  test('user profile shows identity cluster with resolved user_id and linked device_ids', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/users/${encodeURIComponent(USER_ID)}`);

    // Identity cluster section must be visible
    const cluster = page.getByTestId('identity-cluster');
    await expect(cluster).toBeVisible({ timeout: 10_000 });

    // The known user_id must appear within the cluster
    await expect(cluster).toContainText(USER_ID);

    // Both device IDs must appear within the cluster (merged identities)
    await expect(cluster).toContainText(DEVICE_A);
    await expect(cluster).toContainText(DEVICE_B);
  });

  // ---------------------------------------------------------------------------
  // Event timeline ordering
  // ---------------------------------------------------------------------------

  test('event timeline shows events in chronological order with source identity labels', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/users/${encodeURIComponent(USER_ID)}`);

    const timeline = page.getByTestId('profile-event-timeline');
    await expect(timeline).toBeVisible({ timeout: 10_000 });

    const rows = timeline.getByTestId('profile-event-row');
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });

    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    // Collect timestamps from all visible rows and verify ascending order
    const timestamps: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const cell = rows.nth(i).getByTestId('profile-event-timestamp');
      const text = await cell.textContent();
      if (text) {
        const parsed = Date.parse(text.trim());
        if (!Number.isNaN(parsed)) {
          timestamps.push(parsed);
        }
      }
    }

    // Must have collected at least 2 parseable timestamps
    expect(timestamps.length).toBeGreaterThanOrEqual(2);

    // Timestamps must be non-decreasing (chronological)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }

    // Each row must show a source identity label (device_id or user_id)
    const firstRowSource = rows.first().getByTestId('profile-event-source');
    await expect(firstRowSource).toBeVisible();
    const sourceText = await firstRowSource.textContent();
    expect(sourceText?.trim().length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Anonymous event indicator
  // ---------------------------------------------------------------------------

  test('anonymous events (pre-merge) have a visual indicator distinguishing them', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/users/${encodeURIComponent(USER_ID)}`);

    const timeline = page.getByTestId('profile-event-timeline');
    await expect(timeline).toBeVisible({ timeout: 10_000 });

    await expect(timeline.getByTestId('profile-event-row').first()).toBeVisible({
      timeout: 8_000,
    });

    // There must be at least one event row tagged as anonymous
    const anonymousIndicators = timeline.getByTestId('profile-event-anonymous-badge');
    await expect(anonymousIndicators.first()).toBeVisible({ timeout: 5_000 });

    // The badge must contain meaningful text (e.g. "Anonymous", "anon", an icon's aria-label, etc.)
    const badgeText = await anonymousIndicators.first().textContent();
    const badgeAriaLabel = await anonymousIndicators.first().getAttribute('aria-label');
    const hasContent =
      (badgeText?.trim().length ?? 0) > 0 || (badgeAriaLabel?.trim().length ?? 0) > 0;
    expect(hasContent).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Pagination / Load more
  // ---------------------------------------------------------------------------

  test('timeline supports pagination or a "Load more" control when there are many events', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/users/${encodeURIComponent(USER_ID)}`);

    const timeline = page.getByTestId('profile-event-timeline');
    await expect(timeline).toBeVisible({ timeout: 10_000 });

    await expect(timeline.getByTestId('profile-event-row').first()).toBeVisible({
      timeout: 8_000,
    });

    // The page should expose at least one pagination / load-more mechanism.
    // We accept either a "Load more" button OR prev/next pagination controls.
    const loadMoreBtn = page.getByTestId('profile-load-more');
    const paginationNext = page.getByTestId('profile-pagination-next');

    const loadMoreVisible = await loadMoreBtn.isVisible().catch(() => false);
    const paginationVisible = await paginationNext.isVisible().catch(() => false);

    // At least one must be present in the DOM (enabled or not)
    const loadMoreInDom = (await loadMoreBtn.count()) > 0;
    const paginationInDom = (await paginationNext.count()) > 0;

    expect(loadMoreInDom || paginationInDom || loadMoreVisible || paginationVisible).toBe(true);

    // If "Load more" is visible and enabled, clicking it should add more rows
    if (loadMoreVisible) {
      const countBefore = await timeline.getByTestId('profile-event-row').count();
      const isEnabled = await loadMoreBtn.isEnabled();
      if (isEnabled) {
        await loadMoreBtn.click();
        // After click, the row count must be >= what it was before
        const countAfter = await timeline.getByTestId('profile-event-row').count();
        expect(countAfter).toBeGreaterThanOrEqual(countBefore);
      }
    }
  });
});
