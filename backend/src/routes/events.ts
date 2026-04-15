import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';

const eventSchema = z
  .object({
    event: z.string({ required_error: 'event name is required' }).min(1, 'event name is required'),
    device_id: z.string().optional(),
    user_id: z.string().optional(),
    timestamp: z.string().optional(),
    properties: z.record(z.unknown()).optional(),
  })
  .refine((data) => data.device_id || data.user_id, {
    message: 'at least one of device_id or user_id must be present',
  });

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    res.status(400).json({ error: message });
    return;
  }

  const { event, device_id, user_id, timestamp, properties } = parsed.data;
  const eventTimestamp = timestamp || new Date().toISOString();
  const serializedProperties = properties ? JSON.stringify(properties) : null;

  const db = getDb();

  // Check identity conflict BEFORE inserting the event
  if (device_id && user_id) {
    const existing = db
      .prepare('SELECT user_id FROM identity_mappings WHERE device_id = ?')
      .get(device_id) as { user_id: string } | undefined;
    if (existing && existing.user_id !== user_id) {
      res
        .status(409)
        .json({ error: 'device_id is already mapped to a different user' });
      return;
    }
  }

  // Insert the event
  const result = db
    .prepare(
      'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      event,
      device_id ?? null,
      user_id ?? null,
      eventTimestamp,
      serializedProperties,
    );

  // Create or confirm identity mapping as a side effect
  if (device_id && user_id) {
    db.prepare(
      'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)',
    ).run(device_id, user_id, new Date().toISOString());
  }

  // Return the stored event object
  const storedEvent = {
    id: Number(result.lastInsertRowid),
    event,
    device_id: device_id ?? null,
    user_id: user_id ?? null,
    timestamp: eventTimestamp,
    properties: properties ?? null,
  };

  res.status(201).json(storedEvent);
});

export default router;
