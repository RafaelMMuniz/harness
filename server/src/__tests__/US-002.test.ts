/**
 * US-002: SQLite database with connection and schema management
 *
 * Tests derived from acceptance criteria in prd.json.
 * Black-box validation: imports db module, verifies schema via PRAGMA introspection.
 * Does NOT read implementation source — tests the spec, not the code.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;   // 1 = NOT NULL
  dflt_value: string | null;
  pk: number;        // 1 = PRIMARY KEY
}

interface IndexInfo {
  name: string;
  unique: number;
}

interface IndexColumn {
  name: string;
}

/**
 * Import the db module and obtain a reference to its database connection.
 * The spec says schema lives in server/src/db.ts and an init function runs on startup.
 * We try common export patterns: { db, initDb }, { db }, or default export.
 */
let db: Database.Database;

beforeAll(async () => {
  // Dynamic import of the db module — the coder must export a usable db instance
  const dbModule = await import('../db.js');

  // Call init if exported (the spec says "a schema initialization function runs on server startup")
  if (typeof dbModule.initDb === 'function') {
    dbModule.initDb();
  } else if (typeof dbModule.initializeDb === 'function') {
    dbModule.initializeDb();
  } else if (typeof dbModule.init === 'function') {
    dbModule.init();
  }

  // Get the database instance — common export names
  db = dbModule.db ?? dbModule.default;

  if (!db) {
    throw new Error(
      'Could not obtain a database instance from server/src/db.ts. ' +
      'Expected a named export "db" or a default export.'
    );
  }
});

// ── Table existence ──────────────────────────────────────────────────────────

describe('US-002: Database schema', () => {
  it('creates the "events" table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
      .all();
    expect(tables).toHaveLength(1);
  });

  it('creates the "identity_mappings" table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='identity_mappings'")
      .all();
    expect(tables).toHaveLength(1);
  });

  // ── Events table columns ────────────────────────────────────────────────

  describe('events table schema', () => {
    let columns: ColumnInfo[];

    beforeAll(() => {
      columns = db.prepare('PRAGMA table_info(events)').all() as ColumnInfo[];
    });

    it('has an "id" column that is INTEGER PRIMARY KEY AUTOINCREMENT', () => {
      const col = columns.find((c) => c.name === 'id');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/INTEGER/i);
      expect(col!.pk).toBe(1);

      // Verify AUTOINCREMENT by checking sqlite_sequence or the SQL
      const createSql = db
        .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='events'")
        .get() as { sql: string };
      expect(createSql.sql).toMatch(/AUTOINCREMENT/i);
    });

    it('has "event_name" column as TEXT NOT NULL', () => {
      const col = columns.find((c) => c.name === 'event_name');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      expect(col!.notnull).toBe(1);
    });

    it('has "device_id" column as TEXT (nullable)', () => {
      const col = columns.find((c) => c.name === 'device_id');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      // device_id is nullable per spec (no NOT NULL)
      expect(col!.notnull).toBe(0);
    });

    it('has "user_id" column as TEXT (nullable)', () => {
      const col = columns.find((c) => c.name === 'user_id');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      expect(col!.notnull).toBe(0);
    });

    it('has "timestamp" column as TEXT NOT NULL', () => {
      const col = columns.find((c) => c.name === 'timestamp');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      expect(col!.notnull).toBe(1);
    });

    it('has "properties" column as TEXT (nullable, stores JSON string)', () => {
      const col = columns.find((c) => c.name === 'properties');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      // Properties is nullable per spec
      expect(col!.notnull).toBe(0);
    });

    it('has exactly 6 columns', () => {
      expect(columns).toHaveLength(6);
    });
  });

  // ── Identity mappings table columns ─────────────────────────────────────

  describe('identity_mappings table schema', () => {
    let columns: ColumnInfo[];

    beforeAll(() => {
      columns = db.prepare('PRAGMA table_info(identity_mappings)').all() as ColumnInfo[];
    });

    it('has an "id" column that is INTEGER PRIMARY KEY AUTOINCREMENT', () => {
      const col = columns.find((c) => c.name === 'id');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/INTEGER/i);
      expect(col!.pk).toBe(1);

      const createSql = db
        .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='identity_mappings'")
        .get() as { sql: string };
      expect(createSql.sql).toMatch(/AUTOINCREMENT/i);
    });

    it('has "device_id" column as TEXT NOT NULL', () => {
      const col = columns.find((c) => c.name === 'device_id');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      expect(col!.notnull).toBe(1);
    });

    it('has "user_id" column as TEXT NOT NULL', () => {
      const col = columns.find((c) => c.name === 'user_id');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      expect(col!.notnull).toBe(1);
    });

    it('has "created_at" column as TEXT NOT NULL', () => {
      const col = columns.find((c) => c.name === 'created_at');
      expect(col).toBeDefined();
      expect(col!.type).toMatch(/TEXT/i);
      expect(col!.notnull).toBe(1);
    });

    it('has exactly 4 columns', () => {
      expect(columns).toHaveLength(4);
    });
  });

  // ── Constraints ─────────────────────────────────────────────────────────

  describe('constraints', () => {
    it('enforces UNIQUE on identity_mappings.device_id', () => {
      // Insert a mapping
      db.prepare(
        "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES ('dev-unique-test', 'user-1', '2024-01-01T00:00:00Z')"
      ).run();

      // Duplicate device_id should throw a UNIQUE constraint error
      expect(() => {
        db.prepare(
          "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES ('dev-unique-test', 'user-2', '2024-01-01T00:00:00Z')"
        ).run();
      }).toThrow(/UNIQUE constraint/i);
    });

    it('rejects events with NULL event_name', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO events (event_name, timestamp) VALUES (NULL, '2024-01-01T00:00:00Z')"
        ).run();
      }).toThrow(/NOT NULL constraint/i);
    });

    it('rejects events with NULL timestamp', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO events (event_name, timestamp) VALUES ('click', NULL)"
        ).run();
      }).toThrow(/NOT NULL constraint/i);
    });

    it('allows NULL properties in events', () => {
      const result = db.prepare(
        "INSERT INTO events (event_name, timestamp, properties) VALUES ('test-null-props', '2024-01-01T00:00:00Z', NULL)"
      ).run();
      expect(result.changes).toBe(1);
    });

    it('allows JSON string in properties column', () => {
      const json = JSON.stringify({ page: '/home', referrer: 'google.com' });
      const result = db.prepare(
        "INSERT INTO events (event_name, timestamp, properties) VALUES ('test-json-props', '2024-01-01T00:00:00Z', ?)"
      ).run(json);
      expect(result.changes).toBe(1);

      // Read it back
      const row = db.prepare(
        "SELECT properties FROM events WHERE event_name = 'test-json-props'"
      ).get() as { properties: string };
      expect(JSON.parse(row.properties)).toEqual({ page: '/home', referrer: 'google.com' });
    });
  });

  // ── Adversarial edge cases ───────────────────────────────────────────

  describe('adversarial edge cases', () => {
    it('device_id UNIQUE constraint has an index (not just inline UNIQUE keyword)', () => {
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='identity_mappings'")
        .all() as { name: string }[];
      // There should be at least one index on identity_mappings (the UNIQUE constraint creates one)
      expect(indexes.length).toBeGreaterThanOrEqual(1);
    });

    it('events table accepts rows with empty-string device_id and user_id (not NULL)', () => {
      const result = db.prepare(
        "INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES ('edge-empty', '', '', '2024-01-01T00:00:00Z', NULL)"
      ).run();
      expect(result.changes).toBe(1);
    });

    it('properties column round-trips complex JSON with special characters', () => {
      const complexJson = JSON.stringify({
        query: "Robert'); DROP TABLE events;--",
        nested: { arr: [1, 2, { deep: true }] },
        unicode: '\u00e9\u00e0\u00fc\u{1f600}',
        empty: '',
        zero: 0,
        nul: null,
      });
      db.prepare(
        "INSERT INTO events (event_name, timestamp, properties) VALUES ('edge-json', '2024-06-15T12:00:00Z', ?)"
      ).run(complexJson);

      const row = db.prepare(
        "SELECT properties FROM events WHERE event_name = 'edge-json'"
      ).get() as { properties: string };
      expect(JSON.parse(row.properties)).toEqual(JSON.parse(complexJson));
    });

    it('rejects identity_mappings with NULL device_id', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES (NULL, 'user-x', '2024-01-01T00:00:00Z')"
        ).run();
      }).toThrow(/NOT NULL constraint/i);
    });

    it('rejects identity_mappings with NULL user_id', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES ('dev-null-uid', NULL, '2024-01-01T00:00:00Z')"
        ).run();
      }).toThrow(/NOT NULL constraint/i);
    });

    it('rejects identity_mappings with NULL created_at', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES ('dev-null-cat', 'user-x', NULL)"
        ).run();
      }).toThrow(/NOT NULL constraint/i);
    });

    it('AUTOINCREMENT ids are monotonically increasing', () => {
      const r1 = db.prepare(
        "INSERT INTO events (event_name, timestamp) VALUES ('mono-1', '2024-01-01T00:00:00Z')"
      ).run();
      const r2 = db.prepare(
        "INSERT INTO events (event_name, timestamp) VALUES ('mono-2', '2024-01-01T00:00:01Z')"
      ).run();
      expect(Number(r2.lastInsertRowid)).toBeGreaterThan(Number(r1.lastInsertRowid));
    });
  });

  // ── Idempotency ─────────────────────────────────────────────────────────

  describe('idempotency', () => {
    it('calling schema init twice does not error', async () => {
      // Re-import and re-init — should be safe (CREATE TABLE IF NOT EXISTS)
      const dbModule = await import('../db.js');
      const initFn = dbModule.initDb ?? dbModule.initializeDb ?? dbModule.init;
      if (typeof initFn === 'function') {
        expect(() => initFn()).not.toThrow();
      }
      // If there's no explicit init function (schema runs on import), the fact
      // that we imported twice without error is itself the proof of idempotency.
    });
  });

  // ── .gitignore ──────────────────────────────────────────────────────────

  describe('gitignore', () => {
    it('minipanel.db is listed in .gitignore', () => {
      const gitignorePath = path.resolve(import.meta.dirname, '../../../.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      // Should contain minipanel.db or *.db
      const ignoresDb =
        content.includes('minipanel.db') || content.includes('*.db');
      expect(ignoresDb).toBe(true);
    });
  });
});
