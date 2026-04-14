import { test, expect } from '@playwright/test';
import { createEvent } from './helpers';

const DEVICE_ID = 'test-ui-users-device-1';
const USER_ID = 'test-ui-users-user-1';
const UNKNOWN_ID = 'test-ui-users-unknown-999';

test.describe('User lookup page', () => {
  test.beforeAll(async ({ request }) => {
    // Seed 3 anonymous events for the test device
    await createEvent(request, {
      event: 'page_viewed',
      device_id: DEVICE_ID,
      timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
      properties: { url: '/home', referrer: 'google.com' },
    });
    await createEvent(request, {
      event: 'button_clicked',
      device_id: DEVICE_ID,
      timestamp: new Date('2024-01-15T10:05:00Z').toISOString(),
      properties: { button_name: 'signup', section: 'hero' },
    });
    await createEvent(request, {
      event: 'form_submitted',
      device_id: DEVICE_ID,
      timestamp: new Date('2024-01-15T10:10:00Z').toISOString(),
      properties: { form_id: 'signup_form', step: 1 },
    });

    // Seed the identity-linking event (device_id + user_id = creates mapping)
    await createEvent(request, {
      event: 'signup_completed',
      device_id: DEVICE_ID,
      user_id: USER_ID,
      timestamp: new Date('2024-01-15T10:15:00Z').toISOString(),
      properties: { plan: 'free' },
    });
  });

  test('Users page at /users shows a search input and a search button', async ({ page }) => {
    await page.goto('/users');

    const searchInput = page.getByTestId('user-search-input');
    const searchButton = page.getByTestId('user-search-button');

    await expect(searchInput).toBeVisible();
    await expect(searchButton).toBeVisible();
  });

  test('searching by user_id displays the resolved identity heading', async ({ page }) => {
    await page.goto('/users');

    await page.getByTestId('user-search-input').fill(USER_ID);
    await page.getByTestId('user-search-button').click();

    await expect(page.getByTestId('user-profile-heading')).toContainText(`User: ${USER_ID}`);
  });

  test('search result shows a list of associated device IDs', async ({ page }) => {
    await page.goto('/users');

    await page.getByTestId('user-search-input').fill(USER_ID);
    await page.getByTestId('user-search-button').click();

    const deviceList = page.getByTestId('user-device-list');
    await expect(deviceList).toBeVisible();
    await expect(deviceList).toContainText(DEVICE_ID);
  });

  test('event timeline displays events in chronological order (oldest first)', async ({ page }) => {
    await page.goto('/users');

    await page.getByTestId('user-search-input').fill(USER_ID);
    await page.getByTestId('user-search-button').click();

    const timeline = page.getByTestId('user-event-timeline');
    await expect(timeline).toBeVisible();

    const timelineItems = timeline.getByTestId('timeline-event');
    await expect(timelineItems).toHaveCount(4); // 3 anonymous + 1 identifying

    // Extract timestamps from timeline items to verify ascending order
    const timestamps = await timelineItems.evaluateAll((items) =>
      items.map((item) => {
        const tsEl = item.querySelector('[data-testid="event-timestamp"]');
        return tsEl?.textContent?.trim() ?? '';
      }),
    );

    // Verify the sequence is chronological (sorted ascending)
    const sorted = [...timestamps].sort();
    expect(timestamps).toEqual(sorted);
  });

  test('each timeline event shows timestamp, event name, and expanded properties', async ({
    page,
  }) => {
    await page.goto('/users');

    await page.getByTestId('user-search-input').fill(USER_ID);
    await page.getByTestId('user-search-button').click();

    const timeline = page.getByTestId('user-event-timeline');
    await expect(timeline).toBeVisible();

    const firstEvent = timeline.getByTestId('timeline-event').first();

    // Each event row must show timestamp
    await expect(firstEvent.getByTestId('event-timestamp')).toBeVisible();
    // Each event row must show event name
    await expect(firstEvent.getByTestId('event-name')).toBeVisible();
    // Each event row must show properties (expanded key-value pairs)
    await expect(firstEvent.getByTestId('event-properties')).toBeVisible();
  });

  test('searching by device_id resolves to the mapped user and shows the full profile', async ({
    page,
  }) => {
    await page.goto('/users');

    // Search by device_id instead of user_id
    await page.getByTestId('user-search-input').fill(DEVICE_ID);
    await page.getByTestId('user-search-button').click();

    // Should resolve to the same user (retroactive merge)
    await expect(page.getByTestId('user-profile-heading')).toContainText(`User: ${USER_ID}`);

    // Profile must include the device in its cluster
    const deviceList = page.getByTestId('user-device-list');
    await expect(deviceList).toContainText(DEVICE_ID);

    // All 4 events (including anonymous ones) must appear in the timeline
    const timelineItems = page.getByTestId('user-event-timeline').getByTestId('timeline-event');
    await expect(timelineItems).toHaveCount(4);
  });

  test('searching for an unknown ID shows an empty state message', async ({ page }) => {
    await page.goto('/users');

    await page.getByTestId('user-search-input').fill(UNKNOWN_ID);
    await page.getByTestId('user-search-button').click();

    await expect(page.getByTestId('user-empty-state')).toBeVisible();
  });
});
