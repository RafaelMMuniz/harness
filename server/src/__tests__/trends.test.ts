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
  properties?: Record<string, unknown>;
}) {
  database.run(
    `INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)`,
    [
      event.event_name,
      event.device_id ?? null,
      event.user_id ?? null,
      event.timestamp,
      event.properties ? JSON.stringify(event.properties) : null,
    ],
  );
}

function linkIdentity(database: Database, deviceId: string, userId: string) {
  database.run(
    `INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)`,
    [deviceId, userId, new Date().toISOString()],
  );
}

function bucketExpr(granularity: 'day' | 'week'): string {
  if (granularity === 'day') return `SUBSTR(e.timestamp, 1, 10)`;
  return `DATE(SUBSTR(e.timestamp, 1, 10), '-' || CASE CAST(STRFTIME('%w', SUBSTR(e.timestamp, 1, 10)) AS INTEGER) WHEN 0 THEN 6 ELSE CAST(STRFTIME('%w', SUBSTR(e.timestamp, 1, 10)) AS INTEGER) - 1 END || ' days')`;
}

function generateDayBuckets(start: string, end: string): string[] {
  const buckets: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (current <= last) {
    buckets.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return buckets;
}

function generateWeekBuckets(start: string, end: string): string[] {
  const buckets: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const dayOfWeek = current.getUTCDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  current.setUTCDate(current.getUTCDate() - offset);
  const last = new Date(end + 'T00:00:00Z');
  while (current <= last) {
    buckets.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return buckets;
}

function queryTrend(database: Database, opts: {
  event_name: string;
  start_date: string;
  end_date: string;
  granularity: 'day' | 'week';
}) {
  const bucket = bucketExpr(opts.granularity);
  const endFilter = opts.end_date + 'T23:59:59.999Z';

  const countResult = database.exec(
    `SELECT ${bucket} AS bucket, COUNT(*) AS total_count
     FROM events e
     WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
     GROUP BY bucket ORDER BY bucket`,
    [opts.event_name, opts.start_date, endFilter],
  );

  const uniqueResult = database.exec(
    `SELECT ${bucket} AS bucket,
            COUNT(DISTINCT COALESCE(im.user_id, e.user_id, e.device_id)) AS unique_users
     FROM events e
     LEFT JOIN identity_mappings im ON e.device_id = im.device_id
     WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
     GROUP BY bucket ORDER BY bucket`,
    [opts.event_name, opts.start_date, endFilter],
  );

  const allBuckets = opts.granularity === 'day'
    ? generateDayBuckets(opts.start_date, opts.end_date)
    : generateWeekBuckets(opts.start_date, opts.end_date);

  const countMap = new Map<string, number>();
  const uniqueMap = new Map<string, number>();

  if (countResult.length > 0) {
    for (const row of countResult[0].values) {
      countMap.set(row[0] as string, row[1] as number);
    }
  }
  if (uniqueResult.length > 0) {
    for (const row of uniqueResult[0].values) {
      uniqueMap.set(row[0] as string, row[1] as number);
    }
  }

  return allBuckets.map((date) => ({
    date,
    total_count: countMap.get(date) ?? 0,
    unique_users: uniqueMap.get(date) ?? 0,
  }));
}

describe('Trend aggregation', () => {
  beforeAll(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  beforeEach(() => {
    db.run('DELETE FROM events');
    db.run('DELETE FROM identity_mappings');
  });

  test('Daily bucketing: events across 3 days grouped correctly', () => {
    // Day 1: 2 events, Day 2: 3 events, Day 3: 1 event
    insertEvent(db, { event_name: 'click', device_id: 'd1', timestamp: '2025-06-10T08:00:00Z' });
    insertEvent(db, { event_name: 'click', device_id: 'd2', timestamp: '2025-06-10T09:00:00Z' });
    insertEvent(db, { event_name: 'click', device_id: 'd3', timestamp: '2025-06-11T08:00:00Z' });
    insertEvent(db, { event_name: 'click', device_id: 'd4', timestamp: '2025-06-11T09:00:00Z' });
    insertEvent(db, { event_name: 'click', device_id: 'd5', timestamp: '2025-06-11T10:00:00Z' });
    insertEvent(db, { event_name: 'click', device_id: 'd6', timestamp: '2025-06-12T08:00:00Z' });

    const data = queryTrend(db, {
      event_name: 'click',
      start_date: '2025-06-10',
      end_date: '2025-06-12',
      granularity: 'day',
    });

    expect(data.length).toBe(3);
    expect(data[0].total_count).toBe(2);
    expect(data[1].total_count).toBe(3);
    expect(data[2].total_count).toBe(1);
  });

  test('Weekly bucketing: events across 2 weeks grouped correctly', () => {
    // Week 1 (Mon Jun 9 - Sun Jun 15): 3 events
    insertEvent(db, { event_name: 'view', device_id: 'd1', timestamp: '2025-06-10T08:00:00Z' });
    insertEvent(db, { event_name: 'view', device_id: 'd2', timestamp: '2025-06-11T08:00:00Z' });
    insertEvent(db, { event_name: 'view', device_id: 'd3', timestamp: '2025-06-12T08:00:00Z' });
    // Week 2 (Mon Jun 16 - Sun Jun 22): 2 events
    insertEvent(db, { event_name: 'view', device_id: 'd4', timestamp: '2025-06-17T08:00:00Z' });
    insertEvent(db, { event_name: 'view', device_id: 'd5', timestamp: '2025-06-18T08:00:00Z' });

    const data = queryTrend(db, {
      event_name: 'view',
      start_date: '2025-06-09',
      end_date: '2025-06-22',
      granularity: 'week',
    });

    expect(data.length).toBeGreaterThanOrEqual(2);
    // First week bucket should have 3
    const week1 = data.find(d => d.date === '2025-06-09');
    expect(week1?.total_count).toBe(3);
    // Second week bucket should have 2
    const week2 = data.find(d => d.date === '2025-06-16');
    expect(week2?.total_count).toBe(2);
  });

  test('Unique users with identity resolution: device mapped to user counts as one', () => {
    // 5 events from device-A (anonymous)
    for (let i = 0; i < 5; i++) {
      insertEvent(db, { event_name: 'action', device_id: 'device-A', timestamp: `2025-06-10T0${i + 1}:00:00Z` });
    }
    // Create identity mapping: device-A → user-B
    linkIdentity(db, 'device-A', 'user-B');
    // 3 more events from user-B directly
    for (let i = 0; i < 3; i++) {
      insertEvent(db, { event_name: 'action', user_id: 'user-B', timestamp: `2025-06-10T1${i}:00:00Z` });
    }

    const data = queryTrend(db, {
      event_name: 'action',
      start_date: '2025-06-10',
      end_date: '2025-06-10',
      granularity: 'day',
    });

    expect(data.length).toBe(1);
    expect(data[0].total_count).toBe(8);
    // device-A resolves to user-B, so unique_users should be 1
    expect(data[0].unique_users).toBe(1);
  });

  test('Zero-fill gaps: days without events have total_count 0', () => {
    // Events only on day 1 and day 5 of a 7-day range
    insertEvent(db, { event_name: 'click', device_id: 'd1', timestamp: '2025-06-10T08:00:00Z' });
    insertEvent(db, { event_name: 'click', device_id: 'd2', timestamp: '2025-06-14T08:00:00Z' });

    const data = queryTrend(db, {
      event_name: 'click',
      start_date: '2025-06-10',
      end_date: '2025-06-16',
      granularity: 'day',
    });

    expect(data.length).toBe(7);
    expect(data[0].total_count).toBe(1); // June 10
    expect(data[1].total_count).toBe(0); // June 11
    expect(data[2].total_count).toBe(0); // June 12
    expect(data[3].total_count).toBe(0); // June 13
    expect(data[4].total_count).toBe(1); // June 14
    expect(data[5].total_count).toBe(0); // June 15
    expect(data[6].total_count).toBe(0); // June 16
  });

  test('Date range filtering: events outside range are excluded', () => {
    insertEvent(db, { event_name: 'click', device_id: 'd1', timestamp: '2025-06-09T08:00:00Z' }); // before range
    insertEvent(db, { event_name: 'click', device_id: 'd2', timestamp: '2025-06-10T08:00:00Z' }); // in range
    insertEvent(db, { event_name: 'click', device_id: 'd3', timestamp: '2025-06-11T08:00:00Z' }); // in range
    insertEvent(db, { event_name: 'click', device_id: 'd4', timestamp: '2025-06-13T08:00:00Z' }); // after range

    const data = queryTrend(db, {
      event_name: 'click',
      start_date: '2025-06-10',
      end_date: '2025-06-12',
      granularity: 'day',
    });

    const totalInRange = data.reduce((sum, d) => sum + d.total_count, 0);
    expect(totalInRange).toBe(2);
  });
});
