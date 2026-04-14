import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import { getResolvedIdentityExpression } from '../identity.js';

const router = Router();

/**
 * GET /api/stats/overview - Dashboard overview statistics
 */
router.get('/api/stats/overview', (_req: Request, res: Response): void => {
  const db = getDb();
  const resolvedId = getResolvedIdentityExpression();

  const totalEvents = (
    db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }
  ).count;

  const totalUsers = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT resolved_id) as count
         FROM (SELECT ${resolvedId} AS resolved_id FROM events e)`
      )
      .get() as { count: number }
  ).count;

  const eventCounts = db
    .prepare(
      'SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name ORDER BY count DESC'
    )
    .all() as Array<{ event_name: string; count: number }>;

  const dateRange = db
    .prepare(
      'SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest FROM events'
    )
    .get() as { earliest: string | null; latest: string | null };

  res.json({
    total_events: totalEvents,
    total_users: totalUsers,
    event_counts_by_name: eventCounts,
    date_range: {
      earliest: dateRange.earliest,
      latest: dateRange.latest,
    },
  });
});

export default router;
