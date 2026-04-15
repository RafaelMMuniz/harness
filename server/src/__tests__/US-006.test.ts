/**
 * US-006: Write automated tests for identity resolution
 *
 * Meta-validation: verifies the CODER delivered the required test artifacts
 * for identity resolution. Derived solely from prd.json acceptance criteria:
 *
 * 1. Test file exists at server/src/__tests__/identity-resolution.test.ts (or similar)
 * 2. Test runner is configured and 'npm test' in server workspace runs the tests
 * 3. Test 1 - Retroactive merge scenario present
 * 4. Test 2 - Multi-device merge scenario present
 * 5. Test 3 - Device collision rejection scenario present
 * 6. Test 4 - Unidentified device scenario present
 * 7. All tests pass
 * 8. Typecheck passes
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SERVER_DIR = path.resolve(__dirname, '..', '..');

describe('US-006: Automated tests for identity resolution', () => {
  // ── AC: Test file exists ─────────────────────────────────────────────────

  describe('Test file existence', () => {
    it('identity-resolution test file exists in __tests__/', () => {
      const testsDir = path.join(SERVER_DIR, 'src', '__tests__');
      const files = fs.readdirSync(testsDir);

      // Accept any file whose name includes "identity" and ends with .test.ts
      const idTestFile = files.find(
        (f) => /identity/i.test(f) && f.endsWith('.test.ts'),
      );

      expect(
        idTestFile,
        'Expected a test file matching *identity*.test.ts in server/src/__tests__/',
      ).toBeDefined();
    });
  });

  // ── AC: npm test is configured ───────────────────────────────────────────

  describe('Test runner configuration', () => {
    it('"test" script is defined in server/package.json', () => {
      const pkgPath = path.join(SERVER_DIR, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

      expect(
        pkg.scripts?.test,
        'Expected "test" script in server/package.json (e.g., "vitest run")',
      ).toBeDefined();
      expect(pkg.scripts.test.length).toBeGreaterThan(0);
    });
  });

  // ── AC: 4 required test scenarios are present ────────────────────────────

  describe('Required test scenarios', () => {
    let testFileContent: string;

    // Find and read the identity-resolution test file
    const testsDir = path.join(SERVER_DIR, 'src', '__tests__');
    const findTestFile = (): string | undefined => {
      if (!fs.existsSync(testsDir)) return undefined;
      const files = fs.readdirSync(testsDir);
      const match = files.find(
        (f) => /identity/i.test(f) && f.endsWith('.test.ts'),
      );
      return match ? path.join(testsDir, match) : undefined;
    };

    const testFilePath = findTestFile();

    // Skip scenario checks if the file doesn't exist (covered by earlier test)
    if (testFilePath && fs.existsSync(testFilePath)) {
      testFileContent = fs.readFileSync(testFilePath, 'utf-8');
    } else {
      testFileContent = '';
    }

    it('Test 1 - contains a retroactive merge test scenario', () => {
      // The spec says: "send 4 anonymous events for device-X, then send 1 event
      // with both device-X and user-Y, query events for user-Y, assert all 5 events"
      expect(
        /retroactive|retro.*merge/i.test(testFileContent),
        'Expected test file to contain a retroactive merge test scenario (look for "retroactive" or "retro*merge")',
      ).toBe(true);
    });

    it('Test 2 - contains a multi-device merge test scenario', () => {
      // The spec says: "send anonymous events for device-A and device-B, link both to user-Z"
      expect(
        /multi.?device|multiple.*device/i.test(testFileContent),
        'Expected test file to contain a multi-device merge test scenario',
      ).toBe(true);
    });

    it('Test 3 - contains a device collision rejection test scenario', () => {
      // The spec says: "link device-C to user-P, attempt to link device-C to user-Q, assert rejected (409)"
      expect(
        /collision|reject|409|conflict/i.test(testFileContent),
        'Expected test file to contain a device collision/rejection test scenario (409 or conflict)',
      ).toBe(true);
    });

    it('Test 4 - contains an unidentified device test scenario', () => {
      // The spec says: "send anonymous events for device-D (no mapping), query by device-D,
      // assert only device-D events are returned"
      expect(
        /unidentified|unmapped|no.?mapping|anonymous.*only/i.test(testFileContent),
        'Expected test file to contain an unidentified/unmapped device test scenario',
      ).toBe(true);
    });
  });

  // ── AC: All tests pass ───────────────────────────────────────────────────

  describe('Tests pass', () => {
    it('"npm test" in server/ exits with code 0', () => {
      // Run npm test synchronously; if it exits non-zero, execSync throws
      let output: string;
      try {
        output = execSync('npm test', {
          cwd: SERVER_DIR,
          timeout: 120_000,
          stdio: 'pipe',
          env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
        }).toString();
      } catch (err: unknown) {
        const execErr = err as { stdout?: Buffer; stderr?: Buffer; status?: number };
        const stdout = execErr.stdout?.toString() ?? '';
        const stderr = execErr.stderr?.toString() ?? '';
        throw new Error(
          `npm test failed (exit code ${execErr.status}).\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
        );
      }

      // Sanity: output should mention tests passing
      expect(output).toBeDefined();
    });
  });

  // ── AC: Typecheck passes ─────────────────────────────────────────────────

  describe('Typecheck passes', () => {
    it('"npm run typecheck" in server/ exits with code 0', () => {
      let output: string;
      try {
        output = execSync('npm run typecheck', {
          cwd: SERVER_DIR,
          timeout: 60_000,
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        }).toString();
      } catch (err: unknown) {
        const execErr = err as { stdout?: Buffer; stderr?: Buffer; status?: number };
        const stdout = execErr.stdout?.toString() ?? '';
        const stderr = execErr.stderr?.toString() ?? '';
        throw new Error(
          `Typecheck failed (exit code ${execErr.status}).\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
        );
      }

      expect(output).toBeDefined();
    });
  });
});
