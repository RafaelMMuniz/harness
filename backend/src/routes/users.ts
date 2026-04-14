import { Router, type Request, type Response } from 'express';
import { queryAll } from '../db.js';
import { resolveIdentity, getEventsForUser, getEventsForDevice } from '../identity.js';

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { resolvedId, isUser } = resolveIdentity(id);

  if (isUser) {
    const devices = queryAll(
      'SELECT device_id FROM identity_mappings WHERE user_id = ?',
      [resolvedId],
    );

    const events = getEventsForUser(resolvedId);

    if (events.length === 0 && devices.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const timestamps = events.map(e => e.timestamp).sort();

    res.json({
      user_id: resolvedId,
      device_ids: devices.map(d => d.device_id as string),
      total_events: events.length,
      first_seen: timestamps[0] || null,
      last_seen: timestamps[timestamps.length - 1] || null,
      events,
    });
    return;
  }

  const events = getEventsForDevice(id);
  if (events.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const timestamps = events.map(e => e.timestamp).sort();
  res.json({
    user_id: id,
    device_ids: [id],
    total_events: events.length,
    first_seen: timestamps[0],
    last_seen: timestamps[timestamps.length - 1],
    events,
  });
});

export default router;
