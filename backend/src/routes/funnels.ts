import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { getResolvedIdentityExpression } from '../identity.js';

const router = Router();

const funnelQuerySchema = z.object({
  steps: z
    .array(z.string().min(1))
    .min(2, 'At least 2 steps required')
    .max(5, 'Maximum 5 steps allowed'),
  start_date: z.string().min(1, 'start_date is required'),
  end_date: z.string().min(1, 'end_date is required'),
});

/**
 * POST /api/funnels/query - Funnel analysis
 *
 * Algorithm:
 * 1. For each step, get all (resolved_user_id, earliest_timestamp) within date range
 * 2. Step 1: all distinct resolved users who performed the first event
 * 3. Step 2+: users from previous step who performed current event AFTER their previous step timestamp
 * 4. Track the qualifying timestamp for each user at each step
 */
router.post('/api/funnels/query', (req: Request, res: Response): void => {
  const parsed = funnelQuerySchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  const db = getDb();
  const { steps, start_date, end_date } = parsed.data;
  const resolvedId = getResolvedIdentityExpression();

  // For each step, get all events with resolved identity and timestamp
  // We'll process step-by-step in application code

  // Step 1: get all distinct resolved users and their earliest timestamp for the first event
  const step1Rows = db
    .prepare(
      `SELECT resolved_id, MIN(e.timestamp) as earliest_ts
       FROM (SELECT ${resolvedId} AS resolved_id, e.timestamp FROM events e
             WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < date(?, '+1 day')) sub
       GROUP BY resolved_id`
    )
    .all(steps[0], start_date, end_date) as Array<{
    resolved_id: string;
    earliest_ts: string;
  }>;

  // Track users who made it through each step and their qualifying timestamp
  let currentUsers = new Map<string, string>(); // resolved_id -> qualifying timestamp
  for (const row of step1Rows) {
    currentUsers.set(row.resolved_id, row.earliest_ts);
  }

  const stepResults: Array<{
    event_name: string;
    count: number;
    conversion_rate: number;
    drop_off: number;
  }> = [];

  const initialCount = currentUsers.size;

  stepResults.push({
    event_name: steps[0],
    count: initialCount,
    conversion_rate: 1.0,
    drop_off: 0,
  });

  // Steps 2+
  for (let i = 1; i < steps.length; i++) {
    const eventName = steps[i];

    // Get all events for this step within date range
    const stepRows = db
      .prepare(
        `SELECT resolved_id, e.timestamp
         FROM (SELECT ${resolvedId} AS resolved_id, e.timestamp FROM events e
               WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp < date(?, '+1 day')) sub
         ORDER BY sub.timestamp ASC`
      )
      .all(eventName, start_date, end_date) as Array<{
      resolved_id: string;
      timestamp: string;
    }>;

    // Build a map of resolved_id -> all timestamps for this step
    const eventsByUser = new Map<string, string[]>();
    for (const row of stepRows) {
      if (!eventsByUser.has(row.resolved_id)) {
        eventsByUser.set(row.resolved_id, []);
      }
      eventsByUser.get(row.resolved_id)!.push(row.timestamp);
    }

    // Find users from previous step who did this step after their previous qualifying timestamp
    const nextUsers = new Map<string, string>();
    for (const [userId, prevTimestamp] of currentUsers) {
      const timestamps = eventsByUser.get(userId);
      if (!timestamps) continue;

      // Find the earliest timestamp after prevTimestamp
      const qualifying = timestamps.find((ts) => ts > prevTimestamp);
      if (qualifying) {
        nextUsers.set(userId, qualifying);
      }
    }

    const prevCount = stepResults[i - 1].count;

    stepResults.push({
      event_name: eventName,
      count: nextUsers.size,
      conversion_rate: initialCount > 0 ? nextUsers.size / initialCount : 0,
      drop_off: prevCount - nextUsers.size,
    });

    currentUsers = nextUsers;
  }

  const lastStep = stepResults[stepResults.length - 1];
  const overallConversionRate =
    initialCount > 0 ? lastStep.count / initialCount : 0;

  res.json({
    steps: stepResults,
    overall_conversion_rate: overallConversionRate,
  });
});

export default router;
