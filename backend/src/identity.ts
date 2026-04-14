import { queryAll, queryOne, execute } from './db.js';

export interface StoredEvent {
  id: number;
  event_name: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: string | null;
}

export interface ParsedEvent {
  id: string;
  event: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: Record<string, unknown> | null;
}

export function parseEvent(row: Record<string, unknown>): ParsedEvent {
  const props = row.properties as string | null;
  return {
    id: String(row.id),
    event: row.event_name as string,
    device_id: row.device_id as string | null,
    user_id: row.user_id as string | null,
    timestamp: row.timestamp as string,
    properties: props ? JSON.parse(props) : null,
  };
}

export function resolveIdentity(id: string): { resolvedId: string; isUser: boolean } {
  const mapping = queryOne('SELECT user_id FROM identity_mappings WHERE device_id = ?', [id]);
  if (mapping) {
    return { resolvedId: mapping.user_id as string, isUser: true };
  }

  const hasMapping = queryOne('SELECT 1 as v FROM identity_mappings WHERE user_id = ? LIMIT 1', [id]);
  if (hasMapping) {
    return { resolvedId: id, isUser: true };
  }

  const hasUserEvents = queryOne('SELECT 1 as v FROM events WHERE user_id = ? LIMIT 1', [id]);
  if (hasUserEvents) {
    return { resolvedId: id, isUser: true };
  }

  return { resolvedId: id, isUser: false };
}

export function getEventsForUser(userId: string): ParsedEvent[] {
  const rows = queryAll(`
    SELECT e.* FROM events e
    WHERE e.user_id = ?
       OR e.device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?)
    ORDER BY e.timestamp ASC
  `, [userId, userId]);
  return rows.map(parseEvent);
}

export function getEventsForDevice(deviceId: string): ParsedEvent[] {
  const rows = queryAll('SELECT * FROM events WHERE device_id = ? ORDER BY timestamp ASC', [deviceId]);
  return rows.map(parseEvent);
}

export function getResolvedIdentityExpression(): string {
  return `COALESCE(im.user_id, e.user_id, e.device_id)`;
}

export function getIdentityJoin(): string {
  return `LEFT JOIN identity_mappings im ON e.device_id = im.device_id`;
}

export function createIdentityMapping(deviceId: string, userId: string): string | null {
  const existing = queryOne('SELECT user_id FROM identity_mappings WHERE device_id = ?', [deviceId]);

  if (existing) {
    if (existing.user_id === userId) {
      return null;
    }
    return 'device_id is already mapped to a different user';
  }

  execute(
    'INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)',
    [deviceId, userId, new Date().toISOString()],
  );
  return null;
}
