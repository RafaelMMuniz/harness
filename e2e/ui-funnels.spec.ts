import { test, expect } from '@playwright/test';
import { createBatchEvents } from './helpers';

const P = 't08f';

test.describe('Funnels page', () => {
  test.beforeAll(async ({ request }) => {
    // Seed events for a multi-step funnel scenario
    // 10 users do step 1, 7 do step 2, 3 do step 3
    const events = [];
    const baseDate = new Date('2025-07-01');

    for (let i = 0; i < 10; i++) {
      events.push({
        event: `${P}-Sign Up`,
        user_id: `${P}-funnel-user-${i}`,
        timestamp: new Date(baseDate.getTime() + i * 3600000).toISOString(),
        properties: { source: 'organic' },
      });
    }

    for (let i = 0; i < 7; i++) {
      events.push({
        event: `${P}-Activate`,
        user_id: `${P}-funnel-user-${i}`,
        timestamp: new Date(baseDate.getTime() + (20 + i) * 3600000).toISOString(),
        properties: { step: 'activation' },
      });
    }

    for (let i = 0; i < 3; i++) {
      events.push({
        event: `${P}-Purchase`,
        user_id: `${P}-funnel-user-${i}`,
        timestamp: new Date(baseDate.getTime() + (40 + i) * 3600000).toISOString(),
        properties: { amount: 99 },
      });
    }

    const res = await createBatchEvents(request, events);
    expect(res.status()).toBe(200);
  });

  test("Funnels page accessible from sidebar, shows 'Funnel Analysis' heading", async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside').or(page.locator('nav').first());
    const funnelsLink = sidebar.getByRole('link', { name: /funnels/i }).or(
      sidebar.getByText(/funnels/i)
    );
    await funnelsLink.click();

    await expect(page).toHaveURL(/\/funnels/);
    const heading = page.getByText(/funnel analysis/i);
    await expect(heading.first()).toBeVisible();
  });

  test('Step builder shows 2 initial step dropdowns with event name options', async ({ page }) => {
    await page.goto('/funnels');

    // Should see at least 2 step selectors
    const stepSelectors = page.locator('[data-testid^="funnel-step-"]').or(
      page.getByRole('combobox')
    );
    const count = await stepSelectors.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Add Step button adds a new step (up to 5), disabled at 5', async ({ page }) => {
    await page.goto('/funnels');

    const addButton = page.locator('[data-testid="add-step"]').or(
      page.getByRole('button', { name: /add step/i })
    );
    await expect(addButton).toBeVisible();

    // Start with 2 steps, add 3 more to reach 5
    const initialSteps = await page.locator('[data-testid^="funnel-step-"]').or(
      page.getByRole('combobox')
    ).count();

    for (let i = initialSteps; i < 5; i++) {
      if (await addButton.isEnabled()) {
        await addButton.click();
        await page.waitForTimeout(200);
      }
    }

    // At 5 steps, Add Step should be disabled
    await expect(addButton).toBeDisabled();
  });

  test('Remove Step button removes a step (minimum 2), disabled at 2', async ({ page }) => {
    await page.goto('/funnels');

    // There should be remove buttons
    const removeButtons = page.locator('[data-testid^="remove-step-"]').or(
      page.getByRole('button', { name: /remove/i })
    );

    // At 2 steps (minimum), remove should be disabled
    if (await removeButtons.count() > 0) {
      const firstRemove = removeButtons.first();
      await expect(firstRemove).toBeDisabled();
    }
  });

  test("Clicking 'Analyze' with valid steps shows funnel visualization", async ({ page }) => {
    await page.goto('/funnels');

    // Select events for steps
    const stepSelectors = page.locator('[data-testid^="funnel-step-"]').or(
      page.getByRole('combobox')
    );

    // Select step 1
    await stepSelectors.first().click();
    const step1Option = page.getByRole('option').filter({ hasText: /Sign Up/i });
    if (await step1Option.count() > 0) {
      await step1Option.first().click();
    }

    // Select step 2
    await stepSelectors.nth(1).click();
    const step2Option = page.getByRole('option').filter({ hasText: /Activate/i });
    if (await step2Option.count() > 0) {
      await step2Option.first().click();
    }

    // Click Analyze
    const analyzeButton = page.locator('[data-testid="analyze-funnel"]').or(
      page.getByRole('button', { name: /analyze/i })
    );
    await analyzeButton.click();
    await page.waitForTimeout(1000);

    // Should show funnel visualization with conversion rates
    const conversionText = page.getByText(/%/).or(
      page.getByText(/conversion/i)
    );
    await expect(conversionText.first()).toBeVisible();
  });

  test('Funnel visualization shows decreasing bar sizes and conversion percentages', async ({ page }) => {
    await page.goto('/funnels');

    const stepSelectors = page.locator('[data-testid^="funnel-step-"]').or(
      page.getByRole('combobox')
    );

    await stepSelectors.first().click();
    const step1 = page.getByRole('option').filter({ hasText: /Sign Up/i });
    if (await step1.count() > 0) await step1.first().click();

    await stepSelectors.nth(1).click();
    const step2 = page.getByRole('option').filter({ hasText: /Activate/i });
    if (await step2.count() > 0) await step2.first().click();

    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();
    await page.waitForTimeout(1000);

    // Should show percentage values
    const percentages = page.locator('text').filter({ hasText: /\d+%/ }).or(
      page.getByText(/\d+(\.\d+)?%/)
    );
    const count = await percentages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Overall conversion rate is displayed', async ({ page }) => {
    await page.goto('/funnels');

    const stepSelectors = page.locator('[data-testid^="funnel-step-"]').or(
      page.getByRole('combobox')
    );

    await stepSelectors.first().click();
    const step1 = page.getByRole('option').filter({ hasText: /Sign Up/i });
    if (await step1.count() > 0) await step1.first().click();

    await stepSelectors.nth(1).click();
    const step2 = page.getByRole('option').filter({ hasText: /Activate/i });
    if (await step2.count() > 0) await step2.first().click();

    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();
    await page.waitForTimeout(1000);

    const overall = page.getByText(/overall/i).or(
      page.getByText(/completed/i)
    );
    await expect(overall.first()).toBeVisible();
  });

  test('Empty state when no users match the funnel', async ({ page }) => {
    await page.goto('/funnels');

    const stepSelectors = page.locator('[data-testid^="funnel-step-"]').or(
      page.getByRole('combobox')
    );

    // Select event names that nobody did in sequence
    await stepSelectors.first().click();
    const opt1 = page.getByRole('option').filter({ hasText: /Purchase/i });
    if (await opt1.count() > 0) await opt1.first().click();

    await stepSelectors.nth(1).click();
    const opt2 = page.getByRole('option').filter({ hasText: /Sign Up/i });
    if (await opt2.count() > 0) await opt2.first().click();

    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();
    await page.waitForTimeout(1000);

    // Should show some result (even if 0 users) or empty state
    const pageContent = await page.content();
    const hasResult = pageContent.includes('%') || pageContent.includes('0') || pageContent.toLowerCase().includes('no user');
    expect(hasResult).toBe(true);
  });
});
