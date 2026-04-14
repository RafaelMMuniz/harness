import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { queryAll } from '../db.js';
import { getResolvedIdentityExpression, getIdentityJoin } from '../identity.js';

const router = Router();

const stepSchema = z.union([
  z.string().min(1),
  z.object({ event_name: z.string().min(1) }),
]);

const funnelSchema = z.object({
  steps: z.array(stepSchema).min(2, 'funnel requires at least 2 steps').max(5, 'funnel supports at most 5 steps'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

interface StepResult {
  event_name: string;
  count: number;
  conversion_rate: number;
  drop_off: number;
}

router.post('/query', (req: Request, res: Response) => {
  const parse = funnelSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors.map((e: { message: string }) => e.message).join('; ') });
    return;
  }

  const rawSteps = parse.data.steps;
  const steps = rawSteps.map(s => typeof s === 'string' ? s : s.event_name);

  const now = new Date();
  const start_date = parse.data.start_date || '2000-01-01T00:00:00.000Z';
  const end_date = parse.data.end_date || now.toISOString();

  const resolvedExpr = getResolvedIdentityExpression();
  const identityJoin = getIdentityJoin();
  const endDateInclusive = end_date.includes('T') ? end_date : end_date + 'T23:59:59.999Z';

  const stepUserTimestamps = new Map<number, Map<string, string>>();

  for (let i = 0; i < steps.length; i++) {
    const rows = queryAll(`
      SELECT ${resolvedExpr} as resolved_id, e.timestamp
      FROM events e ${identityJoin}
      WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
      ORDER BY e.timestamp ASC
    `, [steps[i], start_date, endDateInclusive]);

    const userMap = new Map<string, string>();
    for (const row of rows) {
      const rid = row.resolved_id as string;
      if (!userMap.has(rid)) {
        userMap.set(rid, row.timestamp as string);
      }
    }
    stepUserTimestamps.set(i, userMap);
  }

  const step0Users = stepUserTimestamps.get(0)!;
  let currentUsers = new Map(step0Users);

  const results: StepResult[] = [];
  const step0Count = currentUsers.size;

  results.push({
    event_name: steps[0],
    count: step0Count,
    conversion_rate: step0Count > 0 ? 1.0 : 0,
    drop_off: 0,
  });

  for (let i = 1; i < steps.length; i++) {
    const stepUsers = stepUserTimestamps.get(i)!;
    const nextUsers = new Map<string, string>();

    for (const [userId, prevTimestamp] of currentUsers) {
      // Find events for this user at this step that happened after prevTimestamp
      const allRows = queryAll(`
        SELECT e.timestamp
        FROM events e ${identityJoin}
        WHERE e.event_name = ? AND ${resolvedExpr} = ? AND e.timestamp >= ? AND e.timestamp <= ?
        ORDER BY e.timestamp ASC
      `, [steps[i], userId, start_date, endDateInclusive]);

      for (const row of allRows) {
        if ((row.timestamp as string) > prevTimestamp) {
          nextUsers.set(userId, row.timestamp as string);
          break;
        }
      }
    }

    const count = nextUsers.size;
    const prevCount = results[i - 1].count;

    results.push({
      event_name: steps[i],
      count,
      conversion_rate: step0Count > 0 ? count / step0Count : 0,
      drop_off: prevCount - count,
    });

    currentUsers = nextUsers;
  }

  const overallConversion = step0Count > 0
    ? results[results.length - 1].count / step0Count
    : 0;

  res.json({ steps: results, overall_conversion_rate: overallConversion });
});

export default router;
