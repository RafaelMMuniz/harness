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

function aggregateProperty(database: Database, opts: {
  event_name: string;
  measure: 'sum' | 'avg' | 'min' | 'max';
  property: string;
  start_date: string;
  end_date: string;
}) {
  const endFilter = opts.end_date + 'T23:59:59.999Z';
  const result = database.exec(
    `SELECT SUBSTR(e.timestamp, 1, 10) AS bucket, e.properties
     FROM events e
     WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ? AND e.properties IS NOT NULL
     ORDER BY bucket`,
    [opts.event_name, opts.start_date, endFilter],
  );

  const bucketValues = new Map<string, number[]>();
  if (result.length > 0) {
    for (const row of result[0].values) {
      const bucket = row[0] as string;
      try {
        const props = JSON.parse(row[1] as string);
        const val = props[opts.property];
        if (typeof val === 'number') {
          if (!bucketValues.has(bucket)) bucketValues.set(bucket, []);
          bucketValues.get(bucket)!.push(val);
        }
      } catch { /* skip */ }
    }
  }

  const data: Array<{ date: string; value: number }> = [];
  for (const [date, vals] of bucketValues) {
    let value = 0;
    if (vals.length > 0) {
      switch (opts.measure) {
        case 'sum': value = vals.reduce((a, b) => a + b, 0); break;
        case 'avg': value = vals.reduce((a, b) => a + b, 0) / vals.length; break;
        case 'min': value = Math.min(...vals); break;
        case 'max': value = Math.max(...vals); break;
      }
    }
    data.push({ date, value });
  }
  return data;
}

describe('Numeric aggregations', () => {
  beforeAll(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  beforeEach(() => {
    db.run('DELETE FROM events');
    db.run('DELETE FROM identity_mappings');
  });

  test('Sum aggregation: sums purchase amounts by day', () => {
    // Day 1: amounts 10, 20, 30 → sum = 60
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd1', timestamp: '2025-06-10T08:00:00Z', properties: { amount: 10 } });
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd2', timestamp: '2025-06-10T09:00:00Z', properties: { amount: 20 } });
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd3', timestamp: '2025-06-10T10:00:00Z', properties: { amount: 30 } });
    // Day 2: amounts 50 → sum = 50
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd4', timestamp: '2025-06-11T08:00:00Z', properties: { amount: 50 } });
    // Day 3: amounts 15, 25 → sum = 40
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd5', timestamp: '2025-06-12T08:00:00Z', properties: { amount: 15 } });
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd6', timestamp: '2025-06-12T09:00:00Z', properties: { amount: 25 } });

    const data = aggregateProperty(db, {
      event_name: 'Purchase Completed',
      measure: 'sum',
      property: 'amount',
      start_date: '2025-06-10',
      end_date: '2025-06-12',
    });

    expect(data.find(d => d.date === '2025-06-10')?.value).toBe(60);
    expect(data.find(d => d.date === '2025-06-11')?.value).toBe(50);
    expect(data.find(d => d.date === '2025-06-12')?.value).toBe(40);
  });

  test('Average aggregation: averages purchase amounts by day', () => {
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd1', timestamp: '2025-06-10T08:00:00Z', properties: { amount: 10 } });
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd2', timestamp: '2025-06-10T09:00:00Z', properties: { amount: 20 } });
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd3', timestamp: '2025-06-10T10:00:00Z', properties: { amount: 30 } });

    const data = aggregateProperty(db, {
      event_name: 'Purchase Completed',
      measure: 'avg',
      property: 'amount',
      start_date: '2025-06-10',
      end_date: '2025-06-10',
    });

    expect(data.length).toBe(1);
    expect(data[0].value).toBe(20); // (10 + 20 + 30) / 3
  });

  test('Non-numeric property is detectable', () => {
    insertEvent(db, { event_name: 'Purchase Completed', device_id: 'd1', timestamp: '2025-06-10T08:00:00Z', properties: { url: '/home' } });

    // Check if 'url' has any numeric values
    const result = db.exec(
      `SELECT properties FROM events WHERE event_name = ? AND properties IS NOT NULL LIMIT 100`,
      ['Purchase Completed'],
    );

    let foundNumeric = false;
    if (result.length > 0) {
      for (const row of result[0].values) {
        const props = JSON.parse(row[0] as string);
        if ('url' in props && typeof props['url'] === 'number') {
          foundNumeric = true;
          break;
        }
      }
    }
    expect(foundNumeric).toBe(false);
  });
});
