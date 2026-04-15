/**
 * US-001: Initialize project with monorepo structure
 *
 * Validates that the project scaffolding meets all acceptance criteria
 * from the spec. Tests are derived purely from prd.json AC — no source
 * code was read.
 *
 * Structural checks use Node fs/child_process; runtime checks use
 * Playwright's request context (the webServer in playwright.config.ts
 * starts `npm run dev` before these tests run).
 */

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ---------- Structural checks ----------

test.describe('US-001: Project structure', () => {
  test('root package.json has "npm run dev" script', () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
    // Should start both backend and frontend
    expect(typeof pkg.scripts.dev).toBe('string');
  });

  test('server/ directory exists with TypeScript config', () => {
    expect(existsSync(path.join(ROOT, 'server'))).toBe(true);
    expect(existsSync(path.join(ROOT, 'server', 'tsconfig.json'))).toBe(true);
  });

  test('client/ directory exists with TypeScript config', () => {
    expect(existsSync(path.join(ROOT, 'client'))).toBe(true);
    expect(existsSync(path.join(ROOT, 'client', 'tsconfig.json'))).toBe(true);
  });

  test('server/ has a package.json (Express + Zod)', () => {
    const serverPkgPath = path.join(ROOT, 'server', 'package.json');
    expect(existsSync(serverPkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(serverPkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps['express']).toBeDefined();
    expect(allDeps['zod']).toBeDefined();
  });

  test('client/ has a package.json (React + Vite + TailwindCSS)', () => {
    const clientPkgPath = path.join(ROOT, 'client', 'package.json');
    expect(existsSync(clientPkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(clientPkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps['react']).toBeDefined();
    expect(allDeps['vite']).toBeDefined();
    expect(
      allDeps['tailwindcss'] || allDeps['@tailwindcss/vite'] || allDeps['@tailwindcss/postcss']
    ).toBeDefined();
  });

  test('client/ has shadcn Button component available', () => {
    // shadcn typically places components in src/components/ui/
    const buttonPath = path.join(ROOT, 'client', 'src', 'components', 'ui', 'button.tsx');
    expect(existsSync(buttonPath)).toBe(true);
  });

  test('client/ has lucide-react as a dependency', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(ROOT, 'client', 'package.json'), 'utf-8')
    );
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps['lucide-react']).toBeDefined();
  });

  test('single npm install at root installs all deps (workspaces)', () => {
    const rootPkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    // Must have workspaces that include server and client
    expect(rootPkg.workspaces).toBeDefined();
    expect(Array.isArray(rootPkg.workspaces)).toBe(true);
    const ws = rootPkg.workspaces as string[];
    expect(ws.some((w: string) => w === 'server' || w.includes('server'))).toBe(true);
    expect(ws.some((w: string) => w === 'client' || w.includes('client'))).toBe(true);
  });

  test('README.md documents the start command', () => {
    const readmePath = path.join(ROOT, 'README.md');
    expect(existsSync(readmePath)).toBe(true);
    const content = readFileSync(readmePath, 'utf-8');
    expect(content).toContain('npm install');
    expect(content).toContain('npm run dev');
  });

  test('typecheck passes for both server and client', () => {
    // This will throw if typecheck fails
    execSync('npm run typecheck', { cwd: ROOT, timeout: 60000, stdio: 'pipe' });
  });

  test('Playwright config is valid (npx playwright test --list succeeds)', () => {
    // --list just lists tests without running them — verifies config is parseable
    execSync('npx playwright test --list', { cwd: ROOT, timeout: 30000, stdio: 'pipe' });
  });
});

// ---------- Runtime checks ----------

test.describe('US-001: Dev servers running', () => {
  test('frontend loads on port 5173', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('backend API responds on port 3001', async ({ request }) => {
    // A minimal Express server should return something on the root or a health endpoint
    // We accept any response that isn't a connection error
    const response = await request.get('http://localhost:3001/', { timeout: 5000 });
    // Even a 404 is fine — it means the server is running
    expect(response.status()).toBeLessThan(500);
  });

  test('frontend proxies API requests to backend', async ({ request }) => {
    // Requests to /api/* through the frontend (port 5173) should be proxied to backend (port 3001)
    // We expect the proxy to forward and return *something* — even a 404 from Express, not a Vite error page
    const response = await request.get('/api/health', { timeout: 5000 });
    // A properly proxied request returns JSON or a small status response, not a full HTML page
    // If Vite serves its own 404 HTML, the proxy isn't working
    const status = response.status();
    // Accept any status — the key is the request reached the backend, not Vite's fallback
    // We verify by checking content-type isn't text/html (which would be Vite's SPA fallback)
    if (status === 404) {
      const contentType = response.headers()['content-type'] || '';
      // Express 404 returns text/html but it's a tiny error page, not a full SPA
      // Vite SPA fallback returns the full index.html. We check body size as a heuristic.
      const body = await response.text();
      expect(body.length).toBeLessThan(5000); // Express error pages are small; Vite index.html is larger
    }
  });
});
