import { db } from './db.js';

export interface EventRow {
  id: number;
  event_name: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: string | null;
}

export interface ParsedEvent {
  id: number;
  event: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: Record<string, unknown> | null;
}

/**
 * Resolves a device_id or user_id to the canonical user identity.
 * - Given a user_id: returns that user_id.
 * - Given a device_id: looks up identity_mappings; returns the mapped user_id
 *   if one exists, otherwise returns the device_id as-is.
 */
export function resolveIdentity(deviceOrUserId: string): string {
  const mapping = db
    .prepare('SELECT user_id FROM identity_mappings WHERE device_id = ?')
    .get(deviceOrUserId) as { user_id: string } | undefined;

  if (mapping) {
    return mapping.user_id;
  }

  return deviceOrUserId;
}

/**
 * Returns all events attributed to a resolved user:
 * - Events where user_id matches directly
 * - Events where device_id is mapped to that user_id via identity_mappings
 *
 * The merge is retroactive: events recorded before the identity mapping
 * was created are included.
 *
 * Results are sorted by timestamp ascending (oldest first).
 */
export function getEventsForUser(userId: string): ParsedEvent[] {
  const rows = db
    .prepare(
      `SELECT * FROM events
       WHERE user_id = ?
          OR device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?)
       ORDER BY timestamp ASC`,
    )
    .all(userId, userId) as EventRow[];

  return rows.map(parseEventRow);
}

export function parseEventRow(row: EventRow): ParsedEvent {
  return {
    id: row.id,
    event: row.event_name,
    device_id: row.device_id,
    user_id: row.user_id,
    timestamp: row.timestamp,
    properties: row.properties ? JSON.parse(row.properties) : null,
  };
}
