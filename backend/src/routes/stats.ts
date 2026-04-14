import { Router, type Request, type Response } from 'express';
import { queryAll, queryOne } from '../db.js';
import { getResolvedIdentityExpression, getIdentityJoin } from '../identity.js';

const router = Router();

router.get('/overview', (_req: Request, res: Response) => {
  const totalEvents = (queryOne('SELECT COUNT(*) as count FROM events') as { count: number })?.count || 0;

  const resolvedExpr = getResolvedIdentityExpression();
  const identityJoin = getIdentityJoin();
  const totalUsers = (queryOne(
    `SELECT COUNT(DISTINCT ${resolvedExpr}) as count FROM events e ${identityJoin}`,
  ) as { count: number })?.count || 0;

  const countsByName = queryAll(
    'SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name',
  );

  const eventCountsByName: Record<string, number> = {};
  for (const row of countsByName) {
    eventCountsByName[row.event_name as string] = row.count as number;
  }

  const dateRange = queryOne(
    'SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest FROM events',
  );

  res.json({
    total_events: totalEvents,
    total_users: totalUsers,
    event_counts_by_name: eventCountsByName,
    date_range: {
      earliest: dateRange?.earliest || null,
      latest: dateRange?.latest || null,
    },
  });
});

export default router;
