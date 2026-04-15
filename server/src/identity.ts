import { getDb } from './db.js';

export interface EventRow {
  id: number;
  event_name: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: string | null;
}

/**
 * Resolve an identifier to a canonical user ID.
 * - If the id matches a user_id in identity_mappings, return it as-is.
 * - If the id is a device_id mapped to a user, return the mapped user_id.
 * - Otherwise, return the id unchanged.
 */
export function resolveIdentity(id: string): string {
  const db = getDb();
  const result = db.exec(
    `SELECT user_id FROM identity_mappings WHERE device_id = ?`,
    [id]
  );
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as string;
  }
  return id;
}

/**
 * Get ALL events for a resolved user identity.
 * Includes events where:
 * - user_id matches directly, OR
 * - device_id is mapped to this user_id via identity_mappings
 */
export function getEventsForUser(userId: string): EventRow[] {
  const db = getDb();
  const result = db.exec(
    `SELECT e.id, e.event_name, e.device_id, e.user_id, e.timestamp, e.properties
     FROM events e
     LEFT JOIN identity_mappings im ON e.device_id = im.device_id
     WHERE e.user_id = ? OR im.user_id = ?
     ORDER BY e.timestamp ASC`,
    [userId, userId]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as EventRow;
  });
}

/**
 * Get all device_ids mapped to a given user_id.
 */
export function getAllDevicesForUser(userId: string): string[] {
  const db = getDb();
  const result = db.exec(
    `SELECT device_id FROM identity_mappings WHERE user_id = ?`,
    [userId]
  );

  if (result.length === 0) return [];
  return result[0].values.map((row) => row[0] as string);
}
