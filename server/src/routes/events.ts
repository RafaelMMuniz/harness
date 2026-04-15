import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';

const eventBodySchema = z
  .object({
    event: z.string().min(1, 'event name is required and must be non-empty'),
    device_id: z.string().optional(),
    user_id: z.string().optional(),
    timestamp: z.string().optional(),
    properties: z.record(z.unknown()).optional().nullable(),
  })
  .refine((data) => data.device_id || data.user_id, {
    message: 'At least one of device_id or user_id must be present',
  });

export const eventsRouter = Router();

eventsRouter.post('/events', (req: Request, res: Response) => {
  const result = eventBodySchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  const { event, device_id, user_id, properties } = result.data;
  const timestamp = result.data.timestamp || new Date().toISOString();

  // Check for identity conflict BEFORE inserting the event
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

  // Serialize properties to JSON string for storage
  const serializedProps =
    properties != null ? JSON.stringify(properties) : null;

  // Insert the event
  const info = db
    .prepare(
      'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      event,
      device_id ?? null,
      user_id ?? null,
      timestamp,
      serializedProps,
    );

  // Create or confirm identity mapping when both IDs present
  if (device_id && user_id) {
    db.prepare(
      'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)',
    ).run(device_id, user_id, new Date().toISOString());
  }

  // Return the stored event with parsed properties
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(
    info.lastInsertRowid,
  ) as {
    id: number;
    event_name: string;
    device_id: string | null;
    user_id: string | null;
    timestamp: string;
    properties: string | null;
  };

  res.status(201).json({
    id: row.id,
    event: row.event_name,
    device_id: row.device_id,
    user_id: row.user_id,
    timestamp: row.timestamp,
    properties: row.properties ? JSON.parse(row.properties) : null,
  });
});
