import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import statsRouter from './routes/stats.js';
import trendsRouter from './routes/trends.js';
import funnelsRouter from './routes/funnels.js';
import usersRouter from './routes/users.js';
import savedAnalysesRouter from './routes/saved-analyses.js';
import propertiesRouter from './routes/properties.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

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

// --- Routes ---

app.use(eventsRouter);
app.use(statsRouter);
app.use(trendsRouter);
app.use(funnelsRouter);
app.use(usersRouter);
app.use(savedAnalysesRouter);
app.use(propertiesRouter);

// --- Error handling ---

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// --- Start ---

app.listen(PORT, () => {
  console.log(`MiniPanel backend running on http://localhost:${PORT}`);
});

export default app;
