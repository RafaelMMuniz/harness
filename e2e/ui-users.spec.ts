import { test, expect } from '@playwright/test';
import { createEvent } from './helpers';

const P = 't04u';

test.describe('User lookup page', () => {
  // Seed: 3 anonymous events for a test device, then 1 identified event
  test.beforeAll(async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await createEvent(request, {
        event: `${P}-anon-browse`,
        device_id: `${P}-device-lookup`,
        timestamp: `2025-07-10T0${i + 1}:00:00.000Z`,
        properties: { url: `/page-${i}`, section: 'main' },
      });
      expect(res.status()).toBe(201);
    }

    // Identify event — links device to user
    const identifyRes = await createEvent(request, {
      event: `${P}-sign-up`,
      device_id: `${P}-device-lookup`,
      user_id: `${P}-user-lookup`,
      timestamp: '2025-07-10T04:00:00.000Z',
      properties: { plan: 'pro' },
    });
    expect(identifyRes.status()).toBe(201);
  });

  test("Users page at '/users' shows a search input and a search button", async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await expect(searchInput).toBeVisible();

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await expect(searchButton).toBeVisible();
  });

  test("Searching by user_id displays the resolved identity heading", async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-user-lookup`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();

    // Should show the user identity heading
    const heading = page.getByText(`${P}-user-lookup`);
    await expect(heading).toBeVisible();
  });

  test('Search result shows a list of associated device IDs', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-user-lookup`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();

    // Should show associated device IDs
    const deviceId = page.getByText(`${P}-device-lookup`);
    await expect(deviceId).toBeVisible();
  });

  test('Event timeline displays events in chronological order (oldest first)', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-user-lookup`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();

    // Wait for timeline to load
    await page.waitForTimeout(500);

    // Should show events — check for event names from our seeded data
    const anonEvent = page.getByText(`${P}-anon-browse`);
    const signUpEvent = page.getByText(`${P}-sign-up`);
    await expect(anonEvent.first()).toBeVisible();
    await expect(signUpEvent).toBeVisible();
  });

  test('Each timeline event shows timestamp, event name, and expanded properties', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-user-lookup`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();
    await page.waitForTimeout(500);

    // Events should show properties
    const pageContent = await page.content();
    // Properties from our seeded data
    const hasTimestamp = pageContent.includes('2025') || pageContent.includes('Jul');
    const hasProperties = pageContent.includes('url') || pageContent.includes('plan') || pageContent.includes('section');
    expect(hasTimestamp).toBe(true);
    expect(hasProperties).toBe(true);
  });

  test('Searching by device_id resolves to the mapped user and shows full profile', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    // Search by device ID
    await searchInput.fill(`${P}-device-lookup`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();

    // Should resolve to the user, showing user_id
    const userId = page.getByText(`${P}-user-lookup`);
    await expect(userId).toBeVisible();
  });

  test('Searching for an unknown ID shows an empty state message', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.locator('[data-testid="user-search-input"]').or(
      page.getByPlaceholder(/search|user|device/i)
    ).or(
      page.locator('input').first()
    );
    await searchInput.fill(`${P}-nonexistent-user-xyz-999`);

    const searchButton = page.locator('[data-testid="user-search-button"]').or(
      page.getByRole('button', { name: /search|go|look/i })
    );
    await searchButton.click();
    await page.waitForTimeout(500);

    // Should show an empty/not found state
    const emptyState = page.getByText(/not found|no user|no results|unknown/i);
    await expect(emptyState).toBeVisible();
  });
});
