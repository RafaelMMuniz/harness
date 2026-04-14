import { test, expect } from '@playwright/test';
import { createBatchEvents, type EventPayload } from './helpers';

const BASE_URL = 'http://localhost:5173';

// Unique prefixes to avoid collisions with other test runs
const DEVICE_PREFIX = 'test-ui-events-device-';
const USER_PREFIX = 'test-ui-events-user-';

// 3 event types for filtering tests
const EVENT_PAGE_VIEW = 'test-ui-events-Page Viewed';
const EVENT_BUTTON_CLICK = 'test-ui-events-Button Clicked';
const EVENT_PURCHASE = 'test-ui-events-Purchase Completed';

// Non-existent event name for empty-state test
const EVENT_NONEXISTENT = 'test-ui-events-__nonexistent__event__xyz__';

function isoAt(daysAgo: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Build 65 events: 30 page views, 25 button clicks, 10 purchases
function buildSeedEvents(): EventPayload[] {
  const events: EventPayload[] = [];

  // 30 Page Viewed events across 5 devices / 3 users, spread over 29 days
  const pages = ['/home', '/pricing', '/docs', '/blog', '/signup'];
  for (let i = 0; i < 30; i++) {
    const deviceIdx = i % 5;
    const userIdx = i % 3;
    events.push({
      event: EVENT_PAGE_VIEW,
      device_id: `${DEVICE_PREFIX}d${deviceIdx}`,
      user_id: i >= 10 ? `${USER_PREFIX}u${userIdx}` : undefined,
      timestamp: isoAt(28 - i, 9 + (i % 8)),
      properties: {
        page: pages[i % pages.length],
        referrer: i % 2 === 0 ? 'google' : 'direct',
        duration_ms: 1000 + i * 150,
      },
    });
  }

  // 25 Button Clicked events across 4 devices / 2 users
  const buttons = ['Sign Up', 'Learn More', 'Get Started', 'Buy Now', 'Contact'];
  for (let i = 0; i < 25; i++) {
    const deviceIdx = i % 4;
    events.push({
      event: EVENT_BUTTON_CLICK,
      device_id: `${DEVICE_PREFIX}btn${deviceIdx}`,
      user_id: i >= 5 ? `${USER_PREFIX}u${i % 2}` : undefined,
      timestamp: isoAt(25 - i, 11 + (i % 6)),
      properties: {
        button_label: buttons[i % buttons.length],
        page: pages[i % pages.length],
        is_cta: i % 2 === 0,
      },
    });
  }

  // 10 Purchase Completed events with numeric properties
  const plans = ['starter', 'pro', 'enterprise'];
  for (let i = 0; i < 10; i++) {
    events.push({
      event: EVENT_PURCHASE,
      device_id: `${DEVICE_PREFIX}pay${i % 3}`,
      user_id: `${USER_PREFIX}buyer${i % 4}`,
      timestamp: isoAt(20 - i, 14 + (i % 4)),
      properties: {
        plan: plans[i % plans.length],
        amount: 49 + i * 10,
        currency: 'USD',
        quantity: 1 + (i % 3),
      },
    });
  }

  return events;
}

test.describe('Event Explorer UI', () => {
  test.beforeAll(async ({ request }) => {
    const events = buildSeedEvents();

    // Send in two batches to stay within reasonable payload sizes
    const mid = Math.ceil(events.length / 2);
    const res1 = await createBatchEvents(request, events.slice(0, mid));
    const res2 = await createBatchEvents(request, events.slice(mid));

    if (!res1.ok()) {
      throw new Error(`Batch 1 seeding failed: ${res1.status()} ${await res1.text()}`);
    }
    if (!res2.ok()) {
      throw new Error(`Batch 2 seeding failed: ${res2.status()} ${await res2.text()}`);
    }
  });

  test('events page loads at / and renders a table containing event data', async ({ page }) => {
    await page.goto(BASE_URL);

    // The events explorer table must be present
    const table = page.getByTestId('events-table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // At least one row of data should exist (seeded above)
    const rows = page.getByTestId('event-row');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  });

  test('table displays Timestamp, Event Name, User identity, and Properties preview columns', async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    const table = page.getByTestId('events-table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Column headers
    await expect(page.getByTestId('col-timestamp')).toBeVisible();
    await expect(page.getByTestId('col-event-name')).toBeVisible();
    await expect(page.getByTestId('col-identity')).toBeVisible();
    await expect(page.getByTestId('col-properties')).toBeVisible();

    // First row should populate all four cells
    const firstRow = page.getByTestId('event-row').first();
    await expect(firstRow.getByTestId('cell-timestamp')).toBeVisible();
    await expect(firstRow.getByTestId('cell-event-name')).toBeVisible();
    await expect(firstRow.getByTestId('cell-identity')).toBeVisible();
    await expect(firstRow.getByTestId('cell-properties')).toBeVisible();
  });

  test('filter by event name updates table to show only matching events', async ({ page }) => {
    await page.goto(BASE_URL);

    const table = page.getByTestId('events-table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Select the event-name filter dropdown and pick Purchase Completed
    const filter = page.getByTestId('filter-event-name');
    await expect(filter).toBeVisible();
    await filter.selectOption(EVENT_PURCHASE);

    // Wait for table to update
    await expect(page.getByTestId('event-row').first()).toBeVisible({ timeout: 8_000 });

    // Every visible row must match the chosen event name
    const rows = page.getByTestId('event-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cellText = await rows.nth(i).getByTestId('cell-event-name').textContent();
      expect(cellText).toContain(EVENT_PURCHASE);
    }
  });

  test('filter by date range updates the table', async ({ page }) => {
    await page.goto(BASE_URL);

    const table = page.getByTestId('events-table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Record current row count before filtering
    const allRows = page.getByTestId('event-row');
    await expect(allRows.first()).toBeVisible();
    const totalBefore = await allRows.count();

    // Set a narrow date range: only last 5 days
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 5);

    const fmt = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD

    const startInput = page.getByTestId('filter-start-date');
    const endInput = page.getByTestId('filter-end-date');

    await expect(startInput).toBeVisible();
    await expect(endInput).toBeVisible();

    await startInput.fill(fmt(startDate));
    await endInput.fill(fmt(now));

    // Trigger the filter (either auto or via apply button)
    const applyBtn = page.getByTestId('filter-apply');
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    }

    // Allow table to refresh
    await page.waitForTimeout(500);

    // Narrow range should return fewer events than the full unfiltered set
    // (seeded events span 29 days; last 5 days only contain a subset)
    const filteredRows = page.getByTestId('event-row');
    const totalAfter = await filteredRows.count();

    // The date-filtered count should be strictly less than the full dataset
    expect(totalAfter).toBeLessThan(totalBefore);
  });

  test('pagination — Next loads next page, Previous returns to prior page', async ({ page }) => {
    await page.goto(BASE_URL);

    // Make sure we are NOT filtering by event name so all 65 seeded events are visible
    // (plus any pre-existing data, total > 50 triggers pagination)
    const table = page.getByTestId('events-table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Capture the identity shown in the first row on page 1
    const firstRowPage1 = page.getByTestId('event-row').first();
    await expect(firstRowPage1).toBeVisible();
    const identityPage1 = await firstRowPage1.getByTestId('cell-identity').textContent();

    // Click Next
    const nextBtn = page.getByTestId('pagination-next');
    await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
    await nextBtn.click();

    // Wait for page 2 to load
    await expect(page.getByTestId('event-row').first()).toBeVisible({ timeout: 8_000 });

    // Page 2 should show different data
    const firstRowPage2 = page.getByTestId('event-row').first();
    const identityPage2 = await firstRowPage2.getByTestId('cell-identity').textContent();
    expect(identityPage2).not.toEqual(identityPage1);

    // Click Previous to go back
    const prevBtn = page.getByTestId('pagination-prev');
    await expect(prevBtn).toBeEnabled({ timeout: 5_000 });
    await prevBtn.click();

    // Wait for page 1 to reload
    await expect(page.getByTestId('event-row').first()).toBeVisible({ timeout: 8_000 });

    const firstRowBack = page.getByTestId('event-row').first();
    const identityBack = await firstRowBack.getByTestId('cell-identity').textContent();
    expect(identityBack).toEqual(identityPage1);
  });

  test('clicking a table row expands to show all event properties as key-value pairs', async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Filter to Purchase Completed so we get known properties
    const filter = page.getByTestId('filter-event-name');
    await expect(filter).toBeVisible({ timeout: 10_000 });
    await filter.selectOption(EVENT_PURCHASE);

    const firstRow = page.getByTestId('event-row').first();
    await expect(firstRow).toBeVisible({ timeout: 8_000 });

    // Click to expand
    await firstRow.click();

    // Expanded properties panel should appear
    const propsPanel = page.getByTestId('event-properties-detail');
    await expect(propsPanel).toBeVisible({ timeout: 5_000 });

    // Should contain known property keys seeded above
    await expect(propsPanel).toContainText('plan');
    await expect(propsPanel).toContainText('amount');
    await expect(propsPanel).toContainText('currency');
    await expect(propsPanel).toContainText('quantity');

    // Each property must be presented as a key-value pair
    const kvPairs = propsPanel.getByTestId('property-kv');
    await expect(kvPairs.first()).toBeVisible();
    const pairCount = await kvPairs.count();
    expect(pairCount).toBeGreaterThanOrEqual(4);
  });

  test('empty state message appears when filters match no events', async ({ page }) => {
    await page.goto(BASE_URL);

    const filter = page.getByTestId('filter-event-name');
    await expect(filter).toBeVisible({ timeout: 10_000 });

    // Select the non-existent event type
    await filter.selectOption(EVENT_NONEXISTENT);

    // The empty state element must appear
    const emptyState = page.getByTestId('events-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 8_000 });

    // No event rows should be rendered
    const rows = page.getByTestId('event-row');
    expect(await rows.count()).toBe(0);
  });

  test('loading indicator is visible while data is being fetched', async ({ page }) => {
    // Intercept API calls and delay them so the spinner has time to appear
    await page.route('**/api/events**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto(BASE_URL);

    // The loading indicator must appear before the data arrives
    const loader = page.getByTestId('events-loading');
    await expect(loader).toBeVisible({ timeout: 5_000 });

    // After the delayed response, table should eventually render and loader disappear
    const table = page.getByTestId('events-table');
    await expect(table).toBeVisible({ timeout: 10_000 });
    await expect(loader).not.toBeVisible({ timeout: 5_000 });
  });
});
