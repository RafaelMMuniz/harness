/**
 * US-002: Set up SQLite database with connection and schema management
 *
 * Black-box tests derived from prd.json acceptance criteria.
 * Verifies: DB file creation on startup, .gitignore, events table schema,
 * identity_mappings table schema (including UNIQUE on device_id), AUTOINCREMENT,
 * and typecheck.
 *
 * NOTE: These tests start the server process to trigger DB initialization,
 * then inspect the database file directly using better-sqlite3.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { execSync, spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const DB_PATH = path.join(ROOT, 'minipanel.db');
const SERVER_PORT = 3001;

async function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

describe('US-002: SQLite database setup', () => {
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // Remove existing DB to verify it gets created on server startup
    if (existsSync(DB_PATH)) {
      unlinkSync(DB_PATH);
    }

    // Start the server — it MUST create the database on startup
    serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: path.join(ROOT, 'server'),
      stdio: 'pipe',
      env: { ...process.env },
    });

    // Capture stderr for debugging if server fails to start
    let stderr = '';
    serverProcess.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    serverProcess.on('error', (err) => {
      throw new Error(`Failed to start server: ${err.message}\nStderr: ${stderr}`);
    });

    await waitForServer(`http://localhost:${SERVER_PORT}`);
  }, 30000);

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
  });

  // --- AC: Server uses better-sqlite3 to create/open a local 'minipanel.db' file in the project root ---
  test('minipanel.db is created in the project root on server startup', () => {
    expect(existsSync(DB_PATH)).toBe(true);
  });

  // --- AC: Database file is gitignored ---
  test('minipanel.db is gitignored', () => {
    const gitignorePath = path.join(ROOT, '.gitignore');
    expect(existsSync(gitignorePath)).toBe(true);
    const content = readFileSync(gitignorePath, 'utf-8');
    // Must contain a pattern that matches minipanel.db
    expect(content).toMatch(/minipanel\.db/);
  });

  // --- AC: Events table with correct columns ---
  test('events table exists with all required columns and types', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    try {
      const tableInfo = db.pragma('table_info(events)') as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;

      expect(tableInfo.length).toBeGreaterThan(0);
      const cols = Object.fromEntries(tableInfo.map((c) => [c.name, c]));

      // id — INTEGER PRIMARY KEY
      expect(cols['id']).toBeDefined();
      expect(cols['id'].pk).toBe(1);

      // event_name — TEXT NOT NULL
      expect(cols['event_name']).toBeDefined();
      expect(cols['event_name'].type).toMatch(/TEXT/i);
      expect(cols['event_name'].notnull).toBe(1);

      // device_id — TEXT
      expect(cols['device_id']).toBeDefined();
      expect(cols['device_id'].type).toMatch(/TEXT/i);

      // user_id — TEXT
      expect(cols['user_id']).toBeDefined();
      expect(cols['user_id'].type).toMatch(/TEXT/i);

      // timestamp — TEXT NOT NULL
      expect(cols['timestamp']).toBeDefined();
      expect(cols['timestamp'].type).toMatch(/TEXT/i);
      expect(cols['timestamp'].notnull).toBe(1);

      // properties — TEXT (stores JSON string)
      expect(cols['properties']).toBeDefined();
      expect(cols['properties'].type).toMatch(/TEXT/i);
    } finally {
      db.close();
    }
  });

  // --- AC: Events table uses AUTOINCREMENT on id ---
  test('events table id uses AUTOINCREMENT', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    try {
      const row = db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='events'"
        )
        .get() as { sql: string } | undefined;

      expect(row).toBeDefined();
      expect(row!.sql).toMatch(/AUTOINCREMENT/i);
    } finally {
      db.close();
    }
  });

  // --- AC: Identity mappings table with correct columns ---
  test('identity_mappings table exists with all required columns and types', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    try {
      const tableInfo = db.pragma('table_info(identity_mappings)') as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;

      expect(tableInfo.length).toBeGreaterThan(0);
      const cols = Object.fromEntries(tableInfo.map((c) => [c.name, c]));

      // id — INTEGER PRIMARY KEY AUTOINCREMENT
      expect(cols['id']).toBeDefined();
      expect(cols['id'].pk).toBe(1);

      // device_id — TEXT NOT NULL UNIQUE
      expect(cols['device_id']).toBeDefined();
      expect(cols['device_id'].type).toMatch(/TEXT/i);
      expect(cols['device_id'].notnull).toBe(1);

      // user_id — TEXT NOT NULL
      expect(cols['user_id']).toBeDefined();
      expect(cols['user_id'].type).toMatch(/TEXT/i);
      expect(cols['user_id'].notnull).toBe(1);

      // created_at — TEXT NOT NULL
      expect(cols['created_at']).toBeDefined();
      expect(cols['created_at'].type).toMatch(/TEXT/i);
      expect(cols['created_at'].notnull).toBe(1);
    } finally {
      db.close();
    }
  });

  // --- AC: identity_mappings AUTOINCREMENT ---
  test('identity_mappings table id uses AUTOINCREMENT', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    try {
      const row = db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='identity_mappings'"
        )
        .get() as { sql: string } | undefined;

      expect(row).toBeDefined();
      expect(row!.sql).toMatch(/AUTOINCREMENT/i);
    } finally {
      db.close();
    }
  });

  // --- AC: UNIQUE constraint on device_id in identity_mappings ---
  test('identity_mappings has UNIQUE constraint on device_id', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    try {
      // Method 1: Check via index list (separate CREATE UNIQUE INDEX)
      const indexes = db.pragma('index_list(identity_mappings)') as Array<{
        seq: number;
        name: string;
        unique: number;
      }>;

      let hasUniqueDeviceId = false;
      for (const idx of indexes) {
        if (idx.unique) {
          const info = db.pragma(`index_info("${idx.name}")`) as Array<{
            seqno: number;
            cid: number;
            name: string;
          }>;
          if (info.some((c) => c.name === 'device_id')) {
            hasUniqueDeviceId = true;
            break;
          }
        }
      }

      // Method 2: Check inline UNIQUE in column definition
      if (!hasUniqueDeviceId) {
        const row = db
          .prepare(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='identity_mappings'"
          )
          .get() as { sql: string } | undefined;
        if (row) {
          hasUniqueDeviceId = /device_id[^,)]*UNIQUE/i.test(row.sql);
        }
      }

      expect(hasUniqueDeviceId).toBe(true);
    } finally {
      db.close();
    }
  });

  // --- AC: Typecheck passes ---
  test('typecheck passes', () => {
    execSync('npm run typecheck', { cwd: ROOT, timeout: 60000, stdio: 'pipe' });
  });
});
