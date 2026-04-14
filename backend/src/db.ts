import Database from 'better-sqlite3';
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
CREATE INDEX IF NOT EXISTS idx_identity_mappings_device_id ON identity_mappings(device_id);
CREATE INDEX IF NOT EXISTS idx_identity_mappings_user_id ON identity_mappings(user_id);
`;

function initializeSchema(db: Database.Database): void {
  db.exec(SCHEMA);
}

let singletonDb: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!singletonDb) {
    const dbPath = path.join(process.cwd(), 'minipanel.db');
    singletonDb = new Database(dbPath);
    singletonDb.pragma('journal_mode = WAL');
    singletonDb.pragma('foreign_keys = ON');
    initializeSchema(singletonDb);
  }
  return singletonDb;
}

export function getTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeSchema(db);
  return db;
}
