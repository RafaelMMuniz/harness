import { request } from '@playwright/test';

export default async function globalSetup() {
  // Wait for server to be ready, then reset the database
  const ctx = await request.newContext();
  for (let i = 0; i < 10; i++) {
    try {
      const res = await ctx.post('http://localhost:3001/api/test/reset');
      if (res.ok()) break;
    } catch {
      // Server not ready yet, wait and retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  await ctx.dispose();
}
