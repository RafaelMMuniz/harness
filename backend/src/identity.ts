import type Database from 'better-sqlite3';

export interface Event {
  id: number;
  event_name: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: Record<string, unknown> | null;
}

/**
 * Resolve an identity to its canonical form.
 * If the id is a device_id with a mapping, return the mapped user_id.
 * Otherwise return the id as-is.
 */
export function resolveIdentity(db: Database.Database, id: string): string {
  const row = db
    .prepare('SELECT user_id FROM identity_mappings WHERE device_id = ?')
    .get(id) as { user_id: string } | undefined;
  return row ? row.user_id : id;
}

/**
 * Get all events for a resolved user, including events from all mapped devices.
 * Returns events in chronological order (ascending).
 */
export function getResolvedEventsForUser(
  db: Database.Database,
  userId: string
): Event[] {
  const rows = db
    .prepare(
      `SELECT * FROM events
       WHERE user_id = ?
          OR device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?)
       ORDER BY timestamp ASC`
    )
    .all(userId, userId) as Array<{
    id: number;
    event_name: string;
    device_id: string | null;
    user_id: string | null;
    timestamp: string;
    properties: string | null;
  }>;

  return rows.map((row) => ({
    ...row,
    properties: row.properties ? JSON.parse(row.properties) : null,
  }));
}

/**
 * Returns a SQL expression that resolves the identity of an event row aliased as `e`.
 * Priority: mapped user_id (via device_id lookup) > event user_id > event device_id.
 */
export function getResolvedIdentityExpression(): string {
  return `COALESCE((SELECT im.user_id FROM identity_mappings im WHERE im.device_id = e.device_id), e.user_id, e.device_id)`;
}
