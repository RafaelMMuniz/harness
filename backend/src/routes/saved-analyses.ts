import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';

const router = Router();

const createAnalysisSchema = z.object({
  name: z.string().min(1, 'name is required'),
  type: z.enum(['trend', 'funnel'], {
    errorMap: () => ({ message: "type must be 'trend' or 'funnel'" }),
  }),
  config: z.record(z.unknown()),
});

/**
 * POST /api/saved-analyses - Create a saved analysis
 */
router.post('/api/saved-analyses', (req: Request, res: Response): void => {
  const parsed = createAnalysisSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  const db = getDb();
  const { name, type, config } = parsed.data;
  const now = new Date().toISOString();
  const configJson = JSON.stringify(config);

  const result = db
    .prepare(
      'INSERT INTO saved_analyses (name, type, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, type, configJson, now, now);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    type,
    config,
    created_at: now,
    updated_at: now,
  });
});

/**
 * GET /api/saved-analyses - List all saved analyses
 */
router.get('/api/saved-analyses', (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM saved_analyses ORDER BY updated_at DESC')
    .all() as Array<{
    id: number;
    name: string;
    type: string;
    config: string;
    created_at: string;
    updated_at: string;
  }>;

  const analyses = rows.map((row) => ({
    ...row,
    config: JSON.parse(row.config),
  }));

  res.json(analyses);
});

/**
 * GET /api/saved-analyses/:id - Get a single saved analysis
 */
router.get('/api/saved-analyses/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const row = db.prepare('SELECT * FROM saved_analyses WHERE id = ?').get(id) as
    | {
        id: number;
        name: string;
        type: string;
        config: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Saved analysis not found' });
    return;
  }

  res.json({
    ...row,
    config: JSON.parse(row.config),
  });
});

/**
 * DELETE /api/saved-analyses/:id - Delete a saved analysis
 */
router.delete('/api/saved-analyses/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const result = db.prepare('DELETE FROM saved_analyses WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Saved analysis not found' });
    return;
  }

  res.status(204).send();
});

export default router;
