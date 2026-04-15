import express from 'express';
import { initializeDatabase } from './db.js';

const app = express();
const PORT = 3001;

app.use(express.json());

initializeDatabase();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
