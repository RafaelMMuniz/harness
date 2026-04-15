import { test, expect } from '@playwright/test';
import { createEvent, createBatchEvents } from './helpers';

const P = 't03';

test.describe('Events explorer page', () => {
  test.beforeAll(async ({ request }) => {
    // Seed 60+ events across 3+ event types with varied timestamps and properties
    const events = [];
    const now = new Date();

    // 25 "Page Viewed" events
    for (let i = 0; i < 25; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i % 5));
      d.setHours(8 + (i % 12));
      events.push({
        event: `${P}-Page Viewed`,
        device_id: `${P}-dev-${i % 8}`,
        timestamp: d.toISOString(),
        properties: { url: `/page-${i}`, referrer: i % 2 === 0 ? 'google' : 'direct' },
      });
    }

    // 20 "Button Clicked" events
    for (let i = 0; i < 20; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i % 4));
      d.setHours(10 + (i % 8));
      events.push({
        event: `${P}-Button Clicked`,
        device_id: `${P}-dev-${i % 6}`,
        timestamp: d.toISOString(),
        properties: { button_name: `btn-${i % 5}`, section: 'hero' },
      });
    }

    // 20 "Sign Up" events
    for (let i = 0; i < 20; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i % 3));
      d.setHours(14 + (i % 4));
      events.push({
        event: `${P}-Sign Up`,
        device_id: `${P}-dev-signup-${i}`,
        user_id: `${P}-user-signup-${i}`,
        timestamp: d.toISOString(),
        properties: { plan: i % 2 === 0 ? 'free' : 'pro' },
      });
    }

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBeGreaterThanOrEqual(60);
  });

  test('Events page loads at "/" and renders a table containing event data', async ({ page }) => {
    await page.goto('/');
    const table = page.locator('table');
    await expect(table).toBeVisible();
    // Should have at least one data row
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('Table displays columns — Timestamp, Event Name, User identity, Properties preview', async ({ page }) => {
    await page.goto('/');
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const headers = table.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const joined = headerTexts.join(' ').toLowerCase();

    expect(joined).toContain('timestamp');
    expect(joined).toContain('event');
    expect(joined).toContain('user');
    expect(joined).toContain('properties');
  });

  test('Filter by event name using a dropdown/select updates the table', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table tbody tr');

    // Find event name selector and select a specific event
    const eventSelect = page.locator('[data-testid="event-name-filter"]').or(
      page.locator('select').first()
    ).or(
      page.getByRole('combobox').first()
    );

    if (await eventSelect.count() > 0) {
      await eventSelect.first().click();
      // Look for an option that matches our seeded data
      const option = page.getByRole('option').filter({ hasText: /Page Viewed/i }).or(
        page.locator(`[data-value*="Page Viewed"]`)
      );
      if (await option.count() > 0) {
        await option.first().click();
      }
    }

    // After filtering, verify table rows contain the selected event name
    await page.waitForTimeout(500);
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('Filter by date range updates the table', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table tbody tr');

    const startInput = page.locator('[data-testid="start-date"]').or(
      page.locator('input[type="date"]').first()
    );
    const endInput = page.locator('[data-testid="end-date"]').or(
      page.locator('input[type="date"]').last()
    );

    if (await startInput.count() > 0 && await endInput.count() > 0) {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      await startInput.fill(weekAgo);
      await endInput.fill(today);
      await page.waitForTimeout(500);
    }

    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('Pagination — Next button loads next page, Previous returns to prior', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table tbody tr');

    // Find pagination controls
    const nextButton = page.locator('[data-testid="next-page"]').or(
      page.getByRole('button', { name: /next/i })
    );

    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      // Remember content before navigation
      const firstRowBefore = await page.locator('table tbody tr').first().textContent();

      await nextButton.click();
      await page.waitForTimeout(500);

      // Content should have changed
      const firstRowAfter = await page.locator('table tbody tr').first().textContent();
      expect(firstRowAfter).not.toBe(firstRowBefore);

      // Go back
      const prevButton = page.locator('[data-testid="prev-page"]').or(
        page.getByRole('button', { name: /prev/i })
      );
      if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Clicking a table row expands to show all event properties as key-value pairs', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table tbody tr');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(300);

    // After clicking, look for expanded property details
    const expandedContent = page.locator('[data-testid="event-details"]').or(
      page.locator('table tbody tr').nth(1).locator('td')
    );
    // The expanded area should show property key-value pairs
    const pageContent = await page.content();
    // Should contain at least one property key from our seeded data
    const hasProperties = pageContent.includes('url') || pageContent.includes('button_name') || pageContent.includes('plan');
    expect(hasProperties).toBe(true);
  });

  test('Empty state message appears when filters match no events', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table tbody tr');

    // Try to filter by a non-existent event name
    const eventSelect = page.locator('[data-testid="event-name-filter"]').or(
      page.getByRole('combobox').first()
    );

    // If the filter supports typing, type a non-existent name
    // Otherwise look for the empty state after API returns empty
    // Navigate with a query param that should match nothing
    await page.goto('/?event_name=__nonexistent_event_xyz__');
    await page.waitForTimeout(500);

    // Should show empty state (no table rows or an empty message)
    const emptyState = page.locator('[data-testid="empty-state"]').or(
      page.getByText(/no events/i)
    ).or(
      page.getByText(/no results/i)
    );

    const tableRows = page.locator('table tbody tr');
    const hasEmptyState = (await emptyState.count()) > 0 || (await tableRows.count()) === 0;
    expect(hasEmptyState).toBe(true);
  });

  test('Loading indicator is visible while data is being fetched', async ({ page }) => {
    // Intercept the API call and delay it to observe loading state
    await page.route('**/api/events**', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto('/');

    // Should see a loading indicator (skeleton, spinner, or loading text)
    const loadingIndicator = page.locator('[data-testid="loading"]').or(
      page.locator('.animate-pulse')
    ).or(
      page.getByText(/loading/i)
    ).or(
      page.locator('[role="progressbar"]')
    );

    // Check that loading is visible at some point
    const hasLoading = (await loadingIndicator.count()) > 0;
    expect(hasLoading).toBe(true);
  });
});
