import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb, debouncedSave } from '../db.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  config: z.record(z.unknown()),
});

function nowISO(): string {
  return new Date().toISOString();
}

// ── POST /api/saved-analyses ─────────────────────────────────────────

router.post('/', (req: Request, res: Response): void => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { name, type, config } = parsed.data;
  const db = getDb();
  const now = nowISO();

  db.run(
    `INSERT INTO saved_analyses (name, type, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [name, type, JSON.stringify(config), now, now]
  );

  const idResult = db.exec(`SELECT last_insert_rowid() AS id`);
  const id = idResult[0].values[0][0] as number;

  debouncedSave();

  res.status(201).json({
    id,
    name,
    type,
    config,
    created_at: now,
    updated_at: now,
  });
});

// ── GET /api/saved-analyses ──────────────────────────────────────────

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb();
  const result = db.exec(
    `SELECT id, name, type, config, created_at, updated_at
     FROM saved_analyses
     ORDER BY updated_at DESC`
  );

  if (result.length === 0) {
    res.json([]);
    return;
  }

  const analyses = result[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    type: row[2] as string,
    config: JSON.parse(row[3] as string),
    created_at: row[4] as string,
    updated_at: row[5] as string,
  }));

  res.json(analyses);
});

// ── GET /api/saved-analyses/:id ──────────────────────────────────────

router.get('/:id', (req: Request, res: Response): void => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const db = getDb();
  const result = db.exec(
    `SELECT id, name, type, config, created_at, updated_at
     FROM saved_analyses WHERE id = ?`,
    [id]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    res.status(404).json({ error: 'Saved analysis not found' });
    return;
  }

  const row = result[0].values[0];
  res.json({
    id: row[0] as number,
    name: row[1] as string,
    type: row[2] as string,
    config: JSON.parse(row[3] as string),
    created_at: row[4] as string,
    updated_at: row[5] as string,
  });
});

// ── DELETE /api/saved-analyses/:id ───────────────────────────────────

router.delete('/:id', (req: Request, res: Response): void => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const db = getDb();

  // Check existence first
  const existing = db.exec(
    `SELECT id FROM saved_analyses WHERE id = ?`,
    [id]
  );
  if (existing.length === 0 || existing[0].values.length === 0) {
    res.status(404).json({ error: 'Saved analysis not found' });
    return;
  }

  db.run(`DELETE FROM saved_analyses WHERE id = ?`, [id]);
  debouncedSave();

  res.status(200).json({ deleted: true });
});

export default router;
