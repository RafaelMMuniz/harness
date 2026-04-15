# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-trends.spec.ts >> GET /api/trends — numeric aggregations >> measure=sum&property=amount returns data array with { date, value } and correct sums
- Location: e2e/api-trends.spec.ts:277:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 350
Received: 700
```

# Test source

```ts
  207 |       { event: EVENT, device_id: DEVICE, timestamp: TODAY },
  208 |       { event: EVENT, device_id: DEVICE, timestamp: TODAY },
  209 |       {
  210 |         event: 'test-trends-identity-link',
  211 |         device_id: DEVICE,
  212 |         user_id: USER,
  213 |         timestamp: TODAY,
  214 |       },
  215 |     ]);
  216 |   });
  217 | 
  218 |   test('device mapped to user counts as one unique_user, not multiple', async ({
  219 |     request,
  220 |   }) => {
  221 |     const response = await request.get(
  222 |       trendsUrl({ event_name: EVENT, granularity: 'day' }),
  223 |     );
  224 | 
  225 |     expect(response.status()).toBe(200);
  226 | 
  227 |     const body = await response.json();
  228 |     const data: { date: string; total_count: number; unique_users: number }[] =
  229 |       body.data;
  230 | 
  231 |     // Find the bucket for today
  232 |     const todayStr = new Date(TODAY).toISOString().slice(0, 10);
  233 |     const todayBucket = data.find((b) => b.date.startsWith(todayStr));
  234 | 
  235 |     expect(todayBucket).toBeDefined();
  236 |     // Three events but only one resolved identity
  237 |     expect(todayBucket!.total_count).toBeGreaterThanOrEqual(3);
  238 |     expect(todayBucket!.unique_users).toBe(1);
  239 |   });
  240 | });
  241 | 
  242 | // ---------------------------------------------------------------------------
  243 | // GET /api/trends — numeric aggregations (measure=sum / measure=avg)
  244 | // ---------------------------------------------------------------------------
  245 | 
  246 | test.describe('GET /api/trends — numeric aggregations', () => {
  247 |   const EVENT = 'test-trends-numeric-event';
  248 |   const DEVICE_A = 'test-trends-numeric-device-a';
  249 |   const DEVICE_B = 'test-trends-numeric-device-b';
  250 |   const TODAY = isoDate(0);
  251 | 
  252 |   test.beforeAll(async ({ request }) => {
  253 |     // Seed events with known amounts so we can verify sum/avg
  254 |     // Today: 100 + 200 + 50 = 350 sum, avg = 116.67
  255 |     await createBatchEvents(request, [
  256 |       {
  257 |         event: EVENT,
  258 |         device_id: DEVICE_A,
  259 |         timestamp: TODAY,
  260 |         properties: { amount: 100 },
  261 |       },
  262 |       {
  263 |         event: EVENT,
  264 |         device_id: DEVICE_A,
  265 |         timestamp: TODAY,
  266 |         properties: { amount: 200 },
  267 |       },
  268 |       {
  269 |         event: EVENT,
  270 |         device_id: DEVICE_B,
  271 |         timestamp: TODAY,
  272 |         properties: { amount: 50 },
  273 |       },
  274 |     ]);
  275 |   });
  276 | 
  277 |   test('measure=sum&property=amount returns data array with { date, value } and correct sums', async ({
  278 |     request,
  279 |   }) => {
  280 |     const response = await request.get(
  281 |       trendsUrl({
  282 |         event_name: EVENT,
  283 |         granularity: 'day',
  284 |         measure: 'sum',
  285 |         property: 'amount',
  286 |       }),
  287 |     );
  288 | 
  289 |     expect(response.status()).toBe(200);
  290 | 
  291 |     const body = await response.json();
  292 |     expect(Array.isArray(body.data)).toBe(true);
  293 |     expect(body.data.length).toBeGreaterThan(0);
  294 | 
  295 |     // Every bucket must have date and value
  296 |     for (const bucket of body.data) {
  297 |       expect(typeof bucket.date).toBe('string');
  298 |       expect(typeof bucket.value).toBe('number');
  299 |     }
  300 | 
  301 |     // Today's bucket must sum to 350
  302 |     const todayStr = new Date(TODAY).toISOString().slice(0, 10);
  303 |     const todayBucket = body.data.find((b: { date: string }) =>
  304 |       b.date.startsWith(todayStr),
  305 |     );
  306 |     expect(todayBucket).toBeDefined();
> 307 |     expect(todayBucket.value).toBe(350);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  308 |   });
  309 | 
  310 |   test('measure=avg&property=amount returns averaged values per bucket', async ({
  311 |     request,
  312 |   }) => {
  313 |     const response = await request.get(
  314 |       trendsUrl({
  315 |         event_name: EVENT,
  316 |         granularity: 'day',
  317 |         measure: 'avg',
  318 |         property: 'amount',
  319 |       }),
  320 |     );
  321 | 
  322 |     expect(response.status()).toBe(200);
  323 | 
  324 |     const body = await response.json();
  325 |     expect(Array.isArray(body.data)).toBe(true);
  326 | 
  327 |     // Today: (100 + 200 + 50) / 3 = 116.666...
  328 |     const todayStr = new Date(TODAY).toISOString().slice(0, 10);
  329 |     const todayBucket = body.data.find((b: { date: string }) =>
  330 |       b.date.startsWith(todayStr),
  331 |     );
  332 |     expect(todayBucket).toBeDefined();
  333 |     expect(todayBucket.value).toBeCloseTo(116.67, 1);
  334 |   });
  335 | 
  336 |   test('measure=sum without property param returns 400', async ({ request }) => {
  337 |     const response = await request.get(
  338 |       trendsUrl({ event_name: EVENT, granularity: 'day', measure: 'sum' }),
  339 |     );
  340 | 
  341 |     expect(response.status()).toBe(400);
  342 | 
  343 |     const body = await response.json();
  344 |     expect(typeof body.error).toBe('string');
  345 |     expect(body.error.length).toBeGreaterThan(0);
  346 |   });
  347 | 
  348 |   test('measure=sum on a non-numeric property returns 400', async ({
  349 |     request,
  350 |   }) => {
  351 |     // Seed an event with a clearly string property
  352 |     await createEvent(request, {
  353 |       event: EVENT,
  354 |       device_id: DEVICE_A,
  355 |       timestamp: TODAY,
  356 |       properties: { label: 'hello' },
  357 |     });
  358 | 
  359 |     const response = await request.get(
  360 |       trendsUrl({
  361 |         event_name: EVENT,
  362 |         granularity: 'day',
  363 |         measure: 'sum',
  364 |         property: 'label',
  365 |       }),
  366 |     );
  367 | 
  368 |     expect(response.status()).toBe(400);
  369 | 
  370 |     const body = await response.json();
  371 |     expect(typeof body.error).toBe('string');
  372 |     expect(body.error.length).toBeGreaterThan(0);
  373 |   });
  374 | });
  375 | 
  376 | // ---------------------------------------------------------------------------
  377 | // GET /api/trends — breakdown_by
  378 | // ---------------------------------------------------------------------------
  379 | 
  380 | test.describe('GET /api/trends — breakdown_by', () => {
  381 |   const EVENT = 'test-trends-breakdown-event';
  382 |   // 6 distinct values so top-5 + __other__ grouping is exercised
  383 |   const PAGES = ['/home', '/pricing', '/docs', '/blog', '/about', '/contact'];
  384 | 
  385 |   test.beforeAll(async ({ request }) => {
  386 |     const TODAY = isoDate(0);
  387 |     const events: EventPayload[] = [];
  388 | 
  389 |     // Seed 3 events per page value (18 events total, 6 distinct page values)
  390 |     for (const page of PAGES) {
  391 |       for (let i = 0; i < 3; i++) {
  392 |         events.push({
  393 |           event: EVENT,
  394 |           device_id: `test-trends-breakdown-device-${page.replace(/\//g, '')}-${i}`,
  395 |           timestamp: TODAY,
  396 |           properties: { page },
  397 |         });
  398 |       }
  399 |     }
  400 | 
  401 |     await createBatchEvents(request, events);
  402 |   });
  403 | 
  404 |   test('breakdown_by=property returns { series: [{ key, data }] } with top 5 plus __other__', async ({
  405 |     request,
  406 |   }) => {
  407 |     const response = await request.get(
```