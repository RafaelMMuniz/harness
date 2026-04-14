import { test, expect } from '@playwright/test';
import { createBatchEvents, type EventPayload } from './helpers';

const BASE_URL = 'http://localhost:5173';

// Unique prefixes to avoid collisions with other test runs
const DEVICE_PREFIX = 'test-ui-funnels-device-';
const USER_PREFIX = 'test-ui-funnels-user-';

// Event names used in funnel steps
const STEP1_EVENT = 'test-ui-funnels-Page Viewed';
const STEP2_EVENT = 'test-ui-funnels-Signup Clicked';
const STEP3_EVENT = 'test-ui-funnels-Purchase Completed';

// A different event type used in the empty-state scenario
const NO_MATCH_EVENT = 'test-ui-funnels-__nomatch__event__xyz__';

function isoAt(daysAgo: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Seed a 3-step funnel scenario:
 *   - 10 users complete step 1 (Page Viewed)
 *   -  7 users continue to step 2 (Signup Clicked)
 *   -  3 users continue to step 3 (Purchase Completed)
 *
 * Users are labelled u0–u9 and each gets a matching device.
 * Events are ordered chronologically within each user's session
 * so timestamp ordering is respected.
 */
function buildFunnelSeedEvents(): EventPayload[] {
  const events: EventPayload[] = [];

  for (let i = 0; i < 10; i++) {
    const userId = `${USER_PREFIX}u${i}`;
    const deviceId = `${DEVICE_PREFIX}d${i}`;

    // Step 1 — all 10 users
    events.push({
      event: STEP1_EVENT,
      device_id: deviceId,
      user_id: userId,
      timestamp: isoAt(5, 10, i),
      properties: { page: '/home', plan: 'free' },
    });

    // Step 2 — first 7 users
    if (i < 7) {
      events.push({
        event: STEP2_EVENT,
        device_id: deviceId,
        user_id: userId,
        timestamp: isoAt(5, 11, i),
        properties: { button_label: 'Sign Up' },
      });
    }

    // Step 3 — first 3 users
    if (i < 3) {
      events.push({
        event: STEP3_EVENT,
        device_id: deviceId,
        user_id: userId,
        timestamp: isoAt(5, 12, i),
        properties: { amount: 99, currency: 'USD' },
      });
    }
  }

  return events;
}

test.describe('Funnel Analysis UI', () => {
  test.beforeAll(async ({ request }) => {
    const events = buildFunnelSeedEvents();
    const response = await createBatchEvents(request, events);
    if (!response.ok()) {
      throw new Error(`Funnel seed failed: ${response.status()} ${await response.text()}`);
    }
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  test('Funnels page is accessible from the sidebar and shows "Funnel Analysis" heading', async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const funnelsLink = sidebar.getByRole('link', { name: 'Funnels' });
    await expect(funnelsLink).toBeVisible();
    await funnelsLink.click();

    await expect(page).toHaveURL(/\/funnels/);

    // Page must render a heading containing "Funnel Analysis"
    const heading = page.getByRole('heading', { name: /funnel analysis/i });
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  // ---------------------------------------------------------------------------
  // Step builder — initial state
  // ---------------------------------------------------------------------------

  test('step builder renders 2 initial step dropdowns populated with event name options', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/funnels`);

    // Wait for the step builder to be present
    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    // Exactly 2 step selectors should exist by default
    const stepSelects = stepBuilder.getByTestId('funnel-step-select');
    await expect(stepSelects).toHaveCount(2);

    // Each dropdown must have at least one non-placeholder option (event names)
    for (let i = 0; i < 2; i++) {
      const select = stepSelects.nth(i);
      await expect(select).toBeVisible();
      // The select must have at least one option beyond a blank/placeholder
      const optionCount = await select.locator('option').count();
      expect(optionCount).toBeGreaterThanOrEqual(2);
    }
  });

  // ---------------------------------------------------------------------------
  // Step builder — adding steps
  // ---------------------------------------------------------------------------

  test('Add Step button adds a new step row up to the maximum of 5', async ({ page }) => {
    await page.goto(`${BASE_URL}/funnels`);

    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    const addStepBtn = page.getByTestId('funnel-add-step');
    await expect(addStepBtn).toBeVisible();

    // Start at 2 steps; click three times to reach 5
    await addStepBtn.click();
    await expect(stepBuilder.getByTestId('funnel-step-select')).toHaveCount(3);

    await addStepBtn.click();
    await expect(stepBuilder.getByTestId('funnel-step-select')).toHaveCount(4);

    await addStepBtn.click();
    await expect(stepBuilder.getByTestId('funnel-step-select')).toHaveCount(5);

    // At 5 steps the Add Step button must be disabled
    await expect(addStepBtn).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // Step builder — removing steps
  // ---------------------------------------------------------------------------

  test('Remove Step button removes a step row and is disabled when only 2 steps remain', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/funnels`);

    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    // Add an extra step so we start at 3 and can remove down to 2
    const addStepBtn = page.getByTestId('funnel-add-step');
    await addStepBtn.click();
    await expect(stepBuilder.getByTestId('funnel-step-select')).toHaveCount(3);

    // Remove one step — the last remove button in the list
    const removeButtons = stepBuilder.getByTestId('funnel-remove-step');
    await removeButtons.last().click();
    await expect(stepBuilder.getByTestId('funnel-step-select')).toHaveCount(2);

    // At the minimum of 2, all remove buttons should be disabled
    const remainingRemoveBtns = stepBuilder.getByTestId('funnel-remove-step');
    const count = await remainingRemoveBtns.count();
    for (let i = 0; i < count; i++) {
      await expect(remainingRemoveBtns.nth(i)).toBeDisabled();
    }
  });

  // ---------------------------------------------------------------------------
  // Analyze — results
  // ---------------------------------------------------------------------------

  test('clicking Analyze with valid steps shows the funnel visualization', async ({ page }) => {
    await page.goto(`${BASE_URL}/funnels`);

    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    // Select step 1
    const stepSelects = stepBuilder.getByTestId('funnel-step-select');
    await stepSelects.nth(0).selectOption(STEP1_EVENT);

    // Select step 2
    await stepSelects.nth(1).selectOption(STEP2_EVENT);

    // Run the analysis
    const analyzeBtn = page.getByTestId('funnel-analyze-btn');
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();

    // Funnel visualization container must appear
    const visualization = page.getByTestId('funnel-visualization');
    await expect(visualization).toBeVisible({ timeout: 10_000 });

    // Each funnel step bar must be present
    const bars = visualization.getByTestId('funnel-bar');
    await expect(bars.first()).toBeVisible({ timeout: 5_000 });
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThanOrEqual(2);
  });

  test('funnel visualization shows decreasing bar sizes and conversion percentages', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/funnels`);

    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    const stepSelects = stepBuilder.getByTestId('funnel-step-select');
    await stepSelects.nth(0).selectOption(STEP1_EVENT);
    await stepSelects.nth(1).selectOption(STEP2_EVENT);

    // Add a third step
    await page.getByTestId('funnel-add-step').click();
    const updatedSelects = stepBuilder.getByTestId('funnel-step-select');
    await updatedSelects.nth(2).selectOption(STEP3_EVENT);

    await page.getByTestId('funnel-analyze-btn').click();

    const visualization = page.getByTestId('funnel-visualization');
    await expect(visualization).toBeVisible({ timeout: 10_000 });

    // Conversion-rate labels should each contain a "%" character
    const conversionLabels = visualization.getByTestId('funnel-conversion-rate');
    await expect(conversionLabels.first()).toBeVisible({ timeout: 5_000 });
    const labelCount = await conversionLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < labelCount; i++) {
      const text = await conversionLabels.nth(i).textContent();
      expect(text).toMatch(/%/);
    }

    // Bar heights / widths must strictly decrease from step to step.
    // We read the inline style or a data attribute set by the implementation.
    const bars = visualization.getByTestId('funnel-bar');
    const barCount = await bars.count();
    expect(barCount).toBe(3);

    // Collect the numeric "fill" percentage of each bar (via data-value attribute or aria-valuenow)
    const values: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const bar = bars.nth(i);
      // Try data-value first, fall back to aria-valuenow, then parse from text
      const dataValue = await bar.getAttribute('data-value');
      const ariaValue = await bar.getAttribute('aria-valuenow');
      const raw = dataValue ?? ariaValue ?? '0';
      values.push(parseFloat(raw));
    }

    // The first bar is always 100 %; each subsequent bar must be ≤ the previous
    expect(values[0]).toBeGreaterThan(0);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });

  test('overall conversion rate is displayed in the results', async ({ page }) => {
    await page.goto(`${BASE_URL}/funnels`);

    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    const stepSelects = stepBuilder.getByTestId('funnel-step-select');
    await stepSelects.nth(0).selectOption(STEP1_EVENT);
    await stepSelects.nth(1).selectOption(STEP2_EVENT);

    await page.getByTestId('funnel-analyze-btn').click();

    const visualization = page.getByTestId('funnel-visualization');
    await expect(visualization).toBeVisible({ timeout: 10_000 });

    // There must be a dedicated element showing the overall conversion rate
    const overallRate = page.getByTestId('funnel-overall-conversion');
    await expect(overallRate).toBeVisible({ timeout: 5_000 });

    const text = await overallRate.textContent();
    expect(text).toMatch(/%/);
  });

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  test('empty state is shown when no users match the selected funnel steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/funnels`);

    const stepBuilder = page.getByTestId('funnel-step-builder');
    await expect(stepBuilder).toBeVisible({ timeout: 10_000 });

    // Use a step combination that was never seeded
    const stepSelects = stepBuilder.getByTestId('funnel-step-select');
    await stepSelects.nth(0).selectOption(NO_MATCH_EVENT);
    await stepSelects.nth(1).selectOption(STEP3_EVENT);

    await page.getByTestId('funnel-analyze-btn').click();

    // The empty state element must appear
    const emptyState = page.getByTestId('funnel-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10_000 });

    // No bar elements should be rendered
    const bars = page.getByTestId('funnel-bar');
    expect(await bars.count()).toBe(0);
  });
});
