import { test, expect } from '@playwright/test';

test.describe('App shell navigation', () => {
  test("Sidebar displays 'MiniPanel' title text", async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside').or(page.locator('nav'));
    const title = sidebar.getByText('MiniPanel');
    await expect(title).toBeVisible();
  });

  test('Sidebar has navigation links for Events, Users, Funnels, Settings', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside').or(page.locator('nav').first());

    const events = sidebar.getByRole('link', { name: /events/i }).or(sidebar.getByText(/events/i));
    const users = sidebar.getByRole('link', { name: /users/i }).or(sidebar.getByText(/users/i));
    const funnels = sidebar.getByRole('link', { name: /funnels/i }).or(sidebar.getByText(/funnels/i));
    const settings = sidebar.getByRole('link', { name: /settings/i }).or(sidebar.getByText(/settings/i));

    await expect(events).toBeVisible();
    await expect(users).toBeVisible();
    await expect(funnels).toBeVisible();
    await expect(settings).toBeVisible();
  });

  test('Clicking each nav link navigates to the correct route', async ({ page }) => {
    await page.goto('/');

    // Navigate to Users
    const sidebar = page.locator('aside').or(page.locator('nav').first());

    const usersLink = sidebar.getByRole('link', { name: /users/i }).or(sidebar.getByText(/users/i));
    await usersLink.click();
    await expect(page).toHaveURL(/\/users/);

    // Navigate to Funnels
    const funnelsLink = sidebar.getByRole('link', { name: /funnels/i }).or(sidebar.getByText(/funnels/i));
    await funnelsLink.click();
    await expect(page).toHaveURL(/\/funnels/);

    // Navigate to Settings
    const settingsLink = sidebar.getByRole('link', { name: /settings/i }).or(sidebar.getByText(/settings/i));
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);

    // Navigate back to Events
    const eventsLink = sidebar.getByRole('link', { name: /events/i }).or(sidebar.getByText(/events/i));
    await eventsLink.click();
    await expect(page).toHaveURL('/');
  });

  test('Active navigation item has visually distinct styling', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside').or(page.locator('nav').first());
    const eventsLink = sidebar.getByRole('link', { name: /events/i }).or(
      sidebar.locator('a').filter({ hasText: /events/i })
    );

    // Check for active styling - could be an active class, aria-current, or data attribute
    const classes = await eventsLink.getAttribute('class') ?? '';
    const ariaCurrent = await eventsLink.getAttribute('aria-current') ?? '';
    const hasActiveStyle = classes.includes('active') ||
      classes.includes('bg-neutral-700') ||
      ariaCurrent === 'page' ||
      ariaCurrent === 'true';

    expect(hasActiveStyle).toBe(true);
  });

  test('Funnels and Settings routes display placeholder content', async ({ page }) => {
    // Funnels page
    await page.goto('/funnels');
    const funnelsContent = page.getByText(/funnel/i);
    await expect(funnelsContent.first()).toBeVisible();

    // Settings page
    await page.goto('/settings');
    const settingsContent = page.getByText(/settings/i);
    await expect(settingsContent.first()).toBeVisible();
  });
});
