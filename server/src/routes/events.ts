import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb, debouncedSave } from '../db.js';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────

const singleEventSchema = z.object({
  event: z.string().min(1, 'event name is required'),
  device_id: z.string().optional(),
  user_id: z.string().optional(),
  timestamp: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.device_id || data.user_id,
  { message: 'At least one of device_id or user_id is required' }
);

const batchBodySchema = z.object({
  events: z.array(z.unknown()).min(1).max(1000),
});

// ── Helpers ──────────────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Try to link a device_id → user_id.
 * Returns null on success, or an error message if the device is already
 * mapped to a *different* user.
 */
function linkIdentity(deviceId: string, userId: string): string | null {
  const db = getDb();

  const existing = db.exec(
    `SELECT user_id FROM identity_mappings WHERE device_id = ?`,
    [deviceId]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    const mappedUser = existing[0].values[0][0] as string;
    if (mappedUser !== userId) {
      return `device_id "${deviceId}" is already mapped to user "${mappedUser}"`;
    }
    // Already mapped to the same user — nothing to do
    return null;
  }

  // Insert new mapping
  db.run(
    `INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)`,
    [deviceId, userId, nowISO()]
  );
  return null;
}

// ── POST /api/events — single event ingestion ────────────────────────

router.post('/', (req: Request, res: Response): void => {
  const parsed = singleEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { event, device_id, user_id, timestamp, properties } = parsed.data;
  const db = getDb();

  // Identity linking
  if (device_id && user_id) {
    const conflict = linkIdentity(device_id, user_id);
    if (conflict) {
      res.status(409).json({ error: conflict });
      return;
    }
  }

  const ts = timestamp ?? nowISO();
  const propsJson = properties ? JSON.stringify(properties) : null;

  db.run(
    `INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)`,
    [event, device_id ?? null, user_id ?? null, ts, propsJson]
  );

  // Retrieve the last inserted row id
  const idResult = db.exec(`SELECT last_insert_rowid() AS id`);
  const id = idResult[0].values[0][0] as number;

  debouncedSave();

  res.status(201).json({
    id,
    event,
    device_id: device_id ?? null,
    user_id: user_id ?? null,
    timestamp: ts,
    properties: properties ?? null,
  });
});

// ── POST /api/events/batch — batch ingestion ─────────────────────────

router.post('/batch', (req: Request, res: Response): void => {
  const parsed = batchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const rawEvents = parsed.data.events;
  const db = getDb();
  const errors: Array<{ index: number; message: string }> = [];
  let accepted = 0;

  db.run('BEGIN TRANSACTION');

  try {
    for (let i = 0; i < rawEvents.length; i++) {
      // Validate each event individually
      const eventParsed = singleEventSchema.safeParse(rawEvents[i]);
      if (!eventParsed.success) {
        errors.push({ index: i, message: eventParsed.error.errors[0].message });
        continue;
      }

      const { event, device_id, user_id, timestamp, properties } = eventParsed.data;

      // Identity linking — conflicts skip the event, don't abort batch
      if (device_id && user_id) {
        const conflict = linkIdentity(device_id, user_id);
        if (conflict) {
          errors.push({ index: i, message: conflict });
          continue;
        }
      }

      const ts = timestamp ?? nowISO();
      const propsJson = properties ? JSON.stringify(properties) : null;

      db.run(
        `INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)`,
        [event, device_id ?? null, user_id ?? null, ts, propsJson]
      );

      accepted++;
    }

    db.run('COMMIT');
    debouncedSave();
  } catch (err) {
    db.run('ROLLBACK');
    res.status(500).json({ error: 'Batch ingestion failed' });
    return;
  }

  res.status(200).json({ accepted, errors });
});

export default router;
