import { test, expect } from '@playwright/test';

test.describe('App shell navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sidebar displays MiniPanel title text', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).toContainText('MiniPanel');
  });

  test('sidebar has navigation links for Events, Users, Funnels, Settings', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar.getByRole('link', { name: 'Events' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Funnels' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('clicking Events nav link navigates to /', async ({ page }) => {
    await page.getByTestId('sidebar').getByRole('link', { name: 'Events' }).click();
    await expect(page).toHaveURL('/');
  });

  test('clicking Users nav link navigates to /users', async ({ page }) => {
    await page.getByTestId('sidebar').getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/users');
  });

  test('clicking Funnels nav link navigates to /funnels', async ({ page }) => {
    await page.getByTestId('sidebar').getByRole('link', { name: 'Funnels' }).click();
    await expect(page).toHaveURL('/funnels');
  });

  test('clicking Settings nav link navigates to /settings', async ({ page }) => {
    await page.getByTestId('sidebar').getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
  });

  test('active navigation item has visually distinct styling', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    // Navigate to Events (/) and verify Events link is active
    await sidebar.getByRole('link', { name: 'Events' }).click();
    await expect(page).toHaveURL('/');
    const eventsLink = sidebar.getByRole('link', { name: 'Events' });
    const isEventsActive =
      (await eventsLink.getAttribute('aria-current')) === 'page' ||
      (await eventsLink.evaluate((el) => el.classList.toString())).includes('active');
    expect(isEventsActive).toBe(true);

    // Navigate to Users and verify Users link becomes active
    await sidebar.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/users');
    const usersLink = sidebar.getByRole('link', { name: 'Users' });
    const isUsersActive =
      (await usersLink.getAttribute('aria-current')) === 'page' ||
      (await usersLink.evaluate((el) => el.classList.toString())).includes('active');
    expect(isUsersActive).toBe(true);

    // Events link should no longer be active
    const isEventsStillActive =
      (await eventsLink.getAttribute('aria-current')) === 'page' ||
      (await eventsLink.evaluate((el) => el.classList.toString())).includes('active');
    expect(isEventsStillActive).toBe(false);
  });

  test('Funnels route displays placeholder content', async ({ page }) => {
    await page.goto('/funnels');
    // The page should render something — not blank, not a raw error
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    // Should contain some meaningful text indicating the funnels section
    await expect(page.locator('body')).toContainText(/funnel/i);
  });

  test('Settings route displays placeholder content', async ({ page }) => {
    await page.goto('/settings');
    // The page should render something — not blank, not a raw error
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    // Should contain some meaningful text indicating the settings section
    await expect(page.locator('body')).toContainText(/setting/i);
  });
});
