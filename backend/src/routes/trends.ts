import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { getResolvedIdentityExpression } from '../identity.js';

const router = Router();

const trendsQuerySchema = z.object({
  event_name: z.string().min(1, 'event_name is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  granularity: z.enum(['day', 'week']).default('day'),
  measure: z
    .enum(['total_count', 'unique_users', 'sum', 'avg', 'min', 'max'])
    .default('total_count'),
  property: z.string().optional(),
  breakdown_by: z.string().optional(),
});

/**
 * Generate all date buckets between start and end dates.
 */
function generateDateBuckets(
  startDate: string,
  endDate: string,
  granularity: 'day' | 'week'
): string[] {
  const buckets: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (granularity === 'day') {
    const current = new Date(start);
    while (current <= end) {
      buckets.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  } else {
    // Weekly: start from the Monday on or before start_date
    const current = new Date(start);
    const dayOfWeek = current.getUTCDay();
    // Adjust to Monday (day 1). If Sunday (0), go back 6 days.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    current.setUTCDate(current.getUTCDate() - daysToMonday);

    while (current <= end) {
      buckets.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 7);
    }
  }

  return buckets;
}

/**
 * GET /api/trends - Time-bucketed event aggregation
 */
router.get('/api/trends', (req: Request, res: Response): void => {
  const parsed = trendsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  const db = getDb();
  const { event_name, granularity, measure, property, breakdown_by } = parsed.data;

  // Default date range: last 30 days
  const endDate = parsed.data.end_date || new Date().toISOString().slice(0, 10);
  const startDate =
    parsed.data.start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Validate numeric measures require property
  const numericMeasures = ['sum', 'avg', 'min', 'max'];
  if (numericMeasures.includes(measure) && !property) {
    res.status(400).json({
      error: `property is required when measure is ${measure}`,
    });
    return;
  }

  // Validate property is numeric if numeric measure
  if (numericMeasures.includes(measure) && property) {
    const sampleRows = db
      .prepare(
        `SELECT json_extract(properties, '$.' || ?) as val
         FROM events
         WHERE event_name = ? AND properties IS NOT NULL
         AND json_extract(properties, '$.' || ?) IS NOT NULL
         LIMIT 100`
      )
      .all(property, event_name, property) as Array<{ val: unknown }>;

    if (sampleRows.length === 0) {
      res.status(400).json({
        error: `Property '${property}' not found in events of type '${event_name}'`,
      });
      return;
    }

    const allNumeric = sampleRows.every((r) => {
      const v = r.val;
      return typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)));
    });

    if (!allNumeric) {
      res.status(400).json({
        error: `Property '${property}' is not numeric`,
      });
      return;
    }
  }

  // Time bucket expression
  const dateBucket =
    granularity === 'day'
      ? `substr(e.timestamp, 1, 10)`
      : `date(e.timestamp, 'weekday 0', '-6 days')`;

  const resolvedId = getResolvedIdentityExpression();
  const allBuckets = generateDateBuckets(startDate, endDate, granularity);

  // --- Without breakdown ---
  if (!breakdown_by) {
    if (measure === 'total_count' || measure === 'unique_users') {
      const rows = db
        .prepare(
          `SELECT ${dateBucket} AS date,
                  COUNT(*) AS total_count,
                  COUNT(DISTINCT ${resolvedId}) AS unique_users
           FROM events e
           WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < date(?, '+1 day')
           GROUP BY date
           ORDER BY date ASC`
        )
        .all(event_name, startDate, endDate) as Array<{
        date: string;
        total_count: number;
        unique_users: number;
      }>;

      const rowMap = new Map(rows.map((r) => [r.date, r]));
      const data = allBuckets.map((date) => ({
        date,
        total_count: rowMap.get(date)?.total_count ?? 0,
        unique_users: rowMap.get(date)?.unique_users ?? 0,
      }));

      res.json({ data });
      return;
    }

    // Numeric aggregation
    const aggFn = measure.toUpperCase();
    const rows = db
      .prepare(
        `SELECT ${dateBucket} AS date,
                ${aggFn}(CAST(json_extract(e.properties, '$.' || ?) AS REAL)) AS value
         FROM events e
         WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < date(?, '+1 day')
           AND json_extract(e.properties, '$.' || ?) IS NOT NULL
         GROUP BY date
         ORDER BY date ASC`
      )
      .all(property, event_name, startDate, endDate, property) as Array<{
      date: string;
      value: number | null;
    }>;

    const rowMap = new Map(rows.map((r) => [r.date, r]));
    const nullDefault = measure === 'sum' ? 0 : null;
    const data = allBuckets.map((date) => ({
      date,
      value: rowMap.has(date) ? rowMap.get(date)!.value : nullDefault,
    }));

    res.json({ data });
    return;
  }

  // --- With breakdown ---
  // First: determine top 5 breakdown values by total volume
  const topValues = db
    .prepare(
      `SELECT json_extract(e.properties, '$.' || ?) AS bk_value, COUNT(*) AS cnt
       FROM events e
       WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < date(?, '+1 day')
         AND json_extract(e.properties, '$.' || ?) IS NOT NULL
       GROUP BY bk_value
       ORDER BY cnt DESC
       LIMIT 5`
    )
    .all(breakdown_by, event_name, startDate, endDate, breakdown_by) as Array<{
    bk_value: string;
    cnt: number;
  }>;

  const topKeys = topValues.map((r) => String(r.bk_value));

  if (topKeys.length === 0) {
    res.json({ series: [] });
    return;
  }

  // Build CASE expression for bucketing breakdown values
  const placeholders = topKeys.map(() => '?').join(', ');
  const bkExpr = `CASE WHEN CAST(json_extract(e.properties, '$.' || ?) AS TEXT) IN (${placeholders}) THEN CAST(json_extract(e.properties, '$.' || ?) AS TEXT) ELSE '__other__' END`;

  let valueExpr: string;
  let extraParams: unknown[] = [];

  if (measure === 'total_count') {
    valueExpr = 'COUNT(*)';
  } else if (measure === 'unique_users') {
    valueExpr = `COUNT(DISTINCT ${resolvedId})`;
  } else {
    const aggFn = measure.toUpperCase();
    valueExpr = `${aggFn}(CAST(json_extract(e.properties, '$.' || ?) AS REAL))`;
    extraParams = [property!];
  }

  const breakdownRows = db
    .prepare(
      `SELECT ${dateBucket} AS date,
              ${bkExpr} AS bk_key,
              ${valueExpr} AS value
       FROM events e
       WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < date(?, '+1 day')
         AND json_extract(e.properties, '$.' || ?) IS NOT NULL
       GROUP BY date, bk_key
       ORDER BY date ASC`
    )
    .all(
      // bkExpr params
      breakdown_by,
      ...topKeys,
      breakdown_by,
      // valueExpr params (for numeric measures)
      ...extraParams,
      // WHERE params
      event_name,
      startDate,
      endDate,
      breakdown_by
    ) as Array<{ date: string; bk_key: string; value: number }>;

  // Organize into series
  const allKeys = new Set<string>();
  const dataMap = new Map<string, Map<string, number>>();

  for (const row of breakdownRows) {
    allKeys.add(row.bk_key);
    if (!dataMap.has(row.bk_key)) {
      dataMap.set(row.bk_key, new Map());
    }
    dataMap.get(row.bk_key)!.set(row.date, row.value);
  }

  const nullDefault =
    numericMeasures.includes(measure) && measure !== 'sum' ? null : 0;

  const series = Array.from(allKeys).map((key) => {
    const keyData = dataMap.get(key)!;
    return {
      key,
      data: allBuckets.map((date) => ({
        date,
        value: keyData.has(date) ? keyData.get(date)! : nullDefault,
      })),
    };
  });

  // Sort series: top keys first, __other__ last
  series.sort((a, b) => {
    if (a.key === '__other__') return 1;
    if (b.key === '__other__') return -1;
    const aIdx = topKeys.indexOf(a.key);
    const bIdx = topKeys.indexOf(b.key);
    return aIdx - bIdx;
  });

  res.json({ series });
});

export default router;
