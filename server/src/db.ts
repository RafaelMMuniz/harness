import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../minipanel.db');

let db: Database;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      device_id TEXT,
      user_id TEXT,
      timestamp TEXT NOT NULL,
      properties TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS identity_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS saved_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Indexes for common query patterns
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_device_id ON events(device_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_identity_device ON identity_mappings(device_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_identity_user ON identity_mappings(user_id)`);

  saveDb();
  return db;
}

export function getDb(): Database {
  return db;
}

/**
 * Persist the in-memory database to disk.
 * Direct call — flushes immediately.
 */
export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * Debounced save — schedules a write within 500ms.
 * Multiple calls within the window coalesce into one disk write.
 */
export function debouncedSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveDb();
  }, 500);
}

/**
 * Flush any pending debounced save immediately.
 * Useful before process exit or in tests.
 */
export function flushSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    saveDb();
  }
}
