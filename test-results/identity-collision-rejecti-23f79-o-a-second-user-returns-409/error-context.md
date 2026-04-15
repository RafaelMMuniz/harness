# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: identity.spec.ts >> collision rejection: mapping a device to a second user returns 409
- Location: e2e/identity.spec.ts:59:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 201
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { createEvent, getEvents } from './helpers';
  3  | 
  4  | test('retroactive merge: anonymous events attributed to user after identity link', async ({ request }) => {
  5  |   // Seed 4 anonymous events for device X
  6  |   await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-X' });
  7  |   await createEvent(request, { event: 'button_clicked', device_id: 'test-identity-device-X' });
  8  |   await createEvent(request, { event: 'form_submitted', device_id: 'test-identity-device-X' });
  9  |   await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-X' });
  10 | 
  11 |   // 5th event links device X to user Y — triggers identity mapping
  12 |   await createEvent(request, {
  13 |     event: 'signup_completed',
  14 |     device_id: 'test-identity-device-X',
  15 |     user_id: 'test-identity-user-Y',
  16 |   });
  17 | 
  18 |   // Query all events for user Y — all 5 must appear
  19 |   const response = await getEvents(request, { user_id: 'test-identity-user-Y' });
  20 |   expect(response.status()).toBe(200);
  21 | 
  22 |   const body = await response.json();
  23 |   const events: unknown[] = Array.isArray(body) ? body : body.events ?? [];
  24 |   expect(events.length).toBeGreaterThanOrEqual(5);
  25 | });
  26 | 
  27 | test('multi-device merge: events from two devices both attributed to one user', async ({ request }) => {
  28 |   // Seed anonymous events for device A
  29 |   await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-A' });
  30 |   await createEvent(request, { event: 'button_clicked', device_id: 'test-identity-device-A' });
  31 | 
  32 |   // Seed anonymous events for device B
  33 |   await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-B' });
  34 |   await createEvent(request, { event: 'feature_used', device_id: 'test-identity-device-B' });
  35 | 
  36 |   // Link device A to user Z
  37 |   await createEvent(request, {
  38 |     event: 'login',
  39 |     device_id: 'test-identity-device-A',
  40 |     user_id: 'test-identity-user-Z',
  41 |   });
  42 | 
  43 |   // Link device B to user Z
  44 |   await createEvent(request, {
  45 |     event: 'login',
  46 |     device_id: 'test-identity-device-B',
  47 |     user_id: 'test-identity-user-Z',
  48 |   });
  49 | 
  50 |   // Query all events for user Z — events from both devices must appear
  51 |   const response = await getEvents(request, { user_id: 'test-identity-user-Z' });
  52 |   expect(response.status()).toBe(200);
  53 | 
  54 |   const body = await response.json();
  55 |   const events: unknown[] = Array.isArray(body) ? body : body.events ?? [];
  56 |   expect(events.length).toBeGreaterThanOrEqual(6);
  57 | });
  58 | 
  59 | test('collision rejection: mapping a device to a second user returns 409', async ({ request }) => {
  60 |   // First mapping: device C -> user P
  61 |   const firstLink = await createEvent(request, {
  62 |     event: 'signup_completed',
  63 |     device_id: 'test-identity-device-C',
  64 |     user_id: 'test-identity-user-P',
  65 |   });
> 66 |   expect(firstLink.status()).toBe(200);
     |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  67 | 
  68 |   // Attempt second mapping: device C -> user Q — must be rejected
  69 |   const secondLink = await createEvent(request, {
  70 |     event: 'signup_completed',
  71 |     device_id: 'test-identity-device-C',
  72 |     user_id: 'test-identity-user-Q',
  73 |   });
  74 |   expect(secondLink.status()).toBe(409);
  75 | });
  76 | 
  77 | test('unresolved device: events queryable by device_id when no user mapping exists', async ({ request }) => {
  78 |   // Seed events for device D — never create a user mapping
  79 |   await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-D' });
  80 |   await createEvent(request, { event: 'button_clicked', device_id: 'test-identity-device-D' });
  81 |   await createEvent(request, { event: 'page_viewed', device_id: 'test-identity-device-D' });
  82 | 
  83 |   // Query by device_id — should return only those events
  84 |   const response = await getEvents(request, { device_id: 'test-identity-device-D' });
  85 |   expect(response.status()).toBe(200);
  86 | 
  87 |   const body = await response.json();
  88 |   const events: unknown[] = Array.isArray(body) ? body : body.events ?? [];
  89 |   expect(events.length).toBeGreaterThanOrEqual(3);
  90 | });
  91 | 
```