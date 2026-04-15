import express from 'express';
import cors from 'cors';
import { initializeDb } from './db.js';
import { eventsRouter } from './routes/events.js';

export const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', eventsRouter);

initializeDb();

if (!process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`MiniPanel API running on port ${PORT}`);
  });
}
