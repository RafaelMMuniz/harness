import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import { resolveIdentity } from '../identity.js';

const router = Router();

/**
 * GET /api/users/:id - User profile
 *
 * Resolves the given id (could be user_id or device_id) and returns
 * a complete profile including all mapped devices and event summary.
 */
router.get('/api/users/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const rawId = req.params.id;
  const resolvedId = resolveIdentity(db, rawId);

  // Get all device_ids mapped to this resolved user
  const deviceRows = db
    .prepare('SELECT device_id FROM identity_mappings WHERE user_id = ?')
    .all(resolvedId) as Array<{ device_id: string }>;
  const deviceIds = deviceRows.map((r) => r.device_id);

  // Build conditions to find all events for this resolved identity
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Events with user_id matching
  conditions.push('user_id = ?');
  params.push(resolvedId);

  // Events from mapped devices
  if (deviceIds.length > 0) {
    const placeholders = deviceIds.map(() => '?').join(', ');
    conditions.push(`device_id IN (${placeholders})`);
    params.push(...deviceIds);
  }

  // Also check for events where device_id is the raw id (if it's an unmapped device)
  if (resolvedId === rawId && deviceIds.length === 0) {
    // The id wasn't resolved - could be a device_id without mapping
    // or a user_id. Check events with this as device_id too.
    conditions.push('device_id = ?');
    params.push(rawId);
  }

  const whereClause = conditions.join(' OR ');

  const stats = db
    .prepare(
      `SELECT COUNT(*) as total_events,
              MIN(timestamp) as first_seen,
              MAX(timestamp) as last_seen
       FROM events
       WHERE ${whereClause}`
    )
    .get(...params) as {
    total_events: number;
    first_seen: string | null;
    last_seen: string | null;
  };

  if (stats.total_events === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user_id: resolvedId,
    device_ids: deviceIds,
    total_events: stats.total_events,
    first_seen: stats.first_seen,
    last_seen: stats.last_seen,
  });
});

export default router;
