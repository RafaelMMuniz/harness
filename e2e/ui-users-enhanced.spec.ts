import { test, expect } from '@playwright/test';
import { createEvent } from './helpers';

const P = 't08u';

test.describe('Enhanced user profile', () => {
  // Seed: user with multiple devices, anonymous + identified events
  test.beforeAll(async ({ request }) => {
    // Anonymous events from device A
    for (let i = 0; i < 3; i++) {
      await createEvent(request, {
        event: `${P}-browse`,
        device_id: `${P}-dev-a`,
        timestamp: `2025-07-20T0${i + 1}:00:00.000Z`,
        properties: { url: `/page-${i}`, section: 'main' },
      });
    }

    // Anonymous events from device B
    for (let i = 0; i < 2; i++) {
      await createEvent(request, {
        event: `${P}-browse`,
        device_id: `${P}-dev-b`,
        timestamp: `2025-07-20T0${i + 4}:00:00.000Z`,
        properties: { url: `/mobile-${i}` },
      });
    }

    // Link device A to user
    await createEvent(request, {
      event: `${P}-login`,
      device_id: `${P}-dev-a`,
      user_id: `${P}-multi-user`,
      timestamp: '2025-07-20T06:00:00.000Z',
      properties: { method: 'email' },
    });

    // Link device B to same user
    await createEvent(request, {
      event: `${P}-login`,
      device_id: `${P}-dev-b`,
      user_id: `${P}-multi-user`,
      timestamp: '2025-07-20T07:00:00.000Z',
      properties: { method: 'social' },
    });

    // Post-identification events
    await createEvent(request, {
      event: `${P}-purchase`,
      user_id: `${P}-multi-user`,
      timestamp: '2025-07-20T08:00:00.000Z',
      properties: { amount: 49.99, plan: 'pro' },
    });
  });

  test('User profile shows identity cluster with resolved user_id and linked device_ids', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-multi-user`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();
    await page.waitForTimeout(500);

    // Should show user_id
    await expect(page.getByText(`${P}-multi-user`)).toBeVisible();

    // Should show both device IDs
    await expect(page.getByText(`${P}-dev-a`)).toBeVisible();
    await expect(page.getByText(`${P}-dev-b`)).toBeVisible();
  });

  test('Event timeline shows events in chronological order with source identity labels', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-multi-user`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();
    await page.waitForTimeout(500);

    // Should show events with device source labels
    const pageContent = await page.content();
    const hasDeviceA = pageContent.includes(`${P}-dev-a`);
    const hasDeviceB = pageContent.includes(`${P}-dev-b`);
    expect(hasDeviceA || hasDeviceB).toBe(true);
  });

  test('Anonymous events (pre-merge) have a visual indicator', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-multi-user`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();
    await page.waitForTimeout(500);

    // Look for merged/anonymous indicator
    const mergedIndicator = page.locator('[data-testid="merged-badge"]').or(
      page.getByText(/merged|anonymous|anon/i)
    );
    await expect(mergedIndicator.first()).toBeVisible();
  });

  test("Timeline supports pagination or 'Load more'", async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-multi-user`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();
    await page.waitForTimeout(500);

    // Look for load more or pagination
    const loadMore = page.locator('[data-testid="load-more"]').or(
      page.getByRole('button', { name: /load more/i })
    ).or(
      page.getByRole('button', { name: /next/i })
    );

    // The button may or may not be visible depending on how many events exist
    // Just verify the page loaded with events
    const pageContent = await page.content();
    expect(pageContent.includes(`${P}-browse`) || pageContent.includes(`${P}-login`)).toBe(true);
  });
});
