import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, execute, transaction } from '../db.js';
import {
  createIdentityMapping,
  resolveIdentity,
  getEventsForUser,
  getEventsForDevice,
  parseEvent,
} from '../identity.js';

const router = Router();

const eventSchema = z.object({
  event: z.string().min(1, 'event name is required'),
  device_id: z.string().optional(),
  user_id: z.string().optional(),
  timestamp: z.string().optional(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
}).refine(
  (data: { device_id?: string; user_id?: string }) => data.device_id || data.user_id,
  { message: 'at least one of device_id or user_id is required' },
);

// POST /api/events
router.post('/', (req: Request, res: Response) => {
  const parse = eventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors.map((e: { message: string }) => e.message).join('; ') });
    return;
  }

  const { event, device_id, user_id, timestamp, properties } = parse.data;

  if (device_id && user_id) {
    const conflict = createIdentityMapping(device_id, user_id);
    if (conflict) {
      res.status(409).json({ error: conflict });
      return;
    }
  }

  const ts = timestamp || new Date().toISOString();
  const propsJson = properties ? JSON.stringify(properties) : null;

  const result = execute(
    'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)',
    [event, device_id || null, user_id || null, ts, propsJson],
  );

  res.status(201).json({
    id: String(result.lastInsertRowid),
    event,
    device_id: device_id || null,
    user_id: user_id || null,
    timestamp: ts,
    properties: properties || null,
  });
});

const batchSchema = z.object({
  events: z.array(z.any()).min(1, 'events array must not be empty').max(1000, 'events array must not exceed 1000'),
});

// POST /api/events/batch
router.post('/batch', (req: Request, res: Response) => {
  const batchParse = batchSchema.safeParse(req.body);
  if (!batchParse.success) {
    res.status(400).json({ error: batchParse.error.errors.map((e: { message: string }) => e.message).join('; ') });
    return;
  }

  const { events } = batchParse.data;
  let accepted = 0;
  const errors: Array<{ index: number; message: string }> = [];

  transaction(() => {
    for (let i = 0; i < events.length; i++) {
      const parse = eventSchema.safeParse(events[i]);
      if (!parse.success) {
        errors.push({ index: i, message: parse.error.errors.map((e: { message: string }) => e.message).join('; ') });
        continue;
      }

      const { event, device_id, user_id, timestamp, properties } = parse.data;

      if (device_id && user_id) {
        // Attempt to create mapping; ignore conflicts (event is still stored)
        createIdentityMapping(device_id, user_id);
      }

      const ts = timestamp || new Date().toISOString();
      const propsJson = properties ? JSON.stringify(properties) : null;
      execute(
        'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)',
        [event, device_id || null, user_id || null, ts, propsJson],
      );
      accepted++;
    }
  });

  res.status(200).json({ accepted, errors });
});

// GET /api/events
router.get('/', (req: Request, res: Response) => {
  const {
    event_name,
    user_id,
    device_id,
    start_date,
    end_date,
    limit: limitStr,
    offset: offsetStr,
  } = req.query as Record<string, string | undefined>;

  if (user_id) {
    const { resolvedId, isUser } = resolveIdentity(user_id);
    if (isUser) {
      const events = getEventsForUser(resolvedId);
      res.json({ events, total: events.length, limit: events.length, offset: 0 });
      return;
    }
    const deviceEvents = getEventsForDevice(user_id);
    res.json({ events: deviceEvents, total: deviceEvents.length, limit: deviceEvents.length, offset: 0 });
    return;
  }

  if (device_id) {
    const { resolvedId, isUser } = resolveIdentity(device_id);
    if (isUser) {
      const events = getEventsForUser(resolvedId);
      res.json({ events, total: events.length, limit: events.length, offset: 0 });
      return;
    }
    const events = getEventsForDevice(device_id);
    res.json({ events, total: events.length, limit: events.length, offset: 0 });
    return;
  }

  const limit = Math.min(Math.max(parseInt(limitStr || '50', 10) || 50, 1), 1000);
  const offset = Math.max(parseInt(offsetStr || '0', 10) || 0, 0);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (event_name) {
    conditions.push('event_name = ?');
    params.push(event_name);
  }
  if (start_date) {
    conditions.push('timestamp >= ?');
    params.push(start_date);
  }
  if (end_date) {
    const endDateInclusive = end_date.includes('T') ? end_date : end_date + 'T23:59:59.999Z';
    conditions.push('timestamp <= ?');
    params.push(endDateInclusive);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRow = queryOne(`SELECT COUNT(*) as count FROM events ${whereClause}`, params);
  const total = (totalRow?.count as number) || 0;

  const rows = queryAll(
    `SELECT * FROM events ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  res.json({
    events: rows.map(parseEvent),
    total,
    limit,
    offset,
  });
});

// GET /api/events/names
router.get('/names', (_req: Request, res: Response) => {
  const rows = queryAll('SELECT DISTINCT event_name FROM events');
  const names = rows.map(r => r.event_name as string);
  names.sort((a, b) => a.localeCompare(b));
  res.json(names);
});

export default router;
