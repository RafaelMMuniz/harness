import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { queryAll } from '../db.js';
import { getResolvedIdentityExpression, getIdentityJoin } from '../identity.js';

const router = Router();

const trendsSchema = z.object({
  event_name: z.string().min(1, 'event_name is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  granularity: z.enum(['day', 'week']).optional().default('day'),
  measure: z.enum(['total_count', 'unique_users', 'sum', 'avg', 'min', 'max']).optional().default('total_count'),
  property: z.string().optional(),
  breakdown_by: z.string().optional(),
});

function getDateBucket(granularity: string): string {
  if (granularity === 'week') {
    return `date(e.timestamp, 'weekday 1', '-7 days')`;
  }
  return `date(e.timestamp)`;
}

function generateDateRange(startDate: string, endDate: string, granularity: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (granularity === 'week') {
    const day = start.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setUTCDate(start.getUTCDate() - diff);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 7);
    }
  } else {
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return dates;
}

function isNumericProperty(eventName: string, property: string): boolean {
  const rows = queryAll(`
    SELECT properties FROM events
    WHERE event_name = ? AND properties IS NOT NULL
    ORDER BY timestamp DESC LIMIT 500
  `, [eventName]);

  let foundAny = false;
  for (const row of rows) {
    const propsStr = row.properties as string;
    if (!propsStr) continue;
    const props = JSON.parse(propsStr);
    const val = props[property];
    if (val === undefined || val === null) continue;
    foundAny = true;
    if (typeof val !== 'number') return false;
  }
  return foundAny;
}

function escapeProperty(prop: string): string {
  return prop.replace(/'/g, "''");
}

router.get('/', (req: Request, res: Response) => {
  const parse = trendsSchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors.map((e: { message: string }) => e.message).join('; ') });
    return;
  }

  const { event_name, granularity, measure, property, breakdown_by } = parse.data;

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);

  const startDate = parse.data.start_date || defaultStart.toISOString().split('T')[0];
  const endDate = parse.data.end_date || now.toISOString().split('T')[0];

  const isNumericMeasure = ['sum', 'avg', 'min', 'max'].includes(measure);
  if (isNumericMeasure && !property) {
    res.status(400).json({ error: 'property is required for numeric aggregation measures' });
    return;
  }

  if (isNumericMeasure && property && !isNumericProperty(event_name, property)) {
    res.status(400).json({ error: `property '${property}' is not numeric for event '${event_name}'` });
    return;
  }

  const dateBucket = getDateBucket(granularity);
  const resolvedExpr = getResolvedIdentityExpression();
  const identityJoin = getIdentityJoin();
  const allDates = generateDateRange(startDate, endDate, granularity);
  const endDateFilter = endDate + 'T23:59:59.999Z';

  if (breakdown_by) {
    const propExtract = `json_extract(e.properties, '$.${escapeProperty(breakdown_by)}')`;
    let valueExpr: string;
    if (measure === 'total_count') valueExpr = 'COUNT(*)';
    else if (measure === 'unique_users') valueExpr = `COUNT(DISTINCT ${resolvedExpr})`;
    else {
      const propPath = `json_extract(e.properties, '$.${escapeProperty(property!)}')`;
      if (measure === 'sum') valueExpr = `SUM(CAST(${propPath} AS REAL))`;
      else if (measure === 'avg') valueExpr = `AVG(CAST(${propPath} AS REAL))`;
      else if (measure === 'min') valueExpr = `MIN(CAST(${propPath} AS REAL))`;
      else valueExpr = `MAX(CAST(${propPath} AS REAL))`;
    }

    const rows = queryAll(`
      SELECT ${dateBucket} as date, ${propExtract} as breakdown_key, ${valueExpr} as value
      FROM events e ${identityJoin}
      WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < ?
        AND ${propExtract} IS NOT NULL
      GROUP BY date, breakdown_key
      ORDER BY date ASC
    `, [event_name, startDate, endDateFilter]);

    const keyTotals = new Map<string, number>();
    for (const row of rows) {
      const key = String(row.breakdown_key);
      keyTotals.set(key, (keyTotals.get(key) || 0) + ((row.value as number) || 0));
    }

    const sorted = [...keyTotals.entries()].sort((a, b) => b[1] - a[1]);
    const top5Keys = new Set(sorted.slice(0, 5).map(([k]) => k));

    const seriesMap = new Map<string, Map<string, number>>();
    for (const row of rows) {
      const key = top5Keys.has(String(row.breakdown_key)) ? String(row.breakdown_key) : '__other__';
      if (!seriesMap.has(key)) seriesMap.set(key, new Map());
      const dateMap = seriesMap.get(key)!;
      dateMap.set(row.date as string, (dateMap.get(row.date as string) || 0) + ((row.value as number) || 0));
    }

    const series = [...seriesMap.entries()].map(([key, dateMap]) => ({
      key,
      data: allDates.map(date => ({ date, value: dateMap.get(date) || 0 })),
    }));

    series.sort((a, b) => {
      if (a.key === '__other__') return 1;
      if (b.key === '__other__') return -1;
      return a.key.localeCompare(b.key);
    });

    res.json({ event_name, granularity, start_date: startDate, end_date: endDate, series });
    return;
  }

  if (isNumericMeasure) {
    const propPath = `json_extract(e.properties, '$.${escapeProperty(property!)}')`;
    let aggExpr: string;
    if (measure === 'sum') aggExpr = `SUM(CAST(${propPath} AS REAL))`;
    else if (measure === 'avg') aggExpr = `AVG(CAST(${propPath} AS REAL))`;
    else if (measure === 'min') aggExpr = `MIN(CAST(${propPath} AS REAL))`;
    else aggExpr = `MAX(CAST(${propPath} AS REAL))`;

    const rows = queryAll(`
      SELECT ${dateBucket} as date, ${aggExpr} as value
      FROM events e ${identityJoin}
      WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < ?
      GROUP BY date ORDER BY date ASC
    `, [event_name, startDate, endDateFilter]);

    const dateValueMap = new Map(rows.map(r => [r.date as string, r.value as number | null]));
    const data = allDates.map(date => ({
      date,
      value: dateValueMap.has(date) ? dateValueMap.get(date) : (measure === 'sum' ? 0 : null),
    }));

    res.json({ event_name, granularity, start_date: startDate, end_date: endDate, data });
    return;
  }

  const rows = queryAll(`
    SELECT ${dateBucket} as date,
           COUNT(*) as total_count,
           COUNT(DISTINCT ${resolvedExpr}) as unique_users
    FROM events e ${identityJoin}
    WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < ?
    GROUP BY date ORDER BY date ASC
  `, [event_name, startDate, endDateFilter]);

  const dateMap = new Map(rows.map(r => [r.date as string, r]));
  const data = allDates.map(date => ({
    date,
    total_count: (dateMap.get(date)?.total_count as number) || 0,
    unique_users: (dateMap.get(date)?.unique_users as number) || 0,
  }));

  res.json({ event_name, granularity, start_date: startDate, end_date: endDate, data });
});

export default router;
