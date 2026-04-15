import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';

const router = Router();

// ── Schema ───────────────────────────────────────────────────────────

const trendsQuerySchema = z.object({
  event_name: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  granularity: z.enum(['day', 'week']).default('day'),
  measure: z.enum(['total_count', 'unique_users', 'sum', 'avg', 'min', 'max']).default('total_count'),
  property: z.string().optional(),
  breakdown_by: z.string().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Generate all dates (YYYY-MM-DD) in [start, end] inclusive.
 */
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

/**
 * Generate weekly bucket labels (Monday-start weeks) in [start, end].
 */
function generateWeekBuckets(start: string, end: string): string[] {
  const buckets: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  // Roll back to Monday
  const dayOfWeek = current.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  current.setUTCDate(current.getUTCDate() - offsetToMonday);

  const last = new Date(end + 'T00:00:00Z');
  while (current <= last) {
    buckets.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return buckets;
}

/**
 * SQL expression to bucket a timestamp column into day or week.
 */
function bucketExpr(granularity: 'day' | 'week'): string {
  if (granularity === 'day') {
    return `SUBSTR(e.timestamp, 1, 10)`;
  }
  // ISO week start (Monday): subtract (day_of_week - 1) days
  // SQLite strftime %w: 0=Sunday..6=Saturday
  // Monday offset: if %w=0 → subtract 6, else subtract (%w - 1)
  return `DATE(SUBSTR(e.timestamp, 1, 10), '-' || CASE CAST(STRFTIME('%w', SUBSTR(e.timestamp, 1, 10)) AS INTEGER) WHEN 0 THEN 6 ELSE CAST(STRFTIME('%w', SUBSTR(e.timestamp, 1, 10)) AS INTEGER) - 1 END || ' days')`;
}

// ── GET /api/trends ──────────────────────────────────────────────────

router.get('/', (req: Request, res: Response): void => {
  const parsed = trendsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const {
    event_name: eventName,
    granularity,
    measure,
    property,
    breakdown_by: breakdownBy,
  } = parsed.data;

  const startDate = parsed.data.start_date ?? defaultStartDate();
  const endDate = parsed.data.end_date ?? defaultEndDate();

  const db = getDb();

  // Validate: numeric measures require a property
  if (['sum', 'avg', 'min', 'max'].includes(measure) && !property) {
    res.status(400).json({ error: `measure "${measure}" requires a property parameter` });
    return;
  }

  // Validate: numeric property actually has numeric values
  if (['sum', 'avg', 'min', 'max'].includes(measure) && property) {
    const sampleResult = db.exec(
      `SELECT properties FROM events
       WHERE event_name = ? AND properties IS NOT NULL
       LIMIT 100`,
      [eventName]
    );

    if (sampleResult.length > 0) {
      let foundNumeric = false;
      for (const row of sampleResult[0].values) {
        try {
          const props = JSON.parse(row[0] as string);
          if (property in props && typeof props[property] === 'number') {
            foundNumeric = true;
            break;
          }
        } catch {
          // skip malformed
        }
      }
      if (!foundNumeric) {
        res.status(400).json({ error: `property "${property}" does not contain numeric values` });
        return;
      }
    }
  }

  const bucket = bucketExpr(granularity);
  const allBuckets = granularity === 'day'
    ? generateDayBuckets(startDate, endDate)
    : generateWeekBuckets(startDate, endDate);

  // Extend end_date filter to cover the full day
  const endDateFilter = endDate + 'T23:59:59.999Z';

  // ── Without breakdown ────────────────────────────────────────────

  if (!breakdownBy) {
    if (measure === 'total_count' || measure === 'unique_users') {
      // Always return both total_count and unique_users for these measures
      const countResult = db.exec(
        `SELECT ${bucket} AS bucket, COUNT(*) AS value
         FROM events e
         WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
         GROUP BY bucket
         ORDER BY bucket`,
        [eventName, startDate, endDateFilter]
      );

      const uniqueResult = db.exec(
        `SELECT ${bucket} AS bucket,
                COUNT(DISTINCT COALESCE(im.user_id, e.user_id, e.device_id)) AS value
         FROM events e
         LEFT JOIN identity_mappings im ON e.device_id = im.device_id
         WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
         GROUP BY bucket
         ORDER BY bucket`,
        [eventName, startDate, endDateFilter]
      );

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

      const data = allBuckets.map((date) => ({
        date,
        total_count: countMap.get(date) ?? 0,
        unique_users: uniqueMap.get(date) ?? 0,
      }));

      res.json({ event_name: eventName, granularity, start_date: startDate, end_date: endDate, data });
      return;
    }

    // Numeric measure (sum, avg, min, max)
    // We need to extract the property value from the JSON properties column.
    // sql.js doesn't have json_extract, so we fetch rows and compute in JS.
    const result = db.exec(
      `SELECT ${bucket} AS bucket, e.properties
       FROM events e
       WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
         AND e.properties IS NOT NULL
       ORDER BY bucket`,
      [eventName, startDate, endDateFilter]
    );

    // Accumulate per bucket
    const bucketValues = new Map<string, number[]>();
    if (result.length > 0) {
      for (const row of result[0].values) {
        const b = row[0] as string;
        try {
          const props = JSON.parse(row[1] as string);
          const val = props[property!];
          if (typeof val === 'number') {
            if (!bucketValues.has(b)) bucketValues.set(b, []);
            bucketValues.get(b)!.push(val);
          }
        } catch {
          // skip malformed
        }
      }
    }

    const data = allBuckets.map((date) => {
      const vals = bucketValues.get(date);
      let value = 0;
      if (vals && vals.length > 0) {
        switch (measure) {
          case 'sum': value = vals.reduce((a, b) => a + b, 0); break;
          case 'avg': value = vals.reduce((a, b) => a + b, 0) / vals.length; break;
          case 'min': value = Math.min(...vals); break;
          case 'max': value = Math.max(...vals); break;
        }
      }
      return { date, value };
    });

    res.json({ event_name: eventName, granularity, start_date: startDate, end_date: endDate, data });
    return;
  }

  // ── With breakdown ───────────────────────────────────────────────

  // Fetch all matching events with properties
  const rawResult = db.exec(
    measure === 'unique_users'
      ? `SELECT ${bucket} AS bucket, e.properties,
                COALESCE(im.user_id, e.user_id, e.device_id) AS resolved_id
         FROM events e
         LEFT JOIN identity_mappings im ON e.device_id = im.device_id
         WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
         ORDER BY bucket`
      : `SELECT ${bucket} AS bucket, e.properties
         FROM events e
         WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
         ORDER BY bucket`,
    [eventName, startDate, endDateFilter]
  );

  // Parse breakdown keys from properties
  type BucketKey = string; // "date|breakdownValue"
  const counterMap = new Map<string, Map<string, number>>(); // breakdownValue → { date → count }
  const uniqueMap = new Map<string, Map<string, Set<string>>>(); // for unique_users
  const numericMap = new Map<string, Map<string, number[]>>(); // for numeric measures

  if (rawResult.length > 0) {
    const cols = rawResult[0].columns;
    const bucketIdx = cols.indexOf('bucket');
    const propsIdx = cols.indexOf('properties');
    const resolvedIdx = cols.indexOf('resolved_id');

    for (const row of rawResult[0].values) {
      const b = row[bucketIdx] as string;
      let breakdownValue = '__other__';

      try {
        const props = row[propsIdx] ? JSON.parse(row[propsIdx] as string) : {};
        if (breakdownBy in props) {
          breakdownValue = String(props[breakdownBy]);
        }
      } catch {
        // skip malformed
      }

      if (measure === 'total_count') {
        if (!counterMap.has(breakdownValue)) counterMap.set(breakdownValue, new Map());
        const m = counterMap.get(breakdownValue)!;
        m.set(b, (m.get(b) ?? 0) + 1);
      } else if (measure === 'unique_users') {
        if (!uniqueMap.has(breakdownValue)) uniqueMap.set(breakdownValue, new Map());
        const m = uniqueMap.get(breakdownValue)!;
        if (!m.has(b)) m.set(b, new Set());
        m.get(b)!.add(row[resolvedIdx] as string);
      } else {
        // numeric measures
        try {
          const props = row[propsIdx] ? JSON.parse(row[propsIdx] as string) : {};
          const val = props[property!];
          if (typeof val === 'number') {
            if (!numericMap.has(breakdownValue)) numericMap.set(breakdownValue, new Map());
            const m = numericMap.get(breakdownValue)!;
            if (!m.has(b)) m.set(b, []);
            m.get(b)!.push(val);
          }
        } catch {
          // skip
        }
      }
    }
  }

  // Determine top 5 breakdown keys by total volume
  let allKeys: string[];
  if (measure === 'total_count') {
    allKeys = [...counterMap.entries()]
      .map(([key, m]) => ({ key, total: [...m.values()].reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .map((x) => x.key);
  } else if (measure === 'unique_users') {
    allKeys = [...uniqueMap.entries()]
      .map(([key, m]) => {
        const allUsers = new Set<string>();
        for (const s of m.values()) for (const u of s) allUsers.add(u);
        return { key, total: allUsers.size };
      })
      .sort((a, b) => b.total - a.total)
      .map((x) => x.key);
  } else {
    allKeys = [...numericMap.entries()]
      .map(([key, m]) => ({ key, total: [...m.values()].reduce((a, b) => a + b.length, 0) }))
      .sort((a, b) => b.total - a.total)
      .map((x) => x.key);
  }

  const topKeys = allKeys.slice(0, 5);
  const otherKeys = allKeys.slice(5);

  // Build series
  const series: Array<{ key: string; data: Array<{ date: string; value: number }> }> = [];

  for (const key of topKeys) {
    const data = allBuckets.map((date) => {
      let value = 0;
      if (measure === 'total_count') {
        value = counterMap.get(key)?.get(date) ?? 0;
      } else if (measure === 'unique_users') {
        value = uniqueMap.get(key)?.get(date)?.size ?? 0;
      } else {
        const vals = numericMap.get(key)?.get(date);
        if (vals && vals.length > 0) {
          switch (measure) {
            case 'sum': value = vals.reduce((a, b) => a + b, 0); break;
            case 'avg': value = vals.reduce((a, b) => a + b, 0) / vals.length; break;
            case 'min': value = Math.min(...vals); break;
            case 'max': value = Math.max(...vals); break;
          }
        }
      }
      return { date, value };
    });
    series.push({ key, data });
  }

  // Aggregate __other__ from remaining keys
  if (otherKeys.length > 0) {
    const data = allBuckets.map((date) => {
      let value = 0;
      if (measure === 'total_count') {
        for (const k of otherKeys) value += counterMap.get(k)?.get(date) ?? 0;
      } else if (measure === 'unique_users') {
        const combined = new Set<string>();
        for (const k of otherKeys) {
          const s = uniqueMap.get(k)?.get(date);
          if (s) for (const u of s) combined.add(u);
        }
        value = combined.size;
      } else {
        const allVals: number[] = [];
        for (const k of otherKeys) {
          const vals = numericMap.get(k)?.get(date);
          if (vals) allVals.push(...vals);
        }
        if (allVals.length > 0) {
          switch (measure) {
            case 'sum': value = allVals.reduce((a, b) => a + b, 0); break;
            case 'avg': value = allVals.reduce((a, b) => a + b, 0) / allVals.length; break;
            case 'min': value = Math.min(...allVals); break;
            case 'max': value = Math.max(...allVals); break;
          }
        }
      }
      return { date, value };
    });
    series.push({ key: '__other__', data });
  }

  res.json({
    event_name: eventName,
    granularity,
    start_date: startDate,
    end_date: endDate,
    series,
  });
});

export default router;
