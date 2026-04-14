/**
 * Test server helper — creates a fresh Express app backed by a temp SQLite DB.
 * Each test file gets its own isolated server + database.
 */
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

let server: Server | null = null;
let baseUrl = '';
let dbPath = '';

export async function startTestServer(): Promise<string> {
  // Unique temp DB per test file (process-isolated via vitest forks)
  dbPath = path.join(os.tmpdir(), `minipanel-test-${process.pid}-${Date.now()}.db`);
  process.env.DB_PATH = dbPath;

  // Dynamic imports so the db module picks up DB_PATH before initializing
  const { initDb } = await import('../db.js');
  await initDb();

  const { default: eventsRouter } = await import('../routes/events.js');
  const { default: statsRouter } = await import('../routes/stats.js');
  const { default: trendsRouter } = await import('../routes/trends.js');
  const { default: usersRouter } = await import('../routes/users.js');
  const { default: funnelsRouter } = await import('../routes/funnels.js');
  const { default: propertiesRouter } = await import('../routes/properties.js');
  const { default: savedAnalysesRouter } = await import('../routes/saved-analyses.js');

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/events', eventsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/trends', trendsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/funnels', funnelsRouter);
  app.use('/api/events', propertiesRouter);
  app.use('/api/saved-analyses', savedAnalysesRouter);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const addr = server!.address() as AddressInfo;
      baseUrl = `http://localhost:${addr.port}`;
      resolve(baseUrl);
    });
  });
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
  try {
    const { closeDb } = await import('../db.js');
    closeDb();
  } catch { /* ignore */ }
  if (dbPath && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

export function getBaseUrl(): string {
  return baseUrl;
}

/** Helper to POST JSON to an endpoint */
export async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Helper to GET an endpoint with optional query params */
export async function get(path: string, params?: Record<string, string>): Promise<Response> {
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return fetch(url.toString());
}

/** Helper to DELETE an endpoint */
export async function del(path: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { method: 'DELETE' });
}
