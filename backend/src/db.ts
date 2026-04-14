import initSqlJs, { type Database } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  device_id TEXT,
  user_id TEXT,
  timestamp TEXT NOT NULL,
  properties TEXT
);

CREATE TABLE IF NOT EXISTS identity_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('trend', 'funnel')),
  config TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_device_id ON events(device_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_mappings_user_id ON identity_mappings(user_id);
`;

let db: Database | null = null;
let dbPath: string = '';
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function getDbPath(): string {
  return process.env.DB_PATH || path.join(process.cwd(), 'minipanel.db');
}

export async function initDb(): Promise<Database> {
  const SQL = await initSqlJs();
  dbPath = getDbPath();

  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }

  db.run(SCHEMA);
  scheduleSave();
  return db;
}

function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setInterval(() => {
    persistDb();
  }, 5000);
}

export function persistDb(): void {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb(): void {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  if (db) {
    persistDb();
    db.close();
    db = null;
  }
}

// Compatibility layer: sql.js uses a different API than better-sqlite3.
// We provide helper functions that mimic common patterns.

export interface QueryResult {
  [key: string]: unknown;
}

/**
 * Run a query and return all rows as objects.
 */
export function queryAll(sql: string, params: unknown[] = []): QueryResult[] {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params as (string | number | null | Uint8Array)[]);
  const results: QueryResult[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row as QueryResult);
  }
  stmt.free();
  return results;
}

/**
 * Run a query and return the first row, or undefined.
 */
export function queryOne(sql: string, params: unknown[] = []): QueryResult | undefined {
  const results = queryAll(sql, params);
  return results[0];
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE) and return info.
 */
export function execute(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
  const d = getDb();
  d.run(sql, params as (string | number | null | Uint8Array)[]);
  const lastId = (queryOne('SELECT last_insert_rowid() as id') as { id: number } | undefined)?.id || 0;
  const changes = (queryOne('SELECT changes() as c') as { c: number } | undefined)?.c || 0;
  return { lastInsertRowid: lastId, changes };
}

/**
 * Execute multiple statements in a transaction.
 */
export function transaction(fn: () => void): void {
  const d = getDb();
  d.run('BEGIN TRANSACTION');
  try {
    fn();
    d.run('COMMIT');
  } catch (err) {
    d.run('ROLLBACK');
    throw err;
  }
}
