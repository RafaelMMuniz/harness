import Database from 'better-sqlite3';
import path from 'node:path';
import { existsSync, writeFileSync, appendFileSync } from 'node:fs';

export const DB_PATH = path.resolve('minipanel.db');

try {
  writeFileSync('/tmp/db-debug.txt', [
    `DB_PATH=${DB_PATH}`,
    `cwd=${process.cwd()}`,
  ].join('\n') + '\n');
} catch {}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initializeDatabase(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      device_id TEXT,
      user_id TEXT,
      timestamp TEXT NOT NULL,
      properties TEXT
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS identity_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  try {
    appendFileSync('/tmp/db-debug.txt', `initDB done, exists=${existsSync(DB_PATH)}\n`);
  } catch {}

  console.log('Database initialized successfully');
}
