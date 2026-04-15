import express from 'express';
import { initDb } from './db.js';

const app = express();
const PORT = 3001;

app.use(express.json());

// Initialize database on startup
initDb();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
