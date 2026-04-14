import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { resolveIdentity } from '../identity.js';

const router = Router();

// --- Schemas ---

const singleEventSchema = z
  .object({
    event: z.string().min(1, 'event name is required'),
    device_id: z.string().optional(),
    user_id: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }).optional(),
    properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .refine((data) => data.device_id || data.user_id, {
    message: 'At least one of device_id or user_id must be provided',
  });

const batchEventSchema = z.object({
  events: z
    .array(
      z
        .object({
          event: z.string().min(1, 'event name is required'),
          device_id: z.string().optional(),
          user_id: z.string().optional(),
          timestamp: z.string().datetime({ offset: true }).optional(),
          properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
        })
        .refine((data) => data.device_id || data.user_id, {
          message: 'At least one of device_id or user_id must be provided',
        })
    )
    .min(1, 'At least one event is required')
    .max(1000, 'Maximum 1000 events per batch'),
});

// --- Helpers ---

function checkIdentityConflict(
  db: ReturnType<typeof getDb>,
  deviceId: string,
  userId: string
): string | null {
  const existing = db
    .prepare('SELECT user_id FROM identity_mappings WHERE device_id = ?')
    .get(deviceId) as { user_id: string } | undefined;
  if (existing && existing.user_id !== userId) {
    return `device_id is already mapped to a different user`;
  }
  return null;
}

// --- Routes ---

/**
 * POST /api/events - Single event ingestion
 */
router.post('/api/events', (req: Request, res: Response): void => {
  const parsed = singleEventSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  const db = getDb();
  const data = parsed.data;
  const timestamp = data.timestamp || new Date().toISOString();
  const propertiesJson = data.properties ? JSON.stringify(data.properties) : null;

  // Identity conflict check
  if (data.device_id && data.user_id) {
    const conflict = checkIdentityConflict(db, data.device_id, data.user_id);
    if (conflict) {
      res.status(409).json({ error: conflict });
      return;
    }
    // Create or confirm mapping
    db.prepare(
      'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)'
    ).run(data.device_id, data.user_id, new Date().toISOString());
  }

  // Insert event
  const result = db
    .prepare(
      'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      data.event,
      data.device_id || null,
      data.user_id || null,
      timestamp,
      propertiesJson
    );

  res.status(201).json({
    id: result.lastInsertRowid,
    event_name: data.event,
    device_id: data.device_id || null,
    user_id: data.user_id || null,
    timestamp,
    properties: data.properties || null,
  });
});

/**
 * POST /api/events/batch - Batch event ingestion
 */
router.post('/api/events/batch', (req: Request, res: Response): void => {
  const parsed = batchEventSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  const db = getDb();
  const events = parsed.data.events;
  let accepted = 0;
  const errors: Array<{ index: number; message: string }> = [];

  const insertEvent = db.prepare(
    'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)'
  );
  const insertMapping = db.prepare(
    'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (let i = 0; i < events.length; i++) {
      const data = events[i];
      const timestamp = data.timestamp || new Date().toISOString();
      const propertiesJson = data.properties ? JSON.stringify(data.properties) : null;

      // Identity conflict check
      if (data.device_id && data.user_id) {
        const conflict = checkIdentityConflict(db, data.device_id, data.user_id);
        if (conflict) {
          errors.push({ index: i, message: conflict });
          continue;
        }
        insertMapping.run(data.device_id, data.user_id, new Date().toISOString());
      }

      insertEvent.run(
        data.event,
        data.device_id || null,
        data.user_id || null,
        timestamp,
        propertiesJson
      );
      accepted++;
    }
  });

  transaction();

  res.status(200).json({ accepted, errors });
});

/**
 * GET /api/events - Event listing with filters
 */
router.get('/api/events', (req: Request, res: Response): void => {
  const db = getDb();

  const eventName = req.query.event_name as string | undefined;
  const userId = req.query.user_id as string | undefined;
  const deviceId = req.query.device_id as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 1000);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (eventName) {
    conditions.push('e.event_name = ?');
    params.push(eventName);
  }

  if (startDate) {
    conditions.push('e.timestamp >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('e.timestamp <= ?');
    params.push(endDate);
  }

  // Identity-aware filtering
  if (userId) {
    // Resolve: include events where user_id matches OR device_id is mapped to that user
    conditions.push(
      '(e.user_id = ? OR e.device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?))'
    );
    params.push(userId, userId);
  } else if (deviceId) {
    // Resolve the device_id to a user if mapping exists, then get all events for that user
    const resolvedId = resolveIdentity(db, deviceId);
    if (resolvedId !== deviceId) {
      // Device is mapped to a user - get all events for that resolved user
      conditions.push(
        '(e.user_id = ? OR e.device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?))'
      );
      params.push(resolvedId, resolvedId);
    } else {
      // Device not mapped - just filter by device_id
      conditions.push('e.device_id = ?');
      params.push(deviceId);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM events e ${whereClause}`)
    .get(...params) as { total: number };

  const rows = db
    .prepare(
      `SELECT e.* FROM events e ${whereClause} ORDER BY e.timestamp DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<{
    id: number;
    event_name: string;
    device_id: string | null;
    user_id: string | null;
    timestamp: string;
    properties: string | null;
  }>;

  const events = rows.map((row) => ({
    ...row,
    properties: row.properties ? JSON.parse(row.properties) : null,
  }));

  res.json({
    events,
    total: countRow.total,
    limit,
    offset,
  });
});

/**
 * GET /api/events/names - Distinct event names
 */
router.get('/api/events/names', (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare('SELECT DISTINCT event_name FROM events ORDER BY event_name ASC')
    .all() as Array<{ event_name: string }>;

  res.json(rows.map((r) => r.event_name));
});

export default router;
