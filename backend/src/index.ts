import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import statsRouter from './routes/stats.js';
import trendsRouter from './routes/trends.js';
import usersRouter from './routes/users.js';
import funnelsRouter from './routes/funnels.js';
import propertiesRouter from './routes/properties.js';
import savedAnalysesRouter from './routes/saved-analyses.js';
import { initDb, queryOne, execute, transaction } from './db.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${_res.statusCode} ${ms}ms`);
  });
  next();
});

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/users', usersRouter);
app.use('/api/funnels', funnelsRouter);
app.use('/api/events', propertiesRouter);
app.use('/api/saved-analyses', savedAnalysesRouter);

// Health check
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

function autoSeedIfEmpty() {
  const count = (queryOne('SELECT COUNT(*) as c FROM events') as { c: number } | undefined)?.c ?? 0;
  if (count > 0) return;

  console.log('Empty database — auto-seeding historical sample data...');
  const eventTypes = ['Page Viewed', 'Button Clicked', 'Sign Up Completed', 'Purchase Completed', 'Subscription Renewed'];
  const pages = ['/home', '/pricing', '/features', '/docs', '/blog'];
  const now = new Date();

  transaction(() => {
    for (let i = 0; i < 300; i++) {
      const daysAgo = 30 + Math.floor(i * 30 / 300); // 30-60 days ago
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(8 + (i % 14), (i * 17) % 60, 0);
      const eventName = eventTypes[i % eventTypes.length];
      const userId = i < 200 ? `seed-user-${i % 40}@example.com` : null;
      const deviceId = `seed-device-${i % 50}`;
      const props: Record<string, unknown> = { page: pages[i % pages.length] };
      if (eventName === 'Purchase Completed') {
        props.amount = 10 + (i % 50) * 5;
        props.currency = 'USD';
      }
      execute(
        'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)',
        [eventName, deviceId, userId, d.toISOString(), JSON.stringify(props)],
      );
      if (userId) {
        try {
          execute(
            'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)',
            [deviceId, userId, d.toISOString()],
          );
        } catch { /* ignore */ }
      }
    }
  });
  console.log('Auto-seeded 300 historical events (30-60 days ago)');
}

async function main() {
  await initDb();
  console.log('Database initialized');
  autoSeedIfEmpty();

  app.listen(PORT, () => {
    console.log(`MiniPanel backend running on port ${PORT}`);
  });
}

main().catch(console.error);

export { app };
