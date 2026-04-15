import express from 'express';
import cors from 'cors';
import { initializeDb } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

initializeDb();

app.listen(PORT, () => {
  console.log(`MiniPanel API running on port ${PORT}`);
});
