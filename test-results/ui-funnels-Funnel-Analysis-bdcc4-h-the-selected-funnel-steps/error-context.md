# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-funnels.spec.ts >> Funnel Analysis UI >> empty state is shown when no users match the selected funnel steps
- Location: e2e/ui-funnels.spec.ts:310:7

# Error details

```
TimeoutError: locator.selectOption: Timeout 5000ms exceeded.
Call log:
  - waiting for getByTestId('funnel-step-builder').getByTestId('funnel-step-select').first()
    - locator resolved to <select data-testid="funnel-step-select" class="flex h-9 flex-1 min-w-0 items-center rounded border bg-white px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-neutral-300 text-neutral-900">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    10 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]: MiniPanel
    - navigation [ref=e5]:
      - link "Events" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e7]
        - generic [ref=e9]: Events
      - link "Trends" [ref=e10] [cursor=pointer]:
        - /url: /trends
        - img [ref=e11]
        - generic [ref=e14]: Trends
      - link "Funnels" [ref=e15] [cursor=pointer]:
        - /url: /funnels
        - img [ref=e16]
        - generic [ref=e18]: Funnels
      - link "Users" [ref=e19] [cursor=pointer]:
        - /url: /users
        - img [ref=e20]
        - generic [ref=e25]: Users
      - link "Settings" [ref=e26] [cursor=pointer]:
        - /url: /settings
        - img [ref=e27]
        - generic [ref=e30]: Settings
  - main [ref=e31]:
    - heading "Funnel Analysis" [level=1] [ref=e32]
    - generic [ref=e35]:
      - generic [ref=e36]:
        - button "7d" [ref=e37] [cursor=pointer]
        - button "30d" [ref=e38] [cursor=pointer]
        - button "90d" [ref=e39] [cursor=pointer]
        - button "Custom" [ref=e40] [cursor=pointer]
      - generic [ref=e41]:
        - button "Save" [disabled]:
          - img
          - text: Save
        - button "Saved" [ref=e43] [cursor=pointer]:
          - img [ref=e44]
          - text: Saved
        - button "Analyze" [disabled]
    - generic [ref=e48]:
      - generic [ref=e49]:
        - paragraph [ref=e50]: Steps
        - generic [ref=e51]:
          - generic [ref=e52]:
            - generic [ref=e53]: Step 1
            - combobox [ref=e54]:
              - option "Select event" [selected]
              - option "api-events-all-fields"
              - option "api-events-batch-event-a"
              - option "api-events-batch-event-b"
              - option "api-events-batch-event-c"
              - option "api-events-batch-mix-valid-1"
              - option "api-events-batch-mix-valid-2"
              - option "api-events-minimal-device"
              - option "api-events-minimal-user"
              - option "api-events-no-timestamp"
              - option "api-events-properties-roundtrip"
              - option "api-queries-button-click"
              - option "api-queries-count-check"
              - option "api-queries-page-view"
              - option "api-queries-purchase"
              - option "api-queries-signup"
              - option "Button Clicked"
              - option "button_clicked"
              - option "feature_used"
              - option "form_submitted"
              - option "login"
              - option "Page Viewed"
              - option "page_viewed"
              - option "Purchase Completed"
              - option "Sign Up Completed"
              - option "signup_completed"
              - option "Subscription Renewed"
              - option "test-funnels-step1-page_viewed"
              - option "test-funnels-step2-signup_completed"
              - option "test-funnels-step3-purchase_completed"
              - option "test-props-shape-event"
              - option "test-props-types-event"
              - option "test-trends-breakdown-event"
              - option "test-trends-granularity-event"
              - option "test-trends-identity-event"
              - option "test-trends-identity-link"
              - option "test-trends-numeric-event"
              - option "test-trends-shape-event"
              - option "test-trends-zerofill-event"
              - option "test-ui-enhanced-Button Clicked"
              - option "test-ui-enhanced-Feature Used"
              - option "test-ui-enhanced-Login"
              - option "test-ui-enhanced-Page Viewed"
              - option "test-ui-enhanced-Purchase Completed"
              - option "test-ui-enhanced-Signup Completed"
              - option "test-ui-events-Button Clicked"
              - option "test-ui-events-Page Viewed"
              - option "test-ui-events-Purchase Completed"
              - option "test-ui-funnels-Page Viewed"
              - option "test-ui-funnels-Purchase Completed"
              - option "test-ui-funnels-Signup Clicked"
              - option "test-ui-trends-page-viewed"
              - option "test-ui-trends-purchase-completed"
            - button "Remove step" [disabled]:
              - img
          - generic [ref=e55]:
            - generic [ref=e56]: Step 2
            - combobox [ref=e57]:
              - option "Select event" [selected]
              - option "api-events-all-fields"
              - option "api-events-batch-event-a"
              - option "api-events-batch-event-b"
              - option "api-events-batch-event-c"
              - option "api-events-batch-mix-valid-1"
              - option "api-events-batch-mix-valid-2"
              - option "api-events-minimal-device"
              - option "api-events-minimal-user"
              - option "api-events-no-timestamp"
              - option "api-events-properties-roundtrip"
              - option "api-queries-button-click"
              - option "api-queries-count-check"
              - option "api-queries-page-view"
              - option "api-queries-purchase"
              - option "api-queries-signup"
              - option "Button Clicked"
              - option "button_clicked"
              - option "feature_used"
              - option "form_submitted"
              - option "login"
              - option "Page Viewed"
              - option "page_viewed"
              - option "Purchase Completed"
              - option "Sign Up Completed"
              - option "signup_completed"
              - option "Subscription Renewed"
              - option "test-funnels-step1-page_viewed"
              - option "test-funnels-step2-signup_completed"
              - option "test-funnels-step3-purchase_completed"
              - option "test-props-shape-event"
              - option "test-props-types-event"
              - option "test-trends-breakdown-event"
              - option "test-trends-granularity-event"
              - option "test-trends-identity-event"
              - option "test-trends-identity-link"
              - option "test-trends-numeric-event"
              - option "test-trends-shape-event"
              - option "test-trends-zerofill-event"
              - option "test-ui-enhanced-Button Clicked"
              - option "test-ui-enhanced-Feature Used"
              - option "test-ui-enhanced-Login"
              - option "test-ui-enhanced-Page Viewed"
              - option "test-ui-enhanced-Purchase Completed"
              - option "test-ui-enhanced-Signup Completed"
              - option "test-ui-events-Button Clicked"
              - option "test-ui-events-Page Viewed"
              - option "test-ui-events-Purchase Completed"
              - option "test-ui-funnels-Page Viewed"
              - option "test-ui-funnels-Purchase Completed"
              - option "test-ui-funnels-Signup Clicked"
              - option "test-ui-trends-page-viewed"
              - option "test-ui-trends-purchase-completed"
            - button "Remove step" [disabled]:
              - img
        - button "Add step" [ref=e58] [cursor=pointer]:
          - img [ref=e59]
          - text: Add step
      - generic [ref=e61]:
        - img [ref=e62]
        - paragraph [ref=e65]: No funnel results yet
        - paragraph [ref=e66]: Select at least 2 events and click Analyze
```

# Test source

```ts
  218 | 
  219 |     // Each funnel step bar must be present
  220 |     const bars = visualization.getByTestId('funnel-bar');
  221 |     await expect(bars.first()).toBeVisible({ timeout: 5_000 });
  222 |     const barCount = await bars.count();
  223 |     expect(barCount).toBeGreaterThanOrEqual(2);
  224 |   });
  225 | 
  226 |   test('funnel visualization shows decreasing bar sizes and conversion percentages', async ({
  227 |     page,
  228 |   }) => {
  229 |     await page.goto(`${BASE_URL}/funnels`);
  230 | 
  231 |     const stepBuilder = page.getByTestId('funnel-step-builder');
  232 |     await expect(stepBuilder).toBeVisible({ timeout: 10_000 });
  233 | 
  234 |     const stepSelects = stepBuilder.getByTestId('funnel-step-select');
  235 |     await stepSelects.nth(0).selectOption(STEP1_EVENT);
  236 |     await stepSelects.nth(1).selectOption(STEP2_EVENT);
  237 | 
  238 |     // Add a third step
  239 |     await page.getByTestId('funnel-add-step').click();
  240 |     const updatedSelects = stepBuilder.getByTestId('funnel-step-select');
  241 |     await updatedSelects.nth(2).selectOption(STEP3_EVENT);
  242 | 
  243 |     await page.getByTestId('funnel-analyze-btn').click();
  244 | 
  245 |     const visualization = page.getByTestId('funnel-visualization');
  246 |     await expect(visualization).toBeVisible({ timeout: 10_000 });
  247 | 
  248 |     // Conversion-rate labels should each contain a "%" character
  249 |     const conversionLabels = visualization.getByTestId('funnel-conversion-rate');
  250 |     await expect(conversionLabels.first()).toBeVisible({ timeout: 5_000 });
  251 |     const labelCount = await conversionLabels.count();
  252 |     expect(labelCount).toBeGreaterThanOrEqual(1);
  253 | 
  254 |     for (let i = 0; i < labelCount; i++) {
  255 |       const text = await conversionLabels.nth(i).textContent();
  256 |       expect(text).toMatch(/%/);
  257 |     }
  258 | 
  259 |     // Bar heights / widths must strictly decrease from step to step.
  260 |     // We read the inline style or a data attribute set by the implementation.
  261 |     const bars = visualization.getByTestId('funnel-bar');
  262 |     const barCount = await bars.count();
  263 |     expect(barCount).toBe(3);
  264 | 
  265 |     // Collect the numeric "fill" percentage of each bar (via data-value attribute or aria-valuenow)
  266 |     const values: number[] = [];
  267 |     for (let i = 0; i < barCount; i++) {
  268 |       const bar = bars.nth(i);
  269 |       // Try data-value first, fall back to aria-valuenow, then parse from text
  270 |       const dataValue = await bar.getAttribute('data-value');
  271 |       const ariaValue = await bar.getAttribute('aria-valuenow');
  272 |       const raw = dataValue ?? ariaValue ?? '0';
  273 |       values.push(parseFloat(raw));
  274 |     }
  275 | 
  276 |     // The first bar is always 100 %; each subsequent bar must be ≤ the previous
  277 |     expect(values[0]).toBeGreaterThan(0);
  278 |     for (let i = 1; i < values.length; i++) {
  279 |       expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
  280 |     }
  281 |   });
  282 | 
  283 |   test('overall conversion rate is displayed in the results', async ({ page }) => {
  284 |     await page.goto(`${BASE_URL}/funnels`);
  285 | 
  286 |     const stepBuilder = page.getByTestId('funnel-step-builder');
  287 |     await expect(stepBuilder).toBeVisible({ timeout: 10_000 });
  288 | 
  289 |     const stepSelects = stepBuilder.getByTestId('funnel-step-select');
  290 |     await stepSelects.nth(0).selectOption(STEP1_EVENT);
  291 |     await stepSelects.nth(1).selectOption(STEP2_EVENT);
  292 | 
  293 |     await page.getByTestId('funnel-analyze-btn').click();
  294 | 
  295 |     const visualization = page.getByTestId('funnel-visualization');
  296 |     await expect(visualization).toBeVisible({ timeout: 10_000 });
  297 | 
  298 |     // There must be a dedicated element showing the overall conversion rate
  299 |     const overallRate = page.getByTestId('funnel-overall-conversion');
  300 |     await expect(overallRate).toBeVisible({ timeout: 5_000 });
  301 | 
  302 |     const text = await overallRate.textContent();
  303 |     expect(text).toMatch(/%/);
  304 |   });
  305 | 
  306 |   // ---------------------------------------------------------------------------
  307 |   // Empty state
  308 |   // ---------------------------------------------------------------------------
  309 | 
  310 |   test('empty state is shown when no users match the selected funnel steps', async ({ page }) => {
  311 |     await page.goto(`${BASE_URL}/funnels`);
  312 | 
  313 |     const stepBuilder = page.getByTestId('funnel-step-builder');
  314 |     await expect(stepBuilder).toBeVisible({ timeout: 10_000 });
  315 | 
  316 |     // Use a step combination that was never seeded
  317 |     const stepSelects = stepBuilder.getByTestId('funnel-step-select');
> 318 |     await stepSelects.nth(0).selectOption(NO_MATCH_EVENT);
      |                              ^ TimeoutError: locator.selectOption: Timeout 5000ms exceeded.
  319 |     await stepSelects.nth(1).selectOption(STEP3_EVENT);
  320 | 
  321 |     await page.getByTestId('funnel-analyze-btn').click();
  322 | 
  323 |     // The empty state element must appear
  324 |     const emptyState = page.getByTestId('funnel-empty-state');
  325 |     await expect(emptyState).toBeVisible({ timeout: 10_000 });
  326 | 
  327 |     // No bar elements should be rendered
  328 |     const bars = page.getByTestId('funnel-bar');
  329 |     expect(await bars.count()).toBe(0);
  330 |   });
  331 | });
  332 | 
```