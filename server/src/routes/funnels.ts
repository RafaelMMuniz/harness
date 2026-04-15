import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';

const router = Router();

const funnelQuerySchema = z.object({
  steps: z.array(z.string().min(1)).min(2).max(5),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// ── POST /api/funnels/query ──────────────────────────────────────────

router.post('/query', (req: Request, res: Response): void => {
  const parsed = funnelQuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { steps } = parsed.data;
  const db = getDb();

  // Default date range: last 30 days
  const startDate = parsed.data.start_date ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();
  const endDate = parsed.data.end_date ?? new Date().toISOString().slice(0, 10);
  const endDateFilter = endDate + 'T23:59:59.999Z';

  // For each step, get all (resolved_identity, min_timestamp) pairs
  // resolved_identity = COALESCE(im.user_id, e.user_id, e.device_id)
  type StepUser = { resolvedId: string; minTimestamp: string };

  function getUsersForStep(eventName: string, afterTimestamps?: Map<string, string>): Map<string, string> {
    const result = db.exec(
      `SELECT COALESCE(im.user_id, e.user_id, e.device_id) AS resolved_id,
              MIN(e.timestamp) AS min_ts
       FROM events e
       LEFT JOIN identity_mappings im ON e.device_id = im.device_id
       WHERE e.event_name = ? AND e.timestamp >= ? AND e.timestamp <= ?
       GROUP BY resolved_id
       ORDER BY min_ts`,
      [eventName, startDate, endDateFilter]
    );

    const users = new Map<string, string>();
    if (result.length === 0) return users;

    for (const row of result[0].values) {
      const resolvedId = row[0] as string;
      const minTs = row[1] as string;

      if (afterTimestamps) {
        // Only include users who performed this step AFTER their previous step
        const prevTs = afterTimestamps.get(resolvedId);
        if (!prevTs) continue; // Not in previous step

        // Need to find the earliest event for this user AFTER prevTs
        const afterResult = db.exec(
          `SELECT MIN(e.timestamp) AS min_ts
           FROM events e
           LEFT JOIN identity_mappings im ON e.device_id = im.device_id
           WHERE e.event_name = ?
             AND e.timestamp >= ? AND e.timestamp <= ?
             AND e.timestamp > ?
             AND COALESCE(im.user_id, e.user_id, e.device_id) = ?`,
          [eventName, startDate, endDateFilter, prevTs, resolvedId]
        );

        if (afterResult.length > 0 && afterResult[0].values.length > 0 && afterResult[0].values[0][0] != null) {
          users.set(resolvedId, afterResult[0].values[0][0] as string);
        }
      } else {
        users.set(resolvedId, minTs);
      }
    }

    return users;
  }

  // Walk through funnel steps
  const stepResults: Array<{ event_name: string; users: Map<string, string> }> = [];

  for (let i = 0; i < steps.length; i++) {
    const eventName = steps[i];
    const prevTimestamps = i === 0 ? undefined : stepResults[i - 1].users;
    const users = getUsersForStep(eventName, prevTimestamps);
    stepResults.push({ event_name: eventName, users });
  }

  // Build response
  const step0Count = stepResults[0].users.size;

  const responseSteps = stepResults.map((step, i) => {
    const count = step.users.size;
    const conversionRate = step0Count === 0 ? 0 : (i === 0 ? 1.0 : count / step0Count);
    const dropOff = i === 0 ? 0 : stepResults[i - 1].users.size - count;

    return {
      event_name: step.event_name,
      count,
      conversion_rate: conversionRate,
      drop_off: dropOff,
    };
  });

  const overallConversionRate = step0Count === 0
    ? 0
    : stepResults[stepResults.length - 1].users.size / step0Count;

  res.json({
    steps: responseSteps,
    overall_conversion_rate: overallConversionRate,
  });
});

export default router;
