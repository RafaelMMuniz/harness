import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, execute } from '../db.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'name is required'),
  type: z.enum(['trend', 'funnel'], { errorMap: () => ({ message: "type must be 'trend' or 'funnel'" }) }),
  config: z.record(z.any()),
});

function parseRow(row: Record<string, unknown>) {
  return {
    ...row,
    id: String(row.id),
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
  };
}

router.post('/', (req: Request, res: Response) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors.map((e: { message: string }) => e.message).join('; ') });
    return;
  }

  const { name, type, config } = parse.data;
  const now = new Date().toISOString();

  const result = execute(
    'INSERT INTO saved_analyses (name, type, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [name, type, JSON.stringify(config), now, now],
  );

  res.status(201).json({
    id: String(result.lastInsertRowid),
    name,
    type,
    config,
    created_at: now,
    updated_at: now,
  });
});

router.get('/', (_req: Request, res: Response) => {
  const rows = queryAll('SELECT * FROM saved_analyses ORDER BY updated_at DESC');
  res.json(rows.map(parseRow));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = queryOne('SELECT * FROM saved_analyses WHERE id = ?', [Number(req.params.id)]);
  if (!row) {
    res.status(404).json({ error: 'Saved analysis not found' });
    return;
  }
  res.json(parseRow(row));
});

router.delete('/:id', (req: Request, res: Response) => {
  const result = execute('DELETE FROM saved_analyses WHERE id = ?', [Number(req.params.id)]);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Saved analysis not found' });
    return;
  }
  res.json({ deleted: true });
});

export default router;
