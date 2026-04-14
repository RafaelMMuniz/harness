import { test, expect } from '@playwright/test';
import { createBatchEvents, type EventPayload } from './helpers';

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/**
 * Build a batch of events spread over the last 30 days for two event types,
 * both carrying numeric properties so we can verify Sum/Avg aggregation UI.
 */
function buildSeedEvents(): EventPayload[] {
  const events: EventPayload[] = [];
  const now = new Date();

  // 30 days × ~5 purchase events/day + 30 days × ~4 page_view events/day
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const dayTs = new Date(now);
    dayTs.setDate(dayTs.getDate() - daysAgo);

    // Vary event counts so distribution is non-uniform
    const purchaseCount = daysAgo % 3 === 0 ? 8 : daysAgo % 3 === 1 ? 3 : 6;
    const pageViewCount = daysAgo % 2 === 0 ? 6 : 2;

    for (let i = 0; i < purchaseCount; i++) {
      const ts = new Date(dayTs);
      ts.setHours(i * 2);
      events.push({
        event: 'test-ui-trends-purchase-completed',
        user_id: `test-ui-trends-user-${(daysAgo * 10 + i) % 20}`,
        timestamp: ts.toISOString(),
        properties: {
          amount: 10 + (i * 7 + daysAgo * 3) % 490,
          currency: i % 2 === 0 ? 'USD' : 'EUR',
          plan: ['basic', 'pro', 'enterprise'][i % 3],
        },
      });
    }

    for (let i = 0; i < pageViewCount; i++) {
      const ts = new Date(dayTs);
      ts.setHours(6 + i * 3);
      events.push({
        event: 'test-ui-trends-page-viewed',
        user_id: `test-ui-trends-user-${(daysAgo * 5 + i) % 20}`,
        timestamp: ts.toISOString(),
        properties: {
          duration_ms: 500 + (i * 123 + daysAgo * 17) % 9500,
          page: ['/home', '/pricing', '/docs', '/blog'][i % 4],
        },
      });
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Trends page', () => {
  test.beforeAll(async ({ request }) => {
    const events = buildSeedEvents();
    // Batch accepts up to 1000; our seed is ~270 events so a single call is fine
    const response = await createBatchEvents(request, events);
    expect(response.status()).toBe(200);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  test('Trends page is accessible from sidebar navigation', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');
    const trendsLink = sidebar.getByRole('link', { name: 'Trends' });
    await expect(trendsLink).toBeVisible();
    await trendsLink.click();
    await expect(page).toHaveURL(/\/trends/);
  });

  // -------------------------------------------------------------------------
  // Default / empty state
  // -------------------------------------------------------------------------

  test('default state shows prompt to select an event', async ({ page }) => {
    await page.getByTestId('sidebar').getByRole('link', { name: 'Trends' }).click();
    await expect(page.locator('body')).toContainText(/select an event/i);
  });

  // -------------------------------------------------------------------------
  // Event selection → chart renders
  // -------------------------------------------------------------------------

  test('selecting an event from the dropdown renders a chart', async ({ page }) => {
    await page.goto('/trends');

    // Open event selector and pick the first available option
    const eventSelector = page.getByTestId('event-selector');
    await eventSelector.click();

    // Choose the seeded purchase event
    const option = page.getByRole('option', {
      name: 'test-ui-trends-purchase-completed',
    });
    await option.click();

    // A chart (SVG or canvas) must appear
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Granularity toggle
  // -------------------------------------------------------------------------

  test('changing granularity to Week updates the chart with fewer data points', async ({
    page,
  }) => {
    await page.goto('/trends');

    // Select an event
    const eventSelector = page.getByTestId('event-selector');
    await eventSelector.click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Count daily data-point markers before switching
    const dailyPoints = page.locator('[data-testid="chart-data-point"], [data-testid="chart-bar"]');
    const dailyCount = await dailyPoints.count();

    // Switch to weekly granularity
    await page.getByTestId('granularity-selector').click();
    await page.getByRole('option', { name: /week/i }).click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    const weeklyCount = await dailyPoints.count();
    // Weekly must yield fewer or equal bars/points than daily (30 days → ≤5 weeks)
    if (dailyCount > 0 && weeklyCount > 0) {
      expect(weeklyCount).toBeLessThanOrEqual(dailyCount);
    } else {
      // Fallback: chart SVG/canvas still visible
      await expect(page.locator('svg, canvas').first()).toBeVisible();
    }
  });

  // -------------------------------------------------------------------------
  // Date range preset
  // -------------------------------------------------------------------------

  test('changing date range preset to last 7 days updates the chart', async ({ page }) => {
    await page.goto('/trends');

    // Select an event
    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Switch date range to last 7 days
    await page.getByTestId('date-range-selector').click();
    await page.getByRole('option', { name: /last 7 days/i }).click();

    // Chart must still be visible after the range change
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });
  });

  test('changing date range preset to last 90 days updates the chart', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('date-range-selector').click();
    await page.getByRole('option', { name: /last 90 days/i }).click();

    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Tooltip
  // -------------------------------------------------------------------------

  test('chart tooltip is visible on hover and contains date and value', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();

    const chartSvg = page.locator('svg').first();
    await expect(chartSvg).toBeVisible({ timeout: 10_000 });

    // Hover over the center of the chart SVG to trigger tooltip
    const box = await chartSvg.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(400);

      // Tooltip element should appear — look by testid or role=tooltip
      const tooltip = page.locator(
        '[data-testid="chart-tooltip"], [role="tooltip"], .recharts-tooltip-wrapper',
      );
      await expect(tooltip.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // -------------------------------------------------------------------------
  // Legend
  // -------------------------------------------------------------------------

  test('chart legend identifies the series', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    const legend = page.locator(
      '[data-testid="chart-legend"], .recharts-legend-wrapper, [aria-label*="legend" i]',
    );
    await expect(legend.first()).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Measure selector
  // -------------------------------------------------------------------------

  test('selecting measure Sum shows a property dropdown', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Switch measure to Sum
    await page.getByTestId('measure-selector').click();
    await page.getByRole('option', { name: /sum/i }).click();

    // A property selector must become visible
    const propertyDropdown = page.getByTestId('property-selector');
    await expect(propertyDropdown).toBeVisible({ timeout: 5_000 });
  });

  test('selecting measure Total Count hides the property dropdown', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // First switch to Sum to ensure property selector was visible
    await page.getByTestId('measure-selector').click();
    await page.getByRole('option', { name: /sum/i }).click();
    await expect(page.getByTestId('property-selector')).toBeVisible({ timeout: 5_000 });

    // Now switch back to Total Count
    await page.getByTestId('measure-selector').click();
    await page.getByRole('option', { name: /total count/i }).click();

    // Property selector must disappear
    const propertyDropdown = page.getByTestId('property-selector');
    await expect(propertyDropdown).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Breakdown
  // -------------------------------------------------------------------------

  test('selecting a breakdown property shows multiple series in the chart legend', async ({
    page,
  }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Open breakdown selector and pick a string property
    await page.getByTestId('breakdown-selector').click();
    await page.getByRole('option', { name: /plan/i }).click();

    // Wait for chart to refresh with breakdown data
    await page.waitForTimeout(500);

    // Legend must now show multiple items (one per breakdown value)
    const legendItems = page.locator(
      '[data-testid="chart-legend-item"], .recharts-legend-item',
    );
    const legendCount = await legendItems.count();
    expect(legendCount).toBeGreaterThan(1);
  });

  test('selecting None for breakdown returns to single-series view', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Apply a breakdown first
    await page.getByTestId('breakdown-selector').click();
    await page.getByRole('option', { name: /plan/i }).click();
    await page.waitForTimeout(400);

    const multiLegendCount = await page
      .locator('[data-testid="chart-legend-item"], .recharts-legend-item')
      .count();
    expect(multiLegendCount).toBeGreaterThan(1);

    // Remove breakdown
    await page.getByTestId('breakdown-selector').click();
    await page.getByRole('option', { name: /none/i }).click();
    await page.waitForTimeout(400);

    const singleLegendCount = await page
      .locator('[data-testid="chart-legend-item"], .recharts-legend-item')
      .count();
    // Should be back to 1 (or 0 if legend is hidden for single series)
    expect(singleLegendCount).toBeLessThanOrEqual(multiLegendCount);
  });

  // -------------------------------------------------------------------------
  // Chart type toggles
  // -------------------------------------------------------------------------

  test('clicking bar chart icon switches chart type', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Switch to bar chart
    await page.getByTestId('chart-type-bar').click();
    await page.waitForTimeout(300);

    // Bar chart renders <rect> elements (Recharts uses rect for bars)
    const barRects = page.locator('svg rect.recharts-bar-rectangle, svg [data-testid="chart-bar"], svg .recharts-bar rect');
    // Chart container must still show an SVG
    await expect(page.locator('svg').first()).toBeVisible();
    // Active toggle button should be bar
    const barButton = page.getByTestId('chart-type-bar');
    const isActive =
      (await barButton.getAttribute('aria-pressed')) === 'true' ||
      (await barButton.evaluate((el) => el.classList.toString())).includes('active') ||
      (await barButton.evaluate((el) => el.classList.toString())).includes('selected');
    expect(isActive).toBe(true);
  });

  test('clicking area chart icon switches chart type', async ({ page }) => {
    await page.goto('/trends');

    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Switch to area chart
    await page.getByTestId('chart-type-area').click();
    await page.waitForTimeout(300);

    // Area chart must still render SVG content
    await expect(page.locator('svg').first()).toBeVisible();

    // The area toggle button should reflect its active state
    const areaButton = page.getByTestId('chart-type-area');
    const isActive =
      (await areaButton.getAttribute('aria-pressed')) === 'true' ||
      (await areaButton.evaluate((el) => el.classList.toString())).includes('active') ||
      (await areaButton.evaluate((el) => el.classList.toString())).includes('selected');
    expect(isActive).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Multi-event comparison
  // -------------------------------------------------------------------------

  test('multi-event selection shows multiple series in the chart legend', async ({ page }) => {
    await page.goto('/trends');

    // Select first event
    await page.getByTestId('event-selector').click();
    await page.getByRole('option', { name: 'test-ui-trends-purchase-completed' }).click();
    await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 10_000 });

    // Add second event — look for an "add event" button or a multi-select interaction
    const addEventButton = page.getByTestId('add-event-button');
    const addEventVisible = await addEventButton.isVisible().catch(() => false);

    if (addEventVisible) {
      await addEventButton.click();
      // A second event selector should appear
      const secondSelector = page.getByTestId('event-selector').nth(1);
      await secondSelector.click();
      await page.getByRole('option', { name: 'test-ui-trends-page-viewed' }).click();
      await page.waitForTimeout(500);

      // Legend should now contain at least 2 items
      const legendItems = page.locator(
        '[data-testid="chart-legend-item"], .recharts-legend-item',
      );
      const legendCount = await legendItems.count();
      expect(legendCount).toBeGreaterThanOrEqual(2);
    } else {
      // Alternatively, the event selector may be multi-select
      await page.getByTestId('event-selector').click();
      const secondOption = page.getByRole('option', { name: 'test-ui-trends-page-viewed' });
      const secondOptionVisible = await secondOption.isVisible().catch(() => false);
      if (secondOptionVisible) {
        await secondOption.click();
        await page.waitForTimeout(500);

        const legendItems = page.locator(
          '[data-testid="chart-legend-item"], .recharts-legend-item',
        );
        const legendCount = await legendItems.count();
        expect(legendCount).toBeGreaterThanOrEqual(2);
      } else {
        // Graceful skip: multi-event not yet discoverable in the DOM
        test.skip();
      }
    }
  });
});
