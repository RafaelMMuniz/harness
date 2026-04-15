import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';

let db: Database;

function createSchema(database: Database) {
  database.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    device_id TEXT,
    user_id TEXT,
    timestamp TEXT NOT NULL,
    properties TEXT
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS identity_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
}

function insertEvent(database: Database, event: { event_name: string; device_id?: string; user_id?: string; timestamp: string }) {
  database.run(
    `INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)`,
    [event.event_name, event.device_id ?? null, event.user_id ?? null, event.timestamp, null],
  );
}

function linkIdentity(database: Database, deviceId: string, userId: string) {
  const existing = database.exec(`SELECT user_id FROM identity_mappings WHERE device_id = ?`, [deviceId]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    const mappedUser = existing[0].values[0][0] as string;
    if (mappedUser !== userId) {
      throw new Error(`device_id "${deviceId}" is already mapped to user "${mappedUser}"`);
    }
    return;
  }
  database.run(
    `INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)`,
    [deviceId, userId, new Date().toISOString()],
  );
}

function resolveIdentity(database: Database, id: string): string {
  const result = database.exec(`SELECT user_id FROM identity_mappings WHERE device_id = ?`, [id]);
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as string;
  }
  return id;
}

function getEventsForUser(database: Database, userId: string) {
  const result = database.exec(
    `SELECT e.id, e.event_name, e.device_id, e.user_id, e.timestamp
     FROM events e
     LEFT JOIN identity_mappings im ON e.device_id = im.device_id
     WHERE e.user_id = ? OR im.user_id = ?
     ORDER BY e.timestamp ASC`,
    [userId, userId],
  );
  if (result.length === 0) return [];
  return result[0].values.map((row) => ({
    id: row[0],
    event_name: row[1],
    device_id: row[2],
    user_id: row[3],
    timestamp: row[4],
  }));
}

describe('Identity resolution', () => {
  beforeAll(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  beforeEach(() => {
    db.run('DELETE FROM events');
    db.run('DELETE FROM identity_mappings');
  });

  test('Retroactive merge: anonymous events resolve to user after identification', () => {
    // Send 4 anonymous events for device-X
    for (let i = 0; i < 4; i++) {
      insertEvent(db, {
        event_name: 'page_viewed',
        device_id: 'device-X',
        timestamp: `2025-07-01T0${i}:00:00.000Z`,
      });
    }

    // Send 1 event with both device-X and user-Y (creates mapping)
    insertEvent(db, {
      event_name: 'signup',
      device_id: 'device-X',
      user_id: 'user-Y',
      timestamp: '2025-07-01T05:00:00.000Z',
    });
    linkIdentity(db, 'device-X', 'user-Y');

    // Query events for user-Y
    const events = getEventsForUser(db, 'user-Y');
    expect(events.length).toBe(5);
  });

  test('Multi-device merge: events from multiple devices resolve to same user', () => {
    // Anonymous events for device-A
    insertEvent(db, { event_name: 'browse', device_id: 'device-A', timestamp: '2025-07-02T01:00:00Z' });
    insertEvent(db, { event_name: 'browse', device_id: 'device-A', timestamp: '2025-07-02T02:00:00Z' });

    // Anonymous events for device-B
    insertEvent(db, { event_name: 'browse', device_id: 'device-B', timestamp: '2025-07-02T03:00:00Z' });
    insertEvent(db, { event_name: 'browse', device_id: 'device-B', timestamp: '2025-07-02T04:00:00Z' });
    insertEvent(db, { event_name: 'browse', device_id: 'device-B', timestamp: '2025-07-02T05:00:00Z' });

    // Link device-A to user-Z
    insertEvent(db, { event_name: 'login', device_id: 'device-A', user_id: 'user-Z', timestamp: '2025-07-02T20:00:00Z' });
    linkIdentity(db, 'device-A', 'user-Z');

    // Link device-B to same user-Z
    insertEvent(db, { event_name: 'login', device_id: 'device-B', user_id: 'user-Z', timestamp: '2025-07-02T21:00:00Z' });
    linkIdentity(db, 'device-B', 'user-Z');

    // Query events for user-Z
    const events = getEventsForUser(db, 'user-Z');
    // 2 (device-A anon) + 3 (device-B anon) + 1 (link A) + 1 (link B) = 7
    expect(events.length).toBe(7);
  });

  test('Device collision rejection: device already mapped to different user is rejected', () => {
    // Link device-C to user-P
    linkIdentity(db, 'device-C', 'user-P');

    // Attempt to link device-C to user-Q — should throw
    expect(() => linkIdentity(db, 'device-C', 'user-Q')).toThrow();
  });

  test('Unidentified device: device with no mapping returns only its own events', () => {
    // Anonymous events for device-D (no mapping)
    insertEvent(db, { event_name: 'browse', device_id: 'device-D', timestamp: '2025-07-04T01:00:00Z' });
    insertEvent(db, { event_name: 'browse', device_id: 'device-D', timestamp: '2025-07-04T02:00:00Z' });
    insertEvent(db, { event_name: 'browse', device_id: 'device-D', timestamp: '2025-07-04T03:00:00Z' });

    // Also add events for other devices
    insertEvent(db, { event_name: 'browse', device_id: 'device-E', timestamp: '2025-07-04T04:00:00Z' });

    // Resolve device-D — no mapping exists
    const resolved = resolveIdentity(db, 'device-D');
    expect(resolved).toBe('device-D');

    // Query by device_id directly
    const result = db.exec(
      `SELECT * FROM events WHERE device_id = ?`,
      ['device-D'],
    );
    expect(result[0].values.length).toBe(3);
  });
});
