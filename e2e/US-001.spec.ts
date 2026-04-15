/**
 * US-001: Initialize project with monorepo structure
 *
 * Verifies the project scaffold: monorepo with Express+TS backend (port 3001)
 * and React+Vite+Tailwind frontend (port 5173), both started by `npm run dev`.
 *
 * Tests derived from prd.json acceptance criteria — not from implementation.
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

// ── Build-time / structural checks ──────────────────────────────────────────

test.describe('US-001: Project structure', () => {
  test('root package.json has "npm run dev" script', () => {
    const pkg = JSON.parse(
      execSync('cat package.json', { cwd: ROOT, encoding: 'utf-8' }),
    );
    expect(pkg.scripts).toHaveProperty('dev');
  });

  test('root npm install installs all workspace dependencies', () => {
    // Verify that workspaces are configured so a single npm install works
    const pkg = JSON.parse(
      execSync('cat package.json', { cwd: ROOT, encoding: 'utf-8' }),
    );
    expect(pkg.workspaces).toEqual(expect.arrayContaining(['server', 'client']));

    // node_modules should exist for both workspaces after install
    expect(existsSync(resolve(ROOT, 'node_modules'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'server', 'package.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'client', 'package.json'))).toBe(true);
  });

  test('server/ directory uses Express + TypeScript', () => {
    const serverPkg = JSON.parse(
      execSync('cat server/package.json', { cwd: ROOT, encoding: 'utf-8' }),
    );
    const allDeps = {
      ...(serverPkg.dependencies || {}),
      ...(serverPkg.devDependencies || {}),
    };
    expect(allDeps).toHaveProperty('express');
    expect(allDeps).toHaveProperty('typescript');
  });

  test('client/ directory uses React + Vite + TailwindCSS', () => {
    const clientPkg = JSON.parse(
      execSync('cat client/package.json', { cwd: ROOT, encoding: 'utf-8' }),
    );
    const allDeps = {
      ...(clientPkg.dependencies || {}),
      ...(clientPkg.devDependencies || {}),
    };
    expect(allDeps).toHaveProperty('react');
    expect(allDeps).toHaveProperty('vite');
    // Tailwind v4 uses @tailwindcss/vite, v3 uses tailwindcss — accept either
    const hasTailwind =
      'tailwindcss' in allDeps || '@tailwindcss/vite' in allDeps;
    expect(hasTailwind).toBe(true);
  });

  test('shadcn UI initialized with Button component available', () => {
    // The Button component file must exist in client
    const buttonPath = resolve(ROOT, 'client', 'src', 'components', 'ui', 'button.tsx');
    expect(existsSync(buttonPath)).toBe(true);
  });

  test('lucide-react is installed in client', () => {
    const clientPkg = JSON.parse(
      execSync('cat client/package.json', { cwd: ROOT, encoding: 'utf-8' }),
    );
    const allDeps = {
      ...(clientPkg.dependencies || {}),
      ...(clientPkg.devDependencies || {}),
    };
    expect(allDeps).toHaveProperty('lucide-react');
  });

  test('zod is installed in server', () => {
    const serverPkg = JSON.parse(
      execSync('cat server/package.json', { cwd: ROOT, encoding: 'utf-8' }),
    );
    const allDeps = {
      ...(serverPkg.dependencies || {}),
      ...(serverPkg.devDependencies || {}),
    };
    expect(allDeps).toHaveProperty('zod');
  });

  test('README.md documents npm install && npm run dev', () => {
    const readme = execSync('cat README.md', { cwd: ROOT, encoding: 'utf-8' });
    expect(readme).toMatch(/npm install/i);
    expect(readme).toMatch(/npm run dev/i);
  });

  test('typecheck passes for both server and client', () => {
    // This will throw if typecheck fails
    execSync('npm run typecheck', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60_000,
    });
  });

  test('playwright config is valid (npx playwright test --list succeeds)', () => {
    const output = execSync('npx playwright test --list', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
    });
    // --list should print test names without error
    expect(output).toBeTruthy();
  });
});

// ── Runtime checks (require dev servers running) ────────────────────────────
// Playwright's webServer config starts `npm run dev` before these tests run.

test.describe('US-001: Runtime — backend', () => {
  test('backend responds on port 3001', async ({ request }) => {
    // Direct request to the backend port — any 2xx or known route is fine
    const res = await request.get('http://localhost:3001/');
    // Accept 200, 404 (route not found but server is up), or any non-5xx
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('US-001: Runtime — frontend', () => {
  test('frontend loads in browser on port 5173', async ({ page }) => {
    await page.goto('/');
    // The page should load without error and have some content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('vite proxy forwards /api requests to backend', async ({ request }) => {
    // A request through the Vite proxy should reach the Express backend.
    // The exact route doesn't matter yet (US-001 is scaffold only),
    // but the proxy itself should be wired up — a 404 from Express is fine,
    // a connection error or Vite HTML fallback is not.
    const res = await request.get('/api/health');
    // If proxy is working, we get a JSON or text response from Express.
    // If proxy is broken, we'd get Vite's HTML index page or a connection error.
    const contentType = res.headers()['content-type'] || '';
    // The response should NOT be HTML (that would mean Vite served its SPA fallback
    // instead of proxying to Express)
    expect(contentType).not.toMatch(/text\/html/);
  });
});
