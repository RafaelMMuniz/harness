import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import { resolveIdentity, getAllDevicesForUser } from '../identity.js';

const router = Router();

// ── GET /api/users/:id — user profile ────────────────────────────────

router.get('/:id', (req: Request, res: Response): void => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const db = getDb();

  // Resolve the ID — if it's a device_id mapped to a user, we get the canonical user_id
  const resolvedId = resolveIdentity(rawId);

  // Get all device_ids mapped to this resolved user
  const deviceIds = getAllDevicesForUser(resolvedId);

  // Build the WHERE clause for the events table only (no JOIN)
  let eventsWhereSQL: string;
  const eventsParams: unknown[] = [];

  if (deviceIds.length > 0) {
    const placeholders = deviceIds.map(() => '?').join(', ');
    eventsWhereSQL = `WHERE e.user_id = ? OR e.device_id IN (${placeholders})`;
    eventsParams.push(resolvedId, ...deviceIds);
  } else {
    eventsWhereSQL = `WHERE e.user_id = ? OR e.device_id = ?`;
    eventsParams.push(resolvedId, resolvedId);
  }

  // Aggregate stats
  const statsResult = db.exec(
    `SELECT COUNT(*) as total, MIN(e.timestamp) as first_seen, MAX(e.timestamp) as last_seen
     FROM events e ${eventsWhereSQL}`,
    eventsParams
  );

  if (statsResult.length === 0 || statsResult[0].values[0][0] === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const row = statsResult[0].values[0];
  const totalEvents = row[0] as number;
  const firstSeen = row[1] as string;
  const lastSeen = row[2] as string;

  // For the device_ids in the profile: use mapped devices, or just the id itself
  const profileDeviceIds = deviceIds.length > 0 ? deviceIds : [resolvedId];

  // Fetch events for the user
  const eventsResult = db.exec(
    `SELECT e.id, e.event_name, e.device_id, e.user_id, e.timestamp, e.properties
     FROM events e
     ${eventsWhereSQL}
     ORDER BY e.timestamp ASC`,
    eventsParams
  );

  const events = eventsResult.length > 0
    ? eventsResult[0].values.map((r) => ({
        id: r[0] as number,
        event_name: r[1] as string,
        device_id: r[2] as string | null,
        user_id: r[3] as string | null,
        timestamp: r[4] as string,
        properties: r[5] ? JSON.parse(r[5] as string) : null,
      }))
    : [];

  res.json({
    user_id: resolvedId,
    device_ids: profileDeviceIds,
    total_events: totalEvents,
    first_seen: firstSeen,
    last_seen: lastSeen,
    events,
  });
});

export default router;
