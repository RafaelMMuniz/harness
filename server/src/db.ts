import Database from 'better-sqlite3';
import path from 'node:path';

export const DB_PATH = path.resolve('minipanel.db');

export const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function getDb(): Database.Database {
  return db;
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      device_id TEXT,
      user_id TEXT,
      timestamp TEXT NOT NULL,
      properties TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS identity_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  console.log('Database initialized successfully');
}
