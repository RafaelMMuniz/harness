import express from 'express';
import cors from 'cors';
import { initDatabase, getDb, flushSave, saveDb } from './db.js';
import { seed } from './seed.js';
import eventsRouter from './routes/events.js';
import queriesRouter, { overviewHandler } from './routes/queries.js';
import usersRouter from './routes/users.js';
import trendsRouter from './routes/trends.js';
import propertiesRouter from './routes/properties.js';
import funnelsRouter from './routes/funnels.js';
import savedRouter from './routes/saved.js';

const app = express();
const PORT = 3001;

// ── Middleware ────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ── Routes ───────────────────────────────────────────────────────────

app.use('/api/events', eventsRouter);
app.use('/api/events', queriesRouter);
app.use('/api/events', propertiesRouter);
app.use('/api/stats', (_req, _res, next) => next());
app.get('/api/stats/overview', overviewHandler);
app.use('/api/users', usersRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/funnels', funnelsRouter);
app.use('/api/saved-analyses', savedRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Test reset endpoint — clears all data and persists clean state
app.post('/api/test/reset', (_req, res) => {
  const db = getDb();
  db.run('DELETE FROM events');
  db.run('DELETE FROM identity_mappings');
  db.run('DELETE FROM saved_analyses');
  flushSave();
  saveDb();
  res.json({ status: 'ok' });
});

// ── Start ────────────────────────────────────────────────────────────

async function main() {
  await initDatabase();

  // Auto-seed on empty DB so a fresh clone shows data immediately.
  // Also makes the app usable without remembering to run `npm run seed` first.
  const db = getDb();
  const countResult = db.exec('SELECT COUNT(*) FROM events');
  const eventCount = (countResult[0]?.values[0][0] as number) ?? 0;
  if (eventCount === 0) {
    console.log('Empty database detected — seeding sample data (one-time setup)...');
    await seed();
    console.log('Auto-seed complete.');
  }

  app.listen(PORT, () => {
    console.log(`MiniPanel server running on port ${PORT}`);
  });

  // Flush pending writes on shutdown
  process.on('SIGINT', () => {
    flushSave();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    flushSave();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start MiniPanel server:', err);
  process.exit(1);
});

export { app };
