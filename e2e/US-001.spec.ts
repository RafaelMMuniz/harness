import { test, expect } from '@playwright/test';

/*
 * US-001: Initialize project with monorepo structure
 *
 * Derived from acceptance criteria — NOT from implementation:
 *
 * AC1: Root package.json with "npm run dev" starts both backend and frontend
 *      (implicitly verified: Playwright's webServer config runs "npm run dev")
 * AC2: Backend = Express.js + TypeScript, listening on port 3001
 * AC3: Frontend = React + Vite + TypeScript + TailwindCSS, port 5173,
 *      proxies /api/* to backend
 * AC4: Shadcn UI initialized with at least Button component
 * AC5: Typecheck passes (tested separately, not here)
 * AC6: npx playwright test --list succeeds (tested separately, not here)
 */

test.describe('US-001: Project scaffold', () => {
  test('frontend serves a React application on port 5173', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // React apps mount into a root element
    await expect(page.locator('#root')).toBeAttached();

    // Something must have rendered inside #root (not an empty shell)
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.length).toBeGreaterThan(0);
  });

  test('backend Express server is reachable on port 3001', async ({ request }) => {
    // Any HTTP response proves Express is listening.
    // Connection refused would cause the request to throw.
    const response = await request.get('http://localhost:3001/', {
      timeout: 5000,
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  });

  test('frontend proxies /api requests to the backend', async ({ request }) => {
    // Hit /api/health through the frontend port (5173).
    // If the Vite proxy is configured, Express handles the request —
    // returning JSON, plain text, or its own 404 ("Cannot GET ...").
    // If proxy is NOT configured, Vite serves its SPA fallback:
    // a full HTML document with <script type="module"> tags.
    const response = await request.get('/api/health');
    const body = await response.text();

    // Vite's SPA fallback always includes module script tags.
    // Express responses (even its default 404) never do.
    expect(body).not.toContain('<script type="module"');
  });
});
