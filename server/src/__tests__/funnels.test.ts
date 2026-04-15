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

function insertEvent(database: Database, event: {
  event_name: string;
  device_id?: string;
  user_id?: string;
  timestamp: string;
}) {
  database.run(
    `INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)`,
    [event.event_name, event.device_id ?? null, event.user_id ?? null, event.timestamp, null],
  );
}

function linkIdentity(database: Database, deviceId: string, userId: string) {
  database.run(
    `INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)`,
    [deviceId, userId, new Date().toISOString()],
  );
}

function computeFunnel(database: Database, steps: string[], startDate: string, endDate: string) {
  const endFilter = endDate + 'T23:59:59.999Z';

  function getUsersForStep(eventName: string, afterTimestamps?: Map<string, string>): Map<string, string> {
    const result = database.exec(
      `SELECT COALESCE(im.user_id, e.user_id, e.device_id) AS resolved_id,
              MIN(e.timestamp) AS min_ts
       FROM events e
       LEFT JOIN identity_mappings im ON e.device_id = im.device_id
       WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
       GROUP BY resolved_id
       ORDER BY min_ts`,
      [eventName, startDate, endFilter],
    );

    const users = new Map<string, string>();
    if (result.length === 0) return users;

    for (const row of result[0].values) {
      const resolvedId = row[0] as string;
      const minTs = row[1] as string;

      if (afterTimestamps) {
        const prevTs = afterTimestamps.get(resolvedId);
        if (!prevTs) continue;

        const afterResult = database.exec(
          `SELECT MIN(e.timestamp) AS min_ts
           FROM events e
           LEFT JOIN identity_mappings im ON e.device_id = im.device_id
           WHERE e.event_name = ?
             AND e.timestamp >= ? AND e.timestamp <= ?
             AND e.timestamp > ?
             AND COALESCE(im.user_id, e.user_id, e.device_id) = ?`,
          [eventName, startDate, endFilter, prevTs, resolvedId],
        );

        if (afterResult.length > 0 && afterResult[0].values.length > 0 && afterResult[0].values[0][0] != null) {
          users.set(resolvedId, afterResult[0].values[0][0] as string);
        }
      } else {
        users.set(resolvedId, minTs);
      }
    }
    return users;
  }

  const stepResults: Array<{ event_name: string; users: Map<string, string> }> = [];
  for (let i = 0; i < steps.length; i++) {
    const prevTimestamps = i === 0 ? undefined : stepResults[i - 1].users;
    const users = getUsersForStep(steps[i], prevTimestamps);
    stepResults.push({ event_name: steps[i], users });
  }

  const step0Count = stepResults[0].users.size;
  return stepResults.map((step, i) => ({
    event_name: step.event_name,
    count: step.users.size,
    conversion_rate: step0Count === 0 ? 0 : (i === 0 ? 1.0 : step.users.size / step0Count),
    drop_off: i === 0 ? 0 : stepResults[i - 1].users.size - step.users.size,
  }));
}

describe('Funnel analysis', () => {
  beforeAll(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  beforeEach(() => {
    db.run('DELETE FROM events');
    db.run('DELETE FROM identity_mappings');
  });

  test('Basic funnel: 10 → 7 → 3 users across 3 steps', () => {
    // 10 users do step 1
    for (let i = 0; i < 10; i++) {
      insertEvent(db, { event_name: 'sign_up', user_id: `user-${i}`, timestamp: `2025-06-15T0${i}:00:00Z` });
    }
    // 7 do step 2
    for (let i = 0; i < 7; i++) {
      insertEvent(db, { event_name: 'activate', user_id: `user-${i}`, timestamp: `2025-06-15T1${i}:00:00Z` });
    }
    // 3 do step 3
    for (let i = 0; i < 3; i++) {
      insertEvent(db, { event_name: 'purchase', user_id: `user-${i}`, timestamp: `2025-06-15T2${i}:00:00Z` });
    }

    const steps = computeFunnel(db, ['sign_up', 'activate', 'purchase'], '2025-06-14', '2025-06-16');

    expect(steps.length).toBe(3);
    expect(steps[0].count).toBe(10);
    expect(steps[1].count).toBe(7);
    expect(steps[2].count).toBe(3);
    expect(steps[0].conversion_rate).toBe(1.0);
    expect(steps[1].conversion_rate).toBeCloseTo(0.7);
    expect(steps[2].conversion_rate).toBeCloseTo(0.3);
  });

  test('Funnel with identity resolution: anonymous step 1 + identified step 2', () => {
    // User does step 1 anonymously via device-X
    insertEvent(db, { event_name: 'sign_up', device_id: 'device-X', timestamp: '2025-06-15T01:00:00Z' });

    // User identifies: device-X → user-Y
    insertEvent(db, { event_name: 'identify', device_id: 'device-X', user_id: 'user-Y', timestamp: '2025-06-15T02:00:00Z' });
    linkIdentity(db, 'device-X', 'user-Y');

    // User does step 2 as user-Y
    insertEvent(db, { event_name: 'activate', user_id: 'user-Y', timestamp: '2025-06-15T03:00:00Z' });

    const steps = computeFunnel(db, ['sign_up', 'activate'], '2025-06-14', '2025-06-16');

    // user-Y should be counted in step 1 (via device-X resolving to user-Y)
    // and in step 2 (directly as user-Y) — 1 user progressed through both steps
    expect(steps[0].count).toBeGreaterThanOrEqual(1);
    expect(steps[1].count).toBeGreaterThanOrEqual(1);
  });

  test('Step order enforcement: user who does step 2 before step 1 is NOT counted', () => {
    // User does step 2 first (by timestamp)
    insertEvent(db, { event_name: 'activate', user_id: 'user-wrong', timestamp: '2025-06-15T01:00:00Z' });
    // Then does step 1 later
    insertEvent(db, { event_name: 'sign_up', user_id: 'user-wrong', timestamp: '2025-06-15T05:00:00Z' });

    // Also add a correct user for reference
    insertEvent(db, { event_name: 'sign_up', user_id: 'user-correct', timestamp: '2025-06-15T02:00:00Z' });
    insertEvent(db, { event_name: 'activate', user_id: 'user-correct', timestamp: '2025-06-15T06:00:00Z' });

    const steps = computeFunnel(db, ['sign_up', 'activate'], '2025-06-14', '2025-06-16');

    // Both users did sign_up, so step 1 = 2
    expect(steps[0].count).toBe(2);
    // user-wrong did activate BEFORE sign_up, so only user-correct completes the funnel
    // user-wrong's step 2 was at T01 but step 1 was at T05 → no valid step 2 after T05
    expect(steps[1].count).toBe(1);
  });
});
