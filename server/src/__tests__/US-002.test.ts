/**
 * US-002: Set up SQLite database with connection and schema management
 *
 * Black-box tests derived from acceptance criteria:
 * - Server creates/opens minipanel.db on startup
 * - Database file is gitignored (verified separately)
 * - Schema initialization runs on startup, creating tables if they don't exist
 * - Events table: id (INTEGER PK AUTOINCREMENT), event_name (TEXT NOT NULL),
 *   device_id (TEXT), user_id (TEXT), timestamp (TEXT NOT NULL), properties (TEXT)
 * - Identity mappings table: id (INTEGER PK AUTOINCREMENT), device_id (TEXT NOT NULL UNIQUE),
 *   user_id (TEXT NOT NULL), created_at (TEXT NOT NULL)
 * - Server starts successfully and logs confirmation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_DIR = path.resolve(__dirname, '..', '..');
const DB_PATH = path.resolve(PROJECT_ROOT, 'minipanel.db');

let serverProcess: ChildProcess;

function waitForServer(port: number, timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not start within ${timeoutMs}ms`));
        return;
      }
      try {
        const res = await fetch(`http://localhost:${port}/api/health`);
        if (res.ok) {
          resolve();
          return;
        }
      } catch {
        // not ready yet
      }
      setTimeout(check, 200);
    };
    check();
  });
}

describe('US-002: SQLite database setup', () => {
  beforeAll(async () => {
    // Clean up any existing DB to verify it gets created fresh
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }

    // Start the server
    serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: SERVER_DIR,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    // Capture server output for debugging
    let serverOutput = '';
    serverProcess.stdout?.on('data', (data) => {
      serverOutput += data.toString();
    });
    serverProcess.stderr?.on('data', (data) => {
      serverOutput += data.toString();
    });

    await waitForServer(3001);
  }, 15000);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    // Clean up test DB
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  it('should create minipanel.db file on startup', () => {
    expect(fs.existsSync(DB_PATH)).toBe(true);
  });

  it('should have *.db in .gitignore', () => {
    const gitignorePath = path.resolve(PROJECT_ROOT, '.gitignore');
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    // Check that some pattern matches .db files
    const dbIgnored =
      gitignore.includes('*.db') ||
      gitignore.includes('minipanel.db');
    expect(dbIgnored).toBe(true);
  });

  describe('events table schema', () => {
    it('should have an events table', () => {
      const db = new Database(DB_PATH, { readonly: true });
      const table = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='events'"
        )
        .get() as { name: string } | undefined;
      db.close();
      expect(table).toBeDefined();
      expect(table!.name).toBe('events');
    });

    it('should have correct columns on events table', () => {
      const db = new Database(DB_PATH, { readonly: true });
      const columns = db.prepare('PRAGMA table_info(events)').all() as Array<{
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }>;
      db.close();

      const colMap = new Map(columns.map((c) => [c.name, c]));

      // id — INTEGER PRIMARY KEY AUTOINCREMENT
      expect(colMap.has('id')).toBe(true);
      expect(colMap.get('id')!.type).toMatch(/INTEGER/i);
      expect(colMap.get('id')!.pk).toBe(1);

      // event_name — TEXT NOT NULL
      expect(colMap.has('event_name')).toBe(true);
      expect(colMap.get('event_name')!.type).toMatch(/TEXT/i);
      expect(colMap.get('event_name')!.notnull).toBe(1);

      // device_id — TEXT (nullable)
      expect(colMap.has('device_id')).toBe(true);
      expect(colMap.get('device_id')!.type).toMatch(/TEXT/i);

      // user_id — TEXT (nullable)
      expect(colMap.has('user_id')).toBe(true);
      expect(colMap.get('user_id')!.type).toMatch(/TEXT/i);

      // timestamp — TEXT NOT NULL
      expect(colMap.has('timestamp')).toBe(true);
      expect(colMap.get('timestamp')!.type).toMatch(/TEXT/i);
      expect(colMap.get('timestamp')!.notnull).toBe(1);

      // properties — TEXT (stores JSON string, nullable)
      expect(colMap.has('properties')).toBe(true);
      expect(colMap.get('properties')!.type).toMatch(/TEXT/i);
    });

    it('should enforce AUTOINCREMENT on events.id', () => {
      const db = new Database(DB_PATH, { readonly: true });
      // AUTOINCREMENT creates an entry in sqlite_sequence
      const seq = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'"
        )
        .get() as { name: string } | undefined;
      db.close();
      expect(seq).toBeDefined();
    });
  });

  describe('identity_mappings table schema', () => {
    it('should have an identity_mappings table', () => {
      const db = new Database(DB_PATH, { readonly: true });
      const table = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='identity_mappings'"
        )
        .get() as { name: string } | undefined;
      db.close();
      expect(table).toBeDefined();
      expect(table!.name).toBe('identity_mappings');
    });

    it('should have correct columns on identity_mappings table', () => {
      const db = new Database(DB_PATH, { readonly: true });
      const columns = db
        .prepare('PRAGMA table_info(identity_mappings)')
        .all() as Array<{
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }>;
      db.close();

      const colMap = new Map(columns.map((c) => [c.name, c]));

      // id — INTEGER PRIMARY KEY AUTOINCREMENT
      expect(colMap.has('id')).toBe(true);
      expect(colMap.get('id')!.type).toMatch(/INTEGER/i);
      expect(colMap.get('id')!.pk).toBe(1);

      // device_id — TEXT NOT NULL UNIQUE
      expect(colMap.has('device_id')).toBe(true);
      expect(colMap.get('device_id')!.type).toMatch(/TEXT/i);
      expect(colMap.get('device_id')!.notnull).toBe(1);

      // user_id — TEXT NOT NULL
      expect(colMap.has('user_id')).toBe(true);
      expect(colMap.get('user_id')!.type).toMatch(/TEXT/i);
      expect(colMap.get('user_id')!.notnull).toBe(1);

      // created_at — TEXT NOT NULL
      expect(colMap.has('created_at')).toBe(true);
      expect(colMap.get('created_at')!.type).toMatch(/TEXT/i);
      expect(colMap.get('created_at')!.notnull).toBe(1);
    });

    it('should enforce UNIQUE constraint on device_id', () => {
      const db = new Database(DB_PATH);
      // Insert one row
      db.prepare(
        "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES ('device-1', 'user-1', '2024-01-01T00:00:00Z')"
      ).run();

      // Attempt duplicate device_id — should throw
      expect(() => {
        db.prepare(
          "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES ('device-1', 'user-2', '2024-01-01T00:00:00Z')"
        ).run();
      }).toThrow();

      // Clean up
      db.prepare("DELETE FROM identity_mappings WHERE device_id = 'device-1'").run();
      db.close();
    });
  });

  describe('idempotent schema initialization', () => {
    it('should not error if server restarts (tables already exist)', async () => {
      // The server already started and created the DB. Kill and restart.
      serverProcess.kill('SIGTERM');

      // Wait a moment for the port to free up
      await new Promise((r) => setTimeout(r, 1000));

      const SERVER_DIR_2 = SERVER_DIR;
      const proc2 = spawn('npx', ['tsx', 'src/index.ts'], {
        cwd: SERVER_DIR_2,
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
      });

      try {
        await waitForServer(3001);
        // Server started successfully — schema init was idempotent
        expect(true).toBe(true);

        // DB still has the correct tables
        const db = new Database(DB_PATH, { readonly: true });
        const tables = db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('events', 'identity_mappings') ORDER BY name"
          )
          .all() as Array<{ name: string }>;
        db.close();
        expect(tables.map((t) => t.name).sort()).toEqual([
          'events',
          'identity_mappings',
        ]);
      } finally {
        proc2.kill('SIGTERM');
        // Reassign for afterAll cleanup
        serverProcess = proc2;
      }
    }, 15000);
  });
});
