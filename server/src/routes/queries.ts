import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import { resolveIdentity } from '../identity.js';

const router = Router();

// ── GET /api/events — paginated event listing ────────────────────────

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();

  const eventName = req.query.event_name as string | undefined;
  const userId = req.query.user_id as string | undefined;
  const deviceId = req.query.device_id as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 50, 1), 1000);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (eventName) {
    whereClauses.push('e.event_name = ?');
    params.push(eventName);
  }

  if (userId) {
    // Identity-resolved: find events for this user across all devices
    whereClauses.push(
      '(e.user_id = ? OR e.device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?))'
    );
    params.push(userId, userId);
  } else if (deviceId) {
    // Resolve device_id: if mapped to a user, query as if by user_id
    const resolved = resolveIdentity(deviceId);
    if (resolved !== deviceId) {
      // Device is mapped to a user — broaden to that user's full identity
      whereClauses.push(
        '(e.user_id = ? OR e.device_id IN (SELECT device_id FROM identity_mappings WHERE user_id = ?))'
      );
      params.push(resolved, resolved);
    } else {
      // Unresolved device — just match device_id
      whereClauses.push('e.device_id = ?');
      params.push(deviceId);
    }
  }

  if (startDate) {
    whereClauses.push('e.timestamp >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push('e.timestamp <= ?');
    params.push(endDate);
  }

  const whereSQL = whereClauses.length > 0
    ? 'WHERE ' + whereClauses.join(' AND ')
    : '';

  // Count total matching events
  const countResult = db.exec(
    `SELECT COUNT(*) as total FROM events e ${whereSQL}`,
    params
  );
  const total = countResult.length > 0 ? countResult[0].values[0][0] as number : 0;

  // Fetch page
  const dataResult = db.exec(
    `SELECT e.id, e.event_name, e.device_id, e.user_id, e.timestamp, e.properties
     FROM events e
     ${whereSQL}
     ORDER BY e.timestamp DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const events = dataResult.length > 0
    ? dataResult[0].values.map((row) => {
        const cols = dataResult[0].columns;
        const obj: Record<string, unknown> = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });

        return {
          id: obj.id as number,
          event: obj.event_name as string,
          device_id: obj.device_id as string | null,
          user_id: obj.user_id as string | null,
          timestamp: obj.timestamp as string,
          properties: obj.properties ? JSON.parse(obj.properties as string) : null,
        };
      })
    : [];

  res.json({ events, total, limit, offset });
});

// ── GET /api/events/names — distinct event names ─────────────────────

router.get('/names', (_req: Request, res: Response): void => {
  const db = getDb();
  const result = db.exec(
    `SELECT DISTINCT event_name FROM events ORDER BY event_name ASC`
  );

  const names = result.length > 0
    ? result[0].values.map((row) => row[0] as string)
    : [];

  res.json(names);
});

// ── GET /api/stats/overview — aggregate stats ────────────────────────
// Mounted separately in index.ts as /api/stats/overview, but we export from here for colocation.

export function overviewHandler(_req: Request, res: Response): void {
  const db = getDb();

  // Total events
  const totalResult = db.exec(`SELECT COUNT(*) FROM events`);
  const totalEvents = totalResult.length > 0 ? totalResult[0].values[0][0] as number : 0;

  // Total users (resolved identities):
  // All distinct user_ids in identity_mappings
  // + all distinct device_ids in events that are NOT in identity_mappings AND have no user_id
  // + all distinct user_ids in events that aren't already counted
  const usersResult = db.exec(`
    SELECT COUNT(*) FROM (
      SELECT user_id AS resolved FROM identity_mappings
      UNION
      SELECT user_id AS resolved FROM events WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT user_id FROM identity_mappings)
      UNION
      SELECT device_id AS resolved FROM events WHERE device_id IS NOT NULL
        AND device_id NOT IN (SELECT device_id FROM identity_mappings)
        AND user_id IS NULL
    )
  `);
  const totalUsers = usersResult.length > 0 ? usersResult[0].values[0][0] as number : 0;

  // Event counts by name
  const countsResult = db.exec(
    `SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name ORDER BY count DESC`
  );
  const eventCountsByName: Record<string, number> = {};
  if (countsResult.length > 0) {
    for (const row of countsResult[0].values) {
      eventCountsByName[row[0] as string] = row[1] as number;
    }
  }

  // Date range
  const rangeResult = db.exec(
    `SELECT MIN(timestamp), MAX(timestamp) FROM events`
  );
  const dateRange = rangeResult.length > 0 && rangeResult[0].values[0][0] != null
    ? {
        earliest: rangeResult[0].values[0][0] as string,
        latest: rangeResult[0].values[0][1] as string,
      }
    : { earliest: null, latest: null };

  res.json({
    total_events: totalEvents,
    total_users: totalUsers,
    event_counts_by_name: eventCountsByName,
    date_range: dateRange,
  });
}

export default router;
