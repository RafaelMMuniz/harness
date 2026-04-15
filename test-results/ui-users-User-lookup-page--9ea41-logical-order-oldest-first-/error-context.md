# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-users.spec.ts >> User lookup page >> event timeline displays events in chronological order (oldest first)
- Location: e2e/ui-users.spec.ts:70:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('user-event-timeline').getByTestId('timeline-event')
Expected: 4
Received: 8
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByTestId('user-event-timeline').getByTestId('timeline-event')
    9 × locator resolved to 8 elements
      - unexpected value "8"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]: MiniPanel
    - navigation [ref=e5]:
      - link "Events" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e7]
        - generic [ref=e9]: Events
      - link "Trends" [ref=e10] [cursor=pointer]:
        - /url: /trends
        - img [ref=e11]
        - generic [ref=e14]: Trends
      - link "Funnels" [ref=e15] [cursor=pointer]:
        - /url: /funnels
        - img [ref=e16]
        - generic [ref=e18]: Funnels
      - link "Users" [ref=e19] [cursor=pointer]:
        - /url: /users
        - img [ref=e20]
        - generic [ref=e25]: Users
      - link "Settings" [ref=e26] [cursor=pointer]:
        - /url: /settings
        - img [ref=e27]
        - generic [ref=e30]: Settings
  - main [ref=e31]:
    - generic [ref=e32]:
      - heading "Users" [level=1] [ref=e33]
      - generic [ref=e35]:
        - textbox "Search by user ID or device ID..." [ref=e36]: test-ui-users-user-1
        - button "Go" [ref=e37] [cursor=pointer]
      - generic [ref=e38]:
        - generic [ref=e39]:
          - 'heading "User: test-ui-users-user-1" [level=3] [ref=e41]'
          - generic [ref=e43]:
            - generic [ref=e44]: Devices
            - generic [ref=e46]: test-ui-users-device-1
            - generic [ref=e47]: First seen
            - generic [ref=e48]: Jan 15, 2024, 05:00:00 AM
            - generic [ref=e49]: Last seen
            - generic [ref=e50]: Jan 15, 2024, 05:15:00 AM
            - generic [ref=e51]: Events
            - generic [ref=e52]: "8"
        - generic [ref=e53]:
          - heading "Event Timeline(oldest → newest)" [level=3] [ref=e55]
          - generic [ref=e56]:
            - generic [ref=e57]:
              - generic [ref=e63]:
                - generic [ref=e64]:
                  - generic [ref=e65]: Jan 15, 2024, 05:00:00 AM
                  - generic [ref=e66]: page_viewed
                  - generic [ref=e67]:
                    - generic [ref=e68]: anonymous
                    - generic [ref=e69]: via test-ui-users-device-1
                - generic [ref=e70]:
                  - generic [ref=e71]:
                    - generic [ref=e72]: "url:"
                    - text: /home
                  - generic [ref=e73]:
                    - generic [ref=e74]: "referrer:"
                    - text: google.com
              - generic [ref=e80]:
                - generic [ref=e81]:
                  - generic [ref=e82]: Jan 15, 2024, 05:00:00 AM
                  - generic [ref=e83]: page_viewed
                  - generic [ref=e84]:
                    - generic [ref=e85]: anonymous
                    - generic [ref=e86]: via test-ui-users-device-1
                - generic [ref=e87]:
                  - generic [ref=e88]:
                    - generic [ref=e89]: "url:"
                    - text: /home
                  - generic [ref=e90]:
                    - generic [ref=e91]: "referrer:"
                    - text: google.com
              - generic [ref=e97]:
                - generic [ref=e98]:
                  - generic [ref=e99]: Jan 15, 2024, 05:05:00 AM
                  - generic [ref=e100]: button_clicked
                  - generic [ref=e101]:
                    - generic [ref=e102]: anonymous
                    - generic [ref=e103]: via test-ui-users-device-1
                - generic [ref=e104]:
                  - generic [ref=e105]:
                    - generic [ref=e106]: "button_name:"
                    - text: signup
                  - generic [ref=e107]:
                    - generic [ref=e108]: "section:"
                    - text: hero
              - generic [ref=e114]:
                - generic [ref=e115]:
                  - generic [ref=e116]: Jan 15, 2024, 05:05:00 AM
                  - generic [ref=e117]: button_clicked
                  - generic [ref=e118]:
                    - generic [ref=e119]: anonymous
                    - generic [ref=e120]: via test-ui-users-device-1
                - generic [ref=e121]:
                  - generic [ref=e122]:
                    - generic [ref=e123]: "button_name:"
                    - text: signup
                  - generic [ref=e124]:
                    - generic [ref=e125]: "section:"
                    - text: hero
              - generic [ref=e131]:
                - generic [ref=e132]:
                  - generic [ref=e133]: Jan 15, 2024, 05:10:00 AM
                  - generic [ref=e134]: form_submitted
                  - generic [ref=e135]:
                    - generic [ref=e136]: anonymous
                    - generic [ref=e137]: via test-ui-users-device-1
                - generic [ref=e138]:
                  - generic [ref=e139]:
                    - generic [ref=e140]: "form_id:"
                    - text: signup_form
                  - generic [ref=e141]:
                    - generic [ref=e142]: "step:"
                    - text: "1"
              - generic [ref=e148]:
                - generic [ref=e149]:
                  - generic [ref=e150]: Jan 15, 2024, 05:10:00 AM
                  - generic [ref=e151]: form_submitted
                  - generic [ref=e152]:
                    - generic [ref=e153]: anonymous
                    - generic [ref=e154]: via test-ui-users-device-1
                - generic [ref=e155]:
                  - generic [ref=e156]:
                    - generic [ref=e157]: "form_id:"
                    - text: signup_form
                  - generic [ref=e158]:
                    - generic [ref=e159]: "step:"
                    - text: "1"
              - generic [ref=e165]:
                - generic [ref=e166]:
                  - generic [ref=e167]: Jan 15, 2024, 05:15:00 AM
                  - generic [ref=e168]: signup_completed
                  - generic [ref=e170]: via test-ui-users-device-1
                - generic [ref=e172]:
                  - generic [ref=e173]: "plan:"
                  - text: free
              - generic [ref=e179]:
                - generic [ref=e180]:
                  - generic [ref=e181]: Jan 15, 2024, 05:15:00 AM
                  - generic [ref=e182]: signup_completed
                  - generic [ref=e184]: via test-ui-users-device-1
                - generic [ref=e186]:
                  - generic [ref=e187]: "plan:"
                  - text: free
            - generic [ref=e188]:
              - button "All events loaded" [disabled]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { createEvent } from './helpers';
  3   | 
  4   | const DEVICE_ID = 'test-ui-users-device-1';
  5   | const USER_ID = 'test-ui-users-user-1';
  6   | const UNKNOWN_ID = 'test-ui-users-unknown-999';
  7   | 
  8   | test.describe('User lookup page', () => {
  9   |   test.beforeAll(async ({ request }) => {
  10  |     // Seed 3 anonymous events for the test device
  11  |     await createEvent(request, {
  12  |       event: 'page_viewed',
  13  |       device_id: DEVICE_ID,
  14  |       timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
  15  |       properties: { url: '/home', referrer: 'google.com' },
  16  |     });
  17  |     await createEvent(request, {
  18  |       event: 'button_clicked',
  19  |       device_id: DEVICE_ID,
  20  |       timestamp: new Date('2024-01-15T10:05:00Z').toISOString(),
  21  |       properties: { button_name: 'signup', section: 'hero' },
  22  |     });
  23  |     await createEvent(request, {
  24  |       event: 'form_submitted',
  25  |       device_id: DEVICE_ID,
  26  |       timestamp: new Date('2024-01-15T10:10:00Z').toISOString(),
  27  |       properties: { form_id: 'signup_form', step: 1 },
  28  |     });
  29  | 
  30  |     // Seed the identity-linking event (device_id + user_id = creates mapping)
  31  |     await createEvent(request, {
  32  |       event: 'signup_completed',
  33  |       device_id: DEVICE_ID,
  34  |       user_id: USER_ID,
  35  |       timestamp: new Date('2024-01-15T10:15:00Z').toISOString(),
  36  |       properties: { plan: 'free' },
  37  |     });
  38  |   });
  39  | 
  40  |   test('Users page at /users shows a search input and a search button', async ({ page }) => {
  41  |     await page.goto('/users');
  42  | 
  43  |     const searchInput = page.getByTestId('user-search-input');
  44  |     const searchButton = page.getByTestId('user-search-button');
  45  | 
  46  |     await expect(searchInput).toBeVisible();
  47  |     await expect(searchButton).toBeVisible();
  48  |   });
  49  | 
  50  |   test('searching by user_id displays the resolved identity heading', async ({ page }) => {
  51  |     await page.goto('/users');
  52  | 
  53  |     await page.getByTestId('user-search-input').fill(USER_ID);
  54  |     await page.getByTestId('user-search-button').click();
  55  | 
  56  |     await expect(page.getByTestId('user-profile-heading')).toContainText(`User: ${USER_ID}`);
  57  |   });
  58  | 
  59  |   test('search result shows a list of associated device IDs', async ({ page }) => {
  60  |     await page.goto('/users');
  61  | 
  62  |     await page.getByTestId('user-search-input').fill(USER_ID);
  63  |     await page.getByTestId('user-search-button').click();
  64  | 
  65  |     const deviceList = page.getByTestId('user-device-list');
  66  |     await expect(deviceList).toBeVisible();
  67  |     await expect(deviceList).toContainText(DEVICE_ID);
  68  |   });
  69  | 
  70  |   test('event timeline displays events in chronological order (oldest first)', async ({ page }) => {
  71  |     await page.goto('/users');
  72  | 
  73  |     await page.getByTestId('user-search-input').fill(USER_ID);
  74  |     await page.getByTestId('user-search-button').click();
  75  | 
  76  |     const timeline = page.getByTestId('user-event-timeline');
  77  |     await expect(timeline).toBeVisible();
  78  | 
  79  |     const timelineItems = timeline.getByTestId('timeline-event');
> 80  |     await expect(timelineItems).toHaveCount(4); // 3 anonymous + 1 identifying
      |                                 ^ Error: expect(locator).toHaveCount(expected) failed
  81  | 
  82  |     // Extract timestamps from timeline items to verify ascending order
  83  |     const timestamps = await timelineItems.evaluateAll((items) =>
  84  |       items.map((item) => {
  85  |         const tsEl = item.querySelector('[data-testid="event-timestamp"]');
  86  |         return tsEl?.textContent?.trim() ?? '';
  87  |       }),
  88  |     );
  89  | 
  90  |     // Verify the sequence is chronological (sorted ascending)
  91  |     const sorted = [...timestamps].sort();
  92  |     expect(timestamps).toEqual(sorted);
  93  |   });
  94  | 
  95  |   test('each timeline event shows timestamp, event name, and expanded properties', async ({
  96  |     page,
  97  |   }) => {
  98  |     await page.goto('/users');
  99  | 
  100 |     await page.getByTestId('user-search-input').fill(USER_ID);
  101 |     await page.getByTestId('user-search-button').click();
  102 | 
  103 |     const timeline = page.getByTestId('user-event-timeline');
  104 |     await expect(timeline).toBeVisible();
  105 | 
  106 |     const firstEvent = timeline.getByTestId('timeline-event').first();
  107 | 
  108 |     // Each event row must show timestamp
  109 |     await expect(firstEvent.getByTestId('event-timestamp')).toBeVisible();
  110 |     // Each event row must show event name
  111 |     await expect(firstEvent.getByTestId('event-name')).toBeVisible();
  112 |     // Each event row must show properties (expanded key-value pairs)
  113 |     await expect(firstEvent.getByTestId('event-properties')).toBeVisible();
  114 |   });
  115 | 
  116 |   test('searching by device_id resolves to the mapped user and shows the full profile', async ({
  117 |     page,
  118 |   }) => {
  119 |     await page.goto('/users');
  120 | 
  121 |     // Search by device_id instead of user_id
  122 |     await page.getByTestId('user-search-input').fill(DEVICE_ID);
  123 |     await page.getByTestId('user-search-button').click();
  124 | 
  125 |     // Should resolve to the same user (retroactive merge)
  126 |     await expect(page.getByTestId('user-profile-heading')).toContainText(`User: ${USER_ID}`);
  127 | 
  128 |     // Profile must include the device in its cluster
  129 |     const deviceList = page.getByTestId('user-device-list');
  130 |     await expect(deviceList).toContainText(DEVICE_ID);
  131 | 
  132 |     // All 4 events (including anonymous ones) must appear in the timeline
  133 |     const timelineItems = page.getByTestId('user-event-timeline').getByTestId('timeline-event');
  134 |     await expect(timelineItems).toHaveCount(4);
  135 |   });
  136 | 
  137 |   test('searching for an unknown ID shows an empty state message', async ({ page }) => {
  138 |     await page.goto('/users');
  139 | 
  140 |     await page.getByTestId('user-search-input').fill(UNKNOWN_ID);
  141 |     await page.getByTestId('user-search-button').click();
  142 | 
  143 |     await expect(page.getByTestId('user-empty-state')).toBeVisible();
  144 |   });
  145 | });
  146 | 
```