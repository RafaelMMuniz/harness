# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-events.spec.ts >> Event Explorer UI >> empty state message appears when filters match no events
- Location: e2e/ui-events.spec.ts:277:7

# Error details

```
TimeoutError: locator.selectOption: Timeout 5000ms exceeded.
Call log:
  - waiting for getByTestId('filter-event-name')
    - locator resolved to <select data-testid="filter-event-name" class="flex h-9 items-center rounded border bg-white px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-52 border-neutral-300 text-neutral-900">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    8 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 500ms

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
      - heading "Events" [level=1] [ref=e33]
      - generic [ref=e35]:
        - combobox [ref=e36]:
          - option "All Events" [selected]
          - option "api-events-all-fields"
          - option "api-events-batch-event-a"
          - option "api-events-batch-event-b"
          - option "api-events-batch-event-c"
          - option "api-events-batch-mix-valid-1"
          - option "api-events-batch-mix-valid-2"
          - option "api-events-minimal-device"
          - option "api-events-minimal-user"
          - option "api-events-no-timestamp"
          - option "api-events-properties-roundtrip"
          - option "api-queries-button-click"
          - option "api-queries-count-check"
          - option "api-queries-page-view"
          - option "api-queries-purchase"
          - option "api-queries-signup"
          - option "Button Clicked"
          - option "button_clicked"
          - option "feature_used"
          - option "form_submitted"
          - option "login"
          - option "Page Viewed"
          - option "page_viewed"
          - option "Purchase Completed"
          - option "Sign Up Completed"
          - option "signup_completed"
          - option "Subscription Renewed"
          - option "test-funnels-step1-page_viewed"
          - option "test-funnels-step2-signup_completed"
          - option "test-funnels-step3-purchase_completed"
          - option "test-props-shape-event"
          - option "test-props-types-event"
          - option "test-trends-breakdown-event"
          - option "test-trends-granularity-event"
          - option "test-trends-identity-event"
          - option "test-trends-identity-link"
          - option "test-trends-numeric-event"
          - option "test-trends-shape-event"
          - option "test-trends-zerofill-event"
          - option "test-ui-enhanced-Button Clicked"
          - option "test-ui-enhanced-Feature Used"
          - option "test-ui-enhanced-Login"
          - option "test-ui-enhanced-Page Viewed"
          - option "test-ui-enhanced-Purchase Completed"
          - option "test-ui-enhanced-Signup Completed"
          - option "test-ui-events-Button Clicked"
          - option "test-ui-events-Page Viewed"
          - option "test-ui-events-Purchase Completed"
          - option "test-ui-funnels-Page Viewed"
          - option "test-ui-funnels-Purchase Completed"
          - option "test-ui-funnels-Signup Clicked"
          - option "test-ui-trends-page-viewed"
          - option "test-ui-trends-purchase-completed"
        - textbox [ref=e37]
        - textbox [ref=e38]
        - button "Apply" [ref=e39] [cursor=pointer]
      - generic [ref=e40]:
        - table [ref=e42]:
          - rowgroup [ref=e43]:
            - row "Timestamp Event User Properties" [ref=e44]:
              - columnheader "Timestamp" [ref=e45]
              - columnheader "Event" [ref=e46]
              - columnheader "User" [ref=e47]
              - columnheader "Properties" [ref=e48]
          - rowgroup [ref=e49]:
            - 'row "Apr 15, 2026, 02:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u2 page: /signup, referrer: direct +1" [ref=e50] [cursor=pointer]':
              - cell "Apr 15, 2026, 02:00:00 PM" [ref=e51]
              - cell "test-ui-events-Page Viewed" [ref=e52]
              - cell "test-ui-events-user-u2" [ref=e53]
              - 'cell "page: /signup, referrer: direct +1" [ref=e54]':
                - generic [ref=e55]: "page: /signup, referrer: direct +1"
            - 'row "Apr 15, 2026, 02:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u2 page: /signup, referrer: direct +1" [ref=e56] [cursor=pointer]':
              - cell "Apr 15, 2026, 02:00:00 PM" [ref=e57]
              - cell "test-ui-events-Page Viewed" [ref=e58]
              - cell "test-ui-events-user-u2" [ref=e59]
              - 'cell "page: /signup, referrer: direct +1" [ref=e60]':
                - generic [ref=e61]: "page: /signup, referrer: direct +1"
            - 'row "Apr 15, 2026, 02:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u2 page: /signup, referrer: direct +1" [ref=e62] [cursor=pointer]':
              - cell "Apr 15, 2026, 02:00:00 PM" [ref=e63]
              - cell "test-ui-events-Page Viewed" [ref=e64]
              - cell "test-ui-events-user-u2" [ref=e65]
              - 'cell "page: /signup, referrer: direct +1" [ref=e66]':
                - generic [ref=e67]: "page: /signup, referrer: direct +1"
            - 'row "Apr 15, 2026, 02:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u2 page: /signup, referrer: direct +1" [ref=e68] [cursor=pointer]':
              - cell "Apr 15, 2026, 02:00:00 PM" [ref=e69]
              - cell "test-ui-events-Page Viewed" [ref=e70]
              - cell "test-ui-events-user-u2" [ref=e71]
              - 'cell "page: /signup, referrer: direct +1" [ref=e72]':
                - generic [ref=e73]: "page: /signup, referrer: direct +1"
            - 'row "Apr 14, 2026, 09:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-5 duration_ms: 1115, page: /pricing" [ref=e74] [cursor=pointer]':
              - cell "Apr 14, 2026, 09:15:27 PM" [ref=e75]
              - cell "test-ui-trends-page-viewed" [ref=e76]
              - cell "test-ui-trends-user-5" [ref=e77]
              - 'cell "duration_ms: 1115, page: /pricing" [ref=e78]':
                - generic [ref=e79]: "duration_ms: 1115, page: /pricing"
            - 'row "Apr 14, 2026, 06:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-4 duration_ms: 992, page: /home" [ref=e80] [cursor=pointer]':
              - cell "Apr 14, 2026, 06:15:27 PM" [ref=e81]
              - cell "test-ui-trends-page-viewed" [ref=e82]
              - cell "test-ui-trends-user-4" [ref=e83]
              - 'cell "duration_ms: 992, page: /home" [ref=e84]':
                - generic [ref=e85]: "duration_ms: 992, page: /home"
            - 'row "Apr 14, 2026, 03:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-3 duration_ms: 869, page: /blog" [ref=e86] [cursor=pointer]':
              - cell "Apr 14, 2026, 03:15:27 PM" [ref=e87]
              - cell "test-ui-trends-page-viewed" [ref=e88]
              - cell "test-ui-trends-user-3" [ref=e89]
              - 'cell "duration_ms: 869, page: /blog" [ref=e90]':
                - generic [ref=e91]: "duration_ms: 869, page: /blog"
            - 'row "Apr 14, 2026, 03:00:00 PM test-ui-enhanced-Page Viewed test-ui-enhanced-user@example.com page: /dashboard" [ref=e92] [cursor=pointer]':
              - cell "Apr 14, 2026, 03:00:00 PM" [ref=e93]
              - cell "test-ui-enhanced-Page Viewed" [ref=e94]
              - cell "test-ui-enhanced-user@example.com" [ref=e95]
              - 'cell "page: /dashboard" [ref=e96]':
                - generic [ref=e97]: "page: /dashboard"
            - row "Apr 14, 2026, 02:27:18 PM page_viewed test-identity-device-D —" [ref=e98] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:18 PM" [ref=e99]
              - cell "page_viewed" [ref=e100]
              - cell "test-identity-device-D" [ref=e101]
              - cell "—" [ref=e102]
            - row "Apr 14, 2026, 02:27:18 PM button_clicked test-identity-device-D —" [ref=e103] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:18 PM" [ref=e104]
              - cell "button_clicked" [ref=e105]
              - cell "test-identity-device-D" [ref=e106]
              - cell "—" [ref=e107]
            - row "Apr 14, 2026, 02:27:17 PM page_viewed test-identity-device-D —" [ref=e108] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:17 PM" [ref=e109]
              - cell "page_viewed" [ref=e110]
              - cell "test-identity-device-D" [ref=e111]
              - cell "—" [ref=e112]
            - row "Apr 14, 2026, 02:27:15 PM signup_completed test-identity-user-P —" [ref=e113] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e114]
              - cell "signup_completed" [ref=e115]
              - cell "test-identity-user-P" [ref=e116]
              - cell "—" [ref=e117]
            - row "Apr 14, 2026, 02:27:15 PM login test-identity-user-Z —" [ref=e118] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e119]
              - cell "login" [ref=e120]
              - cell "test-identity-user-Z" [ref=e121]
              - cell "—" [ref=e122]
            - row "Apr 14, 2026, 02:27:15 PM login test-identity-user-Z —" [ref=e123] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e124]
              - cell "login" [ref=e125]
              - cell "test-identity-user-Z" [ref=e126]
              - cell "—" [ref=e127]
            - row "Apr 14, 2026, 02:27:15 PM feature_used test-identity-device-B —" [ref=e128] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e129]
              - cell "feature_used" [ref=e130]
              - cell "test-identity-device-B" [ref=e131]
              - cell "—" [ref=e132]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-B —" [ref=e133] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e134]
              - cell "page_viewed" [ref=e135]
              - cell "test-identity-device-B" [ref=e136]
              - cell "—" [ref=e137]
            - row "Apr 14, 2026, 02:27:15 PM button_clicked test-identity-device-A —" [ref=e138] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e139]
              - cell "button_clicked" [ref=e140]
              - cell "test-identity-device-A" [ref=e141]
              - cell "—" [ref=e142]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-A —" [ref=e143] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e144]
              - cell "page_viewed" [ref=e145]
              - cell "test-identity-device-A" [ref=e146]
              - cell "—" [ref=e147]
            - row "Apr 14, 2026, 02:27:15 PM signup_completed test-identity-user-Y —" [ref=e148] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e149]
              - cell "signup_completed" [ref=e150]
              - cell "test-identity-user-Y" [ref=e151]
              - cell "—" [ref=e152]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-X —" [ref=e153] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e154]
              - cell "page_viewed" [ref=e155]
              - cell "test-identity-device-X" [ref=e156]
              - cell "—" [ref=e157]
            - row "Apr 14, 2026, 02:27:15 PM form_submitted test-identity-device-X —" [ref=e158] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e159]
              - cell "form_submitted" [ref=e160]
              - cell "test-identity-device-X" [ref=e161]
              - cell "—" [ref=e162]
            - row "Apr 14, 2026, 02:27:15 PM button_clicked test-identity-device-X —" [ref=e163] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e164]
              - cell "button_clicked" [ref=e165]
              - cell "test-identity-device-X" [ref=e166]
              - cell "—" [ref=e167]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-X —" [ref=e168] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e169]
              - cell "page_viewed" [ref=e170]
              - cell "test-identity-device-X" [ref=e171]
              - cell "—" [ref=e172]
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-types-event test-props-types-device-3 amount: 199.99, quantity: 1 +3" [ref=e173] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e174]
              - cell "test-props-types-event" [ref=e175]
              - cell "test-props-types-device-3" [ref=e176]
              - 'cell "amount: 199.99, quantity: 1 +3" [ref=e177]':
                - generic [ref=e178]: "amount: 199.99, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-types-event test-props-types-device-2 amount: 29, quantity: 10 +3" [ref=e179] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e180]
              - cell "test-props-types-event" [ref=e181]
              - cell "test-props-types-device-2" [ref=e182]
              - 'cell "amount: 29, quantity: 10 +3" [ref=e183]':
                - generic [ref=e184]: "amount: 29, quantity: 10 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-types-event test-props-types-device-1 amount: 99.99, quantity: 3 +3" [ref=e185] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e186]
              - cell "test-props-types-event" [ref=e187]
              - cell "test-props-types-device-1" [ref=e188]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e189]':
                - generic [ref=e190]: "amount: 99.99, quantity: 3 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-shape-event test-props-shape-device-3 amount: 149.5, quantity: 5 +3" [ref=e191] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e192]
              - cell "test-props-shape-event" [ref=e193]
              - cell "test-props-shape-device-3" [ref=e194]
              - 'cell "amount: 149.5, quantity: 5 +3" [ref=e195]':
                - generic [ref=e196]: "amount: 149.5, quantity: 5 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-shape-event test-props-shape-device-2 amount: 49, quantity: 1 +3" [ref=e197] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e198]
              - cell "test-props-shape-event" [ref=e199]
              - cell "test-props-shape-device-2" [ref=e200]
              - 'cell "amount: 49, quantity: 1 +3" [ref=e201]':
                - generic [ref=e202]: "amount: 49, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-shape-event test-props-shape-device-1 amount: 99.99, quantity: 3 +3" [ref=e203] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e204]
              - cell "test-props-shape-event" [ref=e205]
              - cell "test-props-shape-device-1" [ref=e206]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e207]':
                - generic [ref=e208]: "amount: 99.99, quantity: 3 +3"
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-mix-valid-2 api-events-batch-user-2 —" [ref=e209] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e210]
              - cell "api-events-batch-mix-valid-2" [ref=e211]
              - cell "api-events-batch-user-2" [ref=e212]
              - cell "—" [ref=e213]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-mix-valid-1 api-events-batch-device-3 —" [ref=e214] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e215]
              - cell "api-events-batch-mix-valid-1" [ref=e216]
              - cell "api-events-batch-device-3" [ref=e217]
              - cell "—" [ref=e218]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-event-c api-events-batch-user-1 —" [ref=e219] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e220]
              - cell "api-events-batch-event-c" [ref=e221]
              - cell "api-events-batch-user-1" [ref=e222]
              - cell "—" [ref=e223]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-event-b api-events-batch-device-2 —" [ref=e224] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e225]
              - cell "api-events-batch-event-b" [ref=e226]
              - cell "api-events-batch-device-2" [ref=e227]
              - cell "—" [ref=e228]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-event-a api-events-batch-device-1 —" [ref=e229] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e230]
              - cell "api-events-batch-event-a" [ref=e231]
              - cell "api-events-batch-device-1" [ref=e232]
              - cell "—" [ref=e233]
            - 'row "Apr 14, 2026, 02:27:12 PM api-events-properties-roundtrip api-events-device-5 page: /home, duration_ms: 1234 +1" [ref=e234] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e235]
              - cell "api-events-properties-roundtrip" [ref=e236]
              - cell "api-events-device-5" [ref=e237]
              - 'cell "page: /home, duration_ms: 1234 +1" [ref=e238]':
                - generic [ref=e239]: "page: /home, duration_ms: 1234 +1"
            - row "Apr 14, 2026, 02:27:12 PM api-events-no-timestamp api-events-device-4 —" [ref=e240] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e241]
              - cell "api-events-no-timestamp" [ref=e242]
              - cell "api-events-device-4" [ref=e243]
              - cell "—" [ref=e244]
            - row "Apr 14, 2026, 02:27:12 PM api-events-minimal-user api-events-user-2 —" [ref=e245] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e246]
              - cell "api-events-minimal-user" [ref=e247]
              - cell "api-events-user-2" [ref=e248]
              - cell "—" [ref=e249]
            - row "Apr 14, 2026, 02:27:12 PM api-events-minimal-device api-events-device-2 —" [ref=e250] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e251]
              - cell "api-events-minimal-device" [ref=e252]
              - cell "api-events-device-2" [ref=e253]
              - cell "—" [ref=e254]
            - 'row "Apr 14, 2026, 02:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-7 amount: 59, currency: EUR +1" [ref=e255] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:15:27 PM" [ref=e256]
              - cell "test-ui-trends-purchase-completed" [ref=e257]
              - cell "test-ui-trends-user-7" [ref=e258]
              - 'cell "amount: 59, currency: EUR +1" [ref=e259]':
                - generic [ref=e260]: "amount: 59, currency: EUR +1"
            - row "Apr 14, 2026, 02:14:54 PM page_viewed test-identity-device-D —" [ref=e261] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:54 PM" [ref=e262]
              - cell "page_viewed" [ref=e263]
              - cell "test-identity-device-D" [ref=e264]
              - cell "—" [ref=e265]
            - row "Apr 14, 2026, 02:14:54 PM button_clicked test-identity-device-D —" [ref=e266] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:54 PM" [ref=e267]
              - cell "button_clicked" [ref=e268]
              - cell "test-identity-device-D" [ref=e269]
              - cell "—" [ref=e270]
            - row "Apr 14, 2026, 02:14:54 PM page_viewed test-identity-device-D —" [ref=e271] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:54 PM" [ref=e272]
              - cell "page_viewed" [ref=e273]
              - cell "test-identity-device-D" [ref=e274]
              - cell "—" [ref=e275]
            - row "Apr 14, 2026, 02:14:51 PM signup_completed test-identity-user-P —" [ref=e276] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e277]
              - cell "signup_completed" [ref=e278]
              - cell "test-identity-user-P" [ref=e279]
              - cell "—" [ref=e280]
            - row "Apr 14, 2026, 02:14:51 PM login test-identity-user-Z —" [ref=e281] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e282]
              - cell "login" [ref=e283]
              - cell "test-identity-user-Z" [ref=e284]
              - cell "—" [ref=e285]
            - row "Apr 14, 2026, 02:14:51 PM login test-identity-user-Z —" [ref=e286] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e287]
              - cell "login" [ref=e288]
              - cell "test-identity-user-Z" [ref=e289]
              - cell "—" [ref=e290]
            - row "Apr 14, 2026, 02:14:51 PM feature_used test-identity-device-B —" [ref=e291] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e292]
              - cell "feature_used" [ref=e293]
              - cell "test-identity-device-B" [ref=e294]
              - cell "—" [ref=e295]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-B —" [ref=e296] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e297]
              - cell "page_viewed" [ref=e298]
              - cell "test-identity-device-B" [ref=e299]
              - cell "—" [ref=e300]
            - row "Apr 14, 2026, 02:14:51 PM button_clicked test-identity-device-A —" [ref=e301] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e302]
              - cell "button_clicked" [ref=e303]
              - cell "test-identity-device-A" [ref=e304]
              - cell "—" [ref=e305]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-A —" [ref=e306] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e307]
              - cell "page_viewed" [ref=e308]
              - cell "test-identity-device-A" [ref=e309]
              - cell "—" [ref=e310]
            - row "Apr 14, 2026, 02:14:51 PM signup_completed test-identity-user-Y —" [ref=e311] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e312]
              - cell "signup_completed" [ref=e313]
              - cell "test-identity-user-Y" [ref=e314]
              - cell "—" [ref=e315]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-X —" [ref=e316] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e317]
              - cell "page_viewed" [ref=e318]
              - cell "test-identity-device-X" [ref=e319]
              - cell "—" [ref=e320]
            - row "Apr 14, 2026, 02:14:51 PM form_submitted test-identity-device-X —" [ref=e321] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e322]
              - cell "form_submitted" [ref=e323]
              - cell "test-identity-device-X" [ref=e324]
              - cell "—" [ref=e325]
            - row "Apr 14, 2026, 02:14:51 PM button_clicked test-identity-device-X —" [ref=e326] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e327]
              - cell "button_clicked" [ref=e328]
              - cell "test-identity-device-X" [ref=e329]
              - cell "—" [ref=e330]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-X —" [ref=e331] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e332]
              - cell "page_viewed" [ref=e333]
              - cell "test-identity-device-X" [ref=e334]
              - cell "—" [ref=e335]
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-types-event test-props-types-device-3 amount: 199.99, quantity: 1 +3" [ref=e336] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e337]
              - cell "test-props-types-event" [ref=e338]
              - cell "test-props-types-device-3" [ref=e339]
              - 'cell "amount: 199.99, quantity: 1 +3" [ref=e340]':
                - generic [ref=e341]: "amount: 199.99, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-types-event test-props-types-device-2 amount: 29, quantity: 10 +3" [ref=e342] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e343]
              - cell "test-props-types-event" [ref=e344]
              - cell "test-props-types-device-2" [ref=e345]
              - 'cell "amount: 29, quantity: 10 +3" [ref=e346]':
                - generic [ref=e347]: "amount: 29, quantity: 10 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-types-event test-props-types-device-1 amount: 99.99, quantity: 3 +3" [ref=e348] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e349]
              - cell "test-props-types-event" [ref=e350]
              - cell "test-props-types-device-1" [ref=e351]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e352]':
                - generic [ref=e353]: "amount: 99.99, quantity: 3 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-shape-event test-props-shape-device-3 amount: 149.5, quantity: 5 +3" [ref=e354] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e355]
              - cell "test-props-shape-event" [ref=e356]
              - cell "test-props-shape-device-3" [ref=e357]
              - 'cell "amount: 149.5, quantity: 5 +3" [ref=e358]':
                - generic [ref=e359]: "amount: 149.5, quantity: 5 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-shape-event test-props-shape-device-2 amount: 49, quantity: 1 +3" [ref=e360] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e361]
              - cell "test-props-shape-event" [ref=e362]
              - cell "test-props-shape-device-2" [ref=e363]
              - 'cell "amount: 49, quantity: 1 +3" [ref=e364]':
                - generic [ref=e365]: "amount: 49, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-shape-event test-props-shape-device-1 amount: 99.99, quantity: 3 +3" [ref=e366] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e367]
              - cell "test-props-shape-event" [ref=e368]
              - cell "test-props-shape-device-1" [ref=e369]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e370]':
                - generic [ref=e371]: "amount: 99.99, quantity: 3 +3"
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-mix-valid-2 api-events-batch-user-2 —" [ref=e372] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e373]
              - cell "api-events-batch-mix-valid-2" [ref=e374]
              - cell "api-events-batch-user-2" [ref=e375]
              - cell "—" [ref=e376]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-mix-valid-1 api-events-batch-device-3 —" [ref=e377] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e378]
              - cell "api-events-batch-mix-valid-1" [ref=e379]
              - cell "api-events-batch-device-3" [ref=e380]
              - cell "—" [ref=e381]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-event-c api-events-batch-user-1 —" [ref=e382] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e383]
              - cell "api-events-batch-event-c" [ref=e384]
              - cell "api-events-batch-user-1" [ref=e385]
              - cell "—" [ref=e386]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-event-b api-events-batch-device-2 —" [ref=e387] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e388]
              - cell "api-events-batch-event-b" [ref=e389]
              - cell "api-events-batch-device-2" [ref=e390]
              - cell "—" [ref=e391]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-event-a api-events-batch-device-1 —" [ref=e392] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e393]
              - cell "api-events-batch-event-a" [ref=e394]
              - cell "api-events-batch-device-1" [ref=e395]
              - cell "—" [ref=e396]
            - 'row "Apr 14, 2026, 02:14:48 PM api-events-properties-roundtrip api-events-device-5 page: /home, duration_ms: 1234 +1" [ref=e397] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e398]
              - cell "api-events-properties-roundtrip" [ref=e399]
              - cell "api-events-device-5" [ref=e400]
              - 'cell "page: /home, duration_ms: 1234 +1" [ref=e401]':
                - generic [ref=e402]: "page: /home, duration_ms: 1234 +1"
            - row "Apr 14, 2026, 02:14:48 PM api-events-no-timestamp api-events-device-4 —" [ref=e403] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e404]
              - cell "api-events-no-timestamp" [ref=e405]
              - cell "api-events-device-4" [ref=e406]
              - cell "—" [ref=e407]
            - row "Apr 14, 2026, 02:14:47 PM api-events-minimal-user api-events-user-2 —" [ref=e408] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:47 PM" [ref=e409]
              - cell "api-events-minimal-user" [ref=e410]
              - cell "api-events-user-2" [ref=e411]
              - cell "—" [ref=e412]
            - row "Apr 14, 2026, 02:14:47 PM api-events-minimal-device api-events-device-2 —" [ref=e413] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:47 PM" [ref=e414]
              - cell "api-events-minimal-device" [ref=e415]
              - cell "api-events-device-2" [ref=e416]
              - cell "—" [ref=e417]
            - 'row "Apr 14, 2026, 02:00:00 PM test-ui-enhanced-Purchase Completed test-ui-enhanced-user@example.com amount: 99, currency: USD +1" [ref=e418] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:00:00 PM" [ref=e419]
              - cell "test-ui-enhanced-Purchase Completed" [ref=e420]
              - cell "test-ui-enhanced-user@example.com" [ref=e421]
              - 'cell "amount: 99, currency: USD +1" [ref=e422]':
                - generic [ref=e423]: "amount: 99, currency: USD +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e424] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e425]
              - cell "test-ui-events-Page Viewed" [ref=e426]
              - cell "test-ui-events-user-u1" [ref=e427]
              - 'cell "page: /blog, referrer: google +1" [ref=e428]':
                - generic [ref=e429]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e430] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e431]
              - cell "test-ui-events-Page Viewed" [ref=e432]
              - cell "test-ui-events-user-u1" [ref=e433]
              - 'cell "page: /blog, referrer: google +1" [ref=e434]':
                - generic [ref=e435]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e436] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e437]
              - cell "test-ui-events-Page Viewed" [ref=e438]
              - cell "test-ui-events-user-u1" [ref=e439]
              - 'cell "page: /blog, referrer: google +1" [ref=e440]':
                - generic [ref=e441]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e442] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e443]
              - cell "test-ui-events-Page Viewed" [ref=e444]
              - cell "test-ui-events-user-u1" [ref=e445]
              - 'cell "page: /blog, referrer: google +1" [ref=e446]':
                - generic [ref=e447]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 12:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-2 duration_ms: 746, page: /docs" [ref=e448] [cursor=pointer]':
              - cell "Apr 14, 2026, 12:15:27 PM" [ref=e449]
              - cell "test-ui-trends-page-viewed" [ref=e450]
              - cell "test-ui-trends-user-2" [ref=e451]
              - 'cell "duration_ms: 746, page: /docs" [ref=e452]':
                - generic [ref=e453]: "duration_ms: 746, page: /docs"
            - 'row "Apr 14, 2026, 12:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-6 amount: 52, currency: USD +1" [ref=e454] [cursor=pointer]':
              - cell "Apr 14, 2026, 12:15:27 PM" [ref=e455]
              - cell "test-ui-trends-purchase-completed" [ref=e456]
              - cell "test-ui-trends-user-6" [ref=e457]
              - 'cell "amount: 52, currency: USD +1" [ref=e458]':
                - generic [ref=e459]: "amount: 52, currency: USD +1"
            - 'row "Apr 14, 2026, 10:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-5 amount: 45, currency: EUR +1" [ref=e460] [cursor=pointer]':
              - cell "Apr 14, 2026, 10:15:27 AM" [ref=e461]
              - cell "test-ui-trends-purchase-completed" [ref=e462]
              - cell "test-ui-trends-user-5" [ref=e463]
              - 'cell "amount: 45, currency: EUR +1" [ref=e464]':
                - generic [ref=e465]: "amount: 45, currency: EUR +1"
            - 'row "Apr 14, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-1 duration_ms: 623, page: /pricing" [ref=e466] [cursor=pointer]':
              - cell "Apr 14, 2026, 09:15:27 AM" [ref=e467]
              - cell "test-ui-trends-page-viewed" [ref=e468]
              - cell "test-ui-trends-user-1" [ref=e469]
              - 'cell "duration_ms: 623, page: /pricing" [ref=e470]':
                - generic [ref=e471]: "duration_ms: 623, page: /pricing"
            - 'row "Apr 14, 2026, 08:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-4 amount: 38, currency: USD +1" [ref=e472] [cursor=pointer]':
              - cell "Apr 14, 2026, 08:15:27 AM" [ref=e473]
              - cell "test-ui-trends-purchase-completed" [ref=e474]
              - cell "test-ui-trends-user-4" [ref=e475]
              - 'cell "amount: 38, currency: USD +1" [ref=e476]':
                - generic [ref=e477]: "amount: 38, currency: USD +1"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-2 page: /contact" [ref=e478] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e479]
              - cell "test-trends-breakdown-event" [ref=e480]
              - cell "test-trends-breakdown-device-contact-2" [ref=e481]
              - 'cell "page: /contact" [ref=e482]':
                - generic [ref=e483]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-1 page: /contact" [ref=e484] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e485]
              - cell "test-trends-breakdown-event" [ref=e486]
              - cell "test-trends-breakdown-device-contact-1" [ref=e487]
              - 'cell "page: /contact" [ref=e488]':
                - generic [ref=e489]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-0 page: /contact" [ref=e490] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e491]
              - cell "test-trends-breakdown-event" [ref=e492]
              - cell "test-trends-breakdown-device-contact-0" [ref=e493]
              - 'cell "page: /contact" [ref=e494]':
                - generic [ref=e495]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-2 page: /about" [ref=e496] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e497]
              - cell "test-trends-breakdown-event" [ref=e498]
              - cell "test-trends-breakdown-device-about-2" [ref=e499]
              - 'cell "page: /about" [ref=e500]':
                - generic [ref=e501]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-1 page: /about" [ref=e502] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e503]
              - cell "test-trends-breakdown-event" [ref=e504]
              - cell "test-trends-breakdown-device-about-1" [ref=e505]
              - 'cell "page: /about" [ref=e506]':
                - generic [ref=e507]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-0 page: /about" [ref=e508] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e509]
              - cell "test-trends-breakdown-event" [ref=e510]
              - cell "test-trends-breakdown-device-about-0" [ref=e511]
              - 'cell "page: /about" [ref=e512]':
                - generic [ref=e513]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-2 page: /blog" [ref=e514] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e515]
              - cell "test-trends-breakdown-event" [ref=e516]
              - cell "test-trends-breakdown-device-blog-2" [ref=e517]
              - 'cell "page: /blog" [ref=e518]':
                - generic [ref=e519]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-1 page: /blog" [ref=e520] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e521]
              - cell "test-trends-breakdown-event" [ref=e522]
              - cell "test-trends-breakdown-device-blog-1" [ref=e523]
              - 'cell "page: /blog" [ref=e524]':
                - generic [ref=e525]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-0 page: /blog" [ref=e526] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e527]
              - cell "test-trends-breakdown-event" [ref=e528]
              - cell "test-trends-breakdown-device-blog-0" [ref=e529]
              - 'cell "page: /blog" [ref=e530]':
                - generic [ref=e531]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-2 page: /docs" [ref=e532] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e533]
              - cell "test-trends-breakdown-event" [ref=e534]
              - cell "test-trends-breakdown-device-docs-2" [ref=e535]
              - 'cell "page: /docs" [ref=e536]':
                - generic [ref=e537]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-1 page: /docs" [ref=e538] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e539]
              - cell "test-trends-breakdown-event" [ref=e540]
              - cell "test-trends-breakdown-device-docs-1" [ref=e541]
              - 'cell "page: /docs" [ref=e542]':
                - generic [ref=e543]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-0 page: /docs" [ref=e544] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e545]
              - cell "test-trends-breakdown-event" [ref=e546]
              - cell "test-trends-breakdown-device-docs-0" [ref=e547]
              - 'cell "page: /docs" [ref=e548]':
                - generic [ref=e549]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-2 page: /pricing" [ref=e550] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e551]
              - cell "test-trends-breakdown-event" [ref=e552]
              - cell "test-trends-breakdown-device-pricing-2" [ref=e553]
              - 'cell "page: /pricing" [ref=e554]':
                - generic [ref=e555]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-1 page: /pricing" [ref=e556] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e557]
              - cell "test-trends-breakdown-event" [ref=e558]
              - cell "test-trends-breakdown-device-pricing-1" [ref=e559]
              - 'cell "page: /pricing" [ref=e560]':
                - generic [ref=e561]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-0 page: /pricing" [ref=e562] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e563]
              - cell "test-trends-breakdown-event" [ref=e564]
              - cell "test-trends-breakdown-device-pricing-0" [ref=e565]
              - 'cell "page: /pricing" [ref=e566]':
                - generic [ref=e567]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-2 page: /home" [ref=e568] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e569]
              - cell "test-trends-breakdown-event" [ref=e570]
              - cell "test-trends-breakdown-device-home-2" [ref=e571]
              - 'cell "page: /home" [ref=e572]':
                - generic [ref=e573]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-1 page: /home" [ref=e574] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e575]
              - cell "test-trends-breakdown-event" [ref=e576]
              - cell "test-trends-breakdown-device-home-1" [ref=e577]
              - 'cell "page: /home" [ref=e578]':
                - generic [ref=e579]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-0 page: /home" [ref=e580] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e581]
              - cell "test-trends-breakdown-event" [ref=e582]
              - cell "test-trends-breakdown-device-home-0" [ref=e583]
              - 'cell "page: /home" [ref=e584]':
                - generic [ref=e585]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a label: hello" [ref=e586] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e587]
              - cell "test-trends-numeric-event" [ref=e588]
              - cell "test-trends-numeric-device-a" [ref=e589]
              - 'cell "label: hello" [ref=e590]':
                - generic [ref=e591]: "label: hello"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-b amount: 50" [ref=e592] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e593]
              - cell "test-trends-numeric-event" [ref=e594]
              - cell "test-trends-numeric-device-b" [ref=e595]
              - 'cell "amount: 50" [ref=e596]':
                - generic [ref=e597]: "amount: 50"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 200" [ref=e598] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e599]
              - cell "test-trends-numeric-event" [ref=e600]
              - cell "test-trends-numeric-device-a" [ref=e601]
              - 'cell "amount: 200" [ref=e602]':
                - generic [ref=e603]: "amount: 200"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 100" [ref=e604] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e605]
              - cell "test-trends-numeric-event" [ref=e606]
              - cell "test-trends-numeric-device-a" [ref=e607]
              - 'cell "amount: 100" [ref=e608]':
                - generic [ref=e609]: "amount: 100"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-b amount: 50" [ref=e610] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e611]
              - cell "test-trends-numeric-event" [ref=e612]
              - cell "test-trends-numeric-device-b" [ref=e613]
              - 'cell "amount: 50" [ref=e614]':
                - generic [ref=e615]: "amount: 50"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 200" [ref=e616] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e617]
              - cell "test-trends-numeric-event" [ref=e618]
              - cell "test-trends-numeric-device-a" [ref=e619]
              - 'cell "amount: 200" [ref=e620]':
                - generic [ref=e621]: "amount: 200"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 100" [ref=e622] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e623]
              - cell "test-trends-numeric-event" [ref=e624]
              - cell "test-trends-numeric-device-a" [ref=e625]
              - 'cell "amount: 100" [ref=e626]':
                - generic [ref=e627]: "amount: 100"
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-link test-trends-identity-user-1 —" [ref=e628] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e629]
              - cell "test-trends-identity-link" [ref=e630]
              - cell "test-trends-identity-user-1" [ref=e631]
              - cell "—" [ref=e632]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e633] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e634]
              - cell "test-trends-identity-event" [ref=e635]
              - cell "test-trends-identity-device-1" [ref=e636]
              - cell "—" [ref=e637]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e638] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e639]
              - cell "test-trends-identity-event" [ref=e640]
              - cell "test-trends-identity-device-1" [ref=e641]
              - cell "—" [ref=e642]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e643] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e644]
              - cell "test-trends-identity-event" [ref=e645]
              - cell "test-trends-identity-device-1" [ref=e646]
              - cell "—" [ref=e647]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-zerofill-event test-trends-zerofill-device-1 —" [ref=e648] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e649]
              - cell "test-trends-zerofill-event" [ref=e650]
              - cell "test-trends-zerofill-device-1" [ref=e651]
              - cell "—" [ref=e652]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e653] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e654]
              - cell "test-trends-granularity-event" [ref=e655]
              - cell "test-trends-gran-device-1" [ref=e656]
              - cell "—" [ref=e657]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e658] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e659]
              - cell "test-trends-shape-event" [ref=e660]
              - cell "test-trends-shape-device-1" [ref=e661]
              - cell "—" [ref=e662]
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-2 page: /contact" [ref=e663] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e664]
              - cell "test-trends-breakdown-event" [ref=e665]
              - cell "test-trends-breakdown-device-contact-2" [ref=e666]
              - 'cell "page: /contact" [ref=e667]':
                - generic [ref=e668]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-1 page: /contact" [ref=e669] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e670]
              - cell "test-trends-breakdown-event" [ref=e671]
              - cell "test-trends-breakdown-device-contact-1" [ref=e672]
              - 'cell "page: /contact" [ref=e673]':
                - generic [ref=e674]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-0 page: /contact" [ref=e675] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e676]
              - cell "test-trends-breakdown-event" [ref=e677]
              - cell "test-trends-breakdown-device-contact-0" [ref=e678]
              - 'cell "page: /contact" [ref=e679]':
                - generic [ref=e680]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-2 page: /about" [ref=e681] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e682]
              - cell "test-trends-breakdown-event" [ref=e683]
              - cell "test-trends-breakdown-device-about-2" [ref=e684]
              - 'cell "page: /about" [ref=e685]':
                - generic [ref=e686]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-1 page: /about" [ref=e687] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e688]
              - cell "test-trends-breakdown-event" [ref=e689]
              - cell "test-trends-breakdown-device-about-1" [ref=e690]
              - 'cell "page: /about" [ref=e691]':
                - generic [ref=e692]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-0 page: /about" [ref=e693] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e694]
              - cell "test-trends-breakdown-event" [ref=e695]
              - cell "test-trends-breakdown-device-about-0" [ref=e696]
              - 'cell "page: /about" [ref=e697]':
                - generic [ref=e698]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-2 page: /blog" [ref=e699] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e700]
              - cell "test-trends-breakdown-event" [ref=e701]
              - cell "test-trends-breakdown-device-blog-2" [ref=e702]
              - 'cell "page: /blog" [ref=e703]':
                - generic [ref=e704]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-1 page: /blog" [ref=e705] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e706]
              - cell "test-trends-breakdown-event" [ref=e707]
              - cell "test-trends-breakdown-device-blog-1" [ref=e708]
              - 'cell "page: /blog" [ref=e709]':
                - generic [ref=e710]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-0 page: /blog" [ref=e711] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e712]
              - cell "test-trends-breakdown-event" [ref=e713]
              - cell "test-trends-breakdown-device-blog-0" [ref=e714]
              - 'cell "page: /blog" [ref=e715]':
                - generic [ref=e716]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-2 page: /docs" [ref=e717] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e718]
              - cell "test-trends-breakdown-event" [ref=e719]
              - cell "test-trends-breakdown-device-docs-2" [ref=e720]
              - 'cell "page: /docs" [ref=e721]':
                - generic [ref=e722]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-1 page: /docs" [ref=e723] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e724]
              - cell "test-trends-breakdown-event" [ref=e725]
              - cell "test-trends-breakdown-device-docs-1" [ref=e726]
              - 'cell "page: /docs" [ref=e727]':
                - generic [ref=e728]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-0 page: /docs" [ref=e729] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e730]
              - cell "test-trends-breakdown-event" [ref=e731]
              - cell "test-trends-breakdown-device-docs-0" [ref=e732]
              - 'cell "page: /docs" [ref=e733]':
                - generic [ref=e734]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-2 page: /pricing" [ref=e735] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e736]
              - cell "test-trends-breakdown-event" [ref=e737]
              - cell "test-trends-breakdown-device-pricing-2" [ref=e738]
              - 'cell "page: /pricing" [ref=e739]':
                - generic [ref=e740]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-1 page: /pricing" [ref=e741] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e742]
              - cell "test-trends-breakdown-event" [ref=e743]
              - cell "test-trends-breakdown-device-pricing-1" [ref=e744]
              - 'cell "page: /pricing" [ref=e745]':
                - generic [ref=e746]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-0 page: /pricing" [ref=e747] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e748]
              - cell "test-trends-breakdown-event" [ref=e749]
              - cell "test-trends-breakdown-device-pricing-0" [ref=e750]
              - 'cell "page: /pricing" [ref=e751]':
                - generic [ref=e752]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-2 page: /home" [ref=e753] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e754]
              - cell "test-trends-breakdown-event" [ref=e755]
              - cell "test-trends-breakdown-device-home-2" [ref=e756]
              - 'cell "page: /home" [ref=e757]':
                - generic [ref=e758]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-1 page: /home" [ref=e759] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e760]
              - cell "test-trends-breakdown-event" [ref=e761]
              - cell "test-trends-breakdown-device-home-1" [ref=e762]
              - 'cell "page: /home" [ref=e763]':
                - generic [ref=e764]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-0 page: /home" [ref=e765] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e766]
              - cell "test-trends-breakdown-event" [ref=e767]
              - cell "test-trends-breakdown-device-home-0" [ref=e768]
              - 'cell "page: /home" [ref=e769]':
                - generic [ref=e770]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a label: hello" [ref=e771] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e772]
              - cell "test-trends-numeric-event" [ref=e773]
              - cell "test-trends-numeric-device-a" [ref=e774]
              - 'cell "label: hello" [ref=e775]':
                - generic [ref=e776]: "label: hello"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-b amount: 50" [ref=e777] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e778]
              - cell "test-trends-numeric-event" [ref=e779]
              - cell "test-trends-numeric-device-b" [ref=e780]
              - 'cell "amount: 50" [ref=e781]':
                - generic [ref=e782]: "amount: 50"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 200" [ref=e783] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e784]
              - cell "test-trends-numeric-event" [ref=e785]
              - cell "test-trends-numeric-device-a" [ref=e786]
              - 'cell "amount: 200" [ref=e787]':
                - generic [ref=e788]: "amount: 200"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 100" [ref=e789] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e790]
              - cell "test-trends-numeric-event" [ref=e791]
              - cell "test-trends-numeric-device-a" [ref=e792]
              - 'cell "amount: 100" [ref=e793]':
                - generic [ref=e794]: "amount: 100"
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-link test-trends-identity-user-1 —" [ref=e795] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e796]
              - cell "test-trends-identity-link" [ref=e797]
              - cell "test-trends-identity-user-1" [ref=e798]
              - cell "—" [ref=e799]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e800] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e801]
              - cell "test-trends-identity-event" [ref=e802]
              - cell "test-trends-identity-device-1" [ref=e803]
              - cell "—" [ref=e804]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e805] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e806]
              - cell "test-trends-identity-event" [ref=e807]
              - cell "test-trends-identity-device-1" [ref=e808]
              - cell "—" [ref=e809]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e810] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e811]
              - cell "test-trends-identity-event" [ref=e812]
              - cell "test-trends-identity-device-1" [ref=e813]
              - cell "—" [ref=e814]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-zerofill-event test-trends-zerofill-device-1 —" [ref=e815] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e816]
              - cell "test-trends-zerofill-event" [ref=e817]
              - cell "test-trends-zerofill-device-1" [ref=e818]
              - cell "—" [ref=e819]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e820] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e821]
              - cell "test-trends-granularity-event" [ref=e822]
              - cell "test-trends-gran-device-1" [ref=e823]
              - cell "—" [ref=e824]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e825] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e826]
              - cell "test-trends-shape-event" [ref=e827]
              - cell "test-trends-shape-device-1" [ref=e828]
              - cell "—" [ref=e829]
            - 'row "Apr 14, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-0 duration_ms: 500, page: /home" [ref=e830] [cursor=pointer]':
              - cell "Apr 14, 2026, 06:15:27 AM" [ref=e831]
              - cell "test-ui-trends-page-viewed" [ref=e832]
              - cell "test-ui-trends-user-0" [ref=e833]
              - 'cell "duration_ms: 500, page: /home" [ref=e834]':
                - generic [ref=e835]: "duration_ms: 500, page: /home"
            - 'row "Apr 14, 2026, 06:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-3 amount: 31, currency: EUR +1" [ref=e836] [cursor=pointer]':
              - cell "Apr 14, 2026, 06:15:27 AM" [ref=e837]
              - cell "test-ui-trends-purchase-completed" [ref=e838]
              - cell "test-ui-trends-user-3" [ref=e839]
              - 'cell "amount: 31, currency: EUR +1" [ref=e840]':
                - generic [ref=e841]: "amount: 31, currency: EUR +1"
            - 'row "Apr 14, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-2 amount: 24, currency: USD +1" [ref=e842] [cursor=pointer]':
              - cell "Apr 14, 2026, 04:15:27 AM" [ref=e843]
              - cell "test-ui-trends-purchase-completed" [ref=e844]
              - cell "test-ui-trends-user-2" [ref=e845]
              - 'cell "amount: 24, currency: USD +1" [ref=e846]':
                - generic [ref=e847]: "amount: 24, currency: USD +1"
            - 'row "Apr 14, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-1 amount: 17, currency: EUR +1" [ref=e848] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:15:27 AM" [ref=e849]
              - cell "test-ui-trends-purchase-completed" [ref=e850]
              - cell "test-ui-trends-user-1" [ref=e851]
              - 'cell "amount: 17, currency: EUR +1" [ref=e852]':
                - generic [ref=e853]: "amount: 17, currency: EUR +1"
            - 'row "Apr 14, 2026, 12:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-0 amount: 10, currency: USD +1" [ref=e854] [cursor=pointer]':
              - cell "Apr 14, 2026, 12:15:27 AM" [ref=e855]
              - cell "test-ui-trends-purchase-completed" [ref=e856]
              - cell "test-ui-trends-user-0" [ref=e857]
              - 'cell "amount: 10, currency: USD +1" [ref=e858]':
                - generic [ref=e859]: "amount: 10, currency: USD +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e860] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e861]
              - cell "test-ui-events-Page Viewed" [ref=e862]
              - cell "test-ui-events-user-u0" [ref=e863]
              - 'cell "page: /docs, referrer: direct +1" [ref=e864]':
                - generic [ref=e865]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e866] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e867]
              - cell "test-ui-events-Page Viewed" [ref=e868]
              - cell "test-ui-events-user-u0" [ref=e869]
              - 'cell "page: /docs, referrer: direct +1" [ref=e870]':
                - generic [ref=e871]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e872] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e873]
              - cell "test-ui-events-Page Viewed" [ref=e874]
              - cell "test-ui-events-user-u0" [ref=e875]
              - 'cell "page: /docs, referrer: direct +1" [ref=e876]':
                - generic [ref=e877]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e878] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e879]
              - cell "test-ui-events-Page Viewed" [ref=e880]
              - cell "test-ui-events-user-u0" [ref=e881]
              - 'cell "page: /docs, referrer: direct +1" [ref=e882]':
                - generic [ref=e883]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e884] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e885]
              - cell "test-ui-events-Button Clicked" [ref=e886]
              - cell "test-ui-events-user-u0" [ref=e887]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e888]':
                - generic [ref=e889]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e890] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e891]
              - cell "test-ui-events-Button Clicked" [ref=e892]
              - cell "test-ui-events-user-u0" [ref=e893]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e894]':
                - generic [ref=e895]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e896] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e897]
              - cell "test-ui-events-Button Clicked" [ref=e898]
              - cell "test-ui-events-user-u0" [ref=e899]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e900]':
                - generic [ref=e901]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e902] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e903]
              - cell "test-ui-events-Button Clicked" [ref=e904]
              - cell "test-ui-events-user-u0" [ref=e905]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e906]':
                - generic [ref=e907]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-6 duration_ms: 640, page: /pricing" [ref=e908] [cursor=pointer]':
              - cell "Apr 13, 2026, 09:15:27 AM" [ref=e909]
              - cell "test-ui-trends-page-viewed" [ref=e910]
              - cell "test-ui-trends-user-6" [ref=e911]
              - 'cell "duration_ms: 640, page: /pricing" [ref=e912]':
                - generic [ref=e913]: "duration_ms: 640, page: /pricing"
            - 'row "Apr 13, 2026, 09:00:00 AM test-ui-enhanced-Login test-ui-enhanced-user@example.com method: google" [ref=e914] [cursor=pointer]':
              - cell "Apr 13, 2026, 09:00:00 AM" [ref=e915]
              - cell "test-ui-enhanced-Login" [ref=e916]
              - cell "test-ui-enhanced-user@example.com" [ref=e917]
              - 'cell "method: google" [ref=e918]':
                - generic [ref=e919]: "method: google"
            - 'row "Apr 13, 2026, 08:00:00 AM test-ui-enhanced-Signup Completed test-ui-enhanced-user@example.com plan: pro" [ref=e920] [cursor=pointer]':
              - cell "Apr 13, 2026, 08:00:00 AM" [ref=e921]
              - cell "test-ui-enhanced-Signup Completed" [ref=e922]
              - cell "test-ui-enhanced-user@example.com" [ref=e923]
              - 'cell "plan: pro" [ref=e924]':
                - generic [ref=e925]: "plan: pro"
            - row "Apr 13, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e926] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e927]
              - cell "test-trends-granularity-event" [ref=e928]
              - cell "test-trends-gran-device-1" [ref=e929]
              - cell "—" [ref=e930]
            - row "Apr 13, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e931] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e932]
              - cell "test-trends-shape-event" [ref=e933]
              - cell "test-trends-shape-device-1" [ref=e934]
              - cell "—" [ref=e935]
            - row "Apr 13, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e936] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e937]
              - cell "test-trends-granularity-event" [ref=e938]
              - cell "test-trends-gran-device-1" [ref=e939]
              - cell "—" [ref=e940]
            - row "Apr 13, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e941] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e942]
              - cell "test-trends-shape-event" [ref=e943]
              - cell "test-trends-shape-device-1" [ref=e944]
              - cell "—" [ref=e945]
            - 'row "Apr 13, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-5 duration_ms: 517, page: /home" [ref=e946] [cursor=pointer]':
              - cell "Apr 13, 2026, 06:15:27 AM" [ref=e947]
              - cell "test-ui-trends-page-viewed" [ref=e948]
              - cell "test-ui-trends-user-5" [ref=e949]
              - 'cell "duration_ms: 517, page: /home" [ref=e950]':
                - generic [ref=e951]: "duration_ms: 517, page: /home"
            - 'row "Apr 13, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-12 amount: 27, currency: USD +1" [ref=e952] [cursor=pointer]':
              - cell "Apr 13, 2026, 04:15:27 AM" [ref=e953]
              - cell "test-ui-trends-purchase-completed" [ref=e954]
              - cell "test-ui-trends-user-12" [ref=e955]
              - 'cell "amount: 27, currency: USD +1" [ref=e956]':
                - generic [ref=e957]: "amount: 27, currency: USD +1"
            - 'row "Apr 13, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-11 amount: 20, currency: EUR +1" [ref=e958] [cursor=pointer]':
              - cell "Apr 13, 2026, 02:15:27 AM" [ref=e959]
              - cell "test-ui-trends-purchase-completed" [ref=e960]
              - cell "test-ui-trends-user-11" [ref=e961]
              - 'cell "amount: 20, currency: EUR +1" [ref=e962]':
                - generic [ref=e963]: "amount: 20, currency: EUR +1"
            - 'row "Apr 13, 2026, 12:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-10 amount: 13, currency: USD +1" [ref=e964] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:15:27 AM" [ref=e965]
              - cell "test-ui-trends-purchase-completed" [ref=e966]
              - cell "test-ui-trends-user-10" [ref=e967]
              - 'cell "amount: 13, currency: USD +1" [ref=e968]':
                - generic [ref=e969]: "amount: 13, currency: USD +1"
            - 'row "Apr 12, 2026, 09:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-15 duration_ms: 1149, page: /pricing" [ref=e970] [cursor=pointer]':
              - cell "Apr 12, 2026, 09:15:27 PM" [ref=e971]
              - cell "test-ui-trends-page-viewed" [ref=e972]
              - cell "test-ui-trends-user-15" [ref=e973]
              - 'cell "duration_ms: 1149, page: /pricing" [ref=e974]':
                - generic [ref=e975]: "duration_ms: 1149, page: /pricing"
            - 'row "Apr 12, 2026, 06:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-14 duration_ms: 1026, page: /home" [ref=e976] [cursor=pointer]':
              - cell "Apr 12, 2026, 06:15:27 PM" [ref=e977]
              - cell "test-ui-trends-page-viewed" [ref=e978]
              - cell "test-ui-trends-user-14" [ref=e979]
              - 'cell "duration_ms: 1026, page: /home" [ref=e980]':
                - generic [ref=e981]: "duration_ms: 1026, page: /home"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e982] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e983]
              - cell "test-ui-events-Button Clicked" [ref=e984]
              - cell "test-ui-events-user-u1" [ref=e985]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e986]':
                - generic [ref=e987]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e988] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e989]
              - cell "test-ui-events-Button Clicked" [ref=e990]
              - cell "test-ui-events-user-u1" [ref=e991]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e992]':
                - generic [ref=e993]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e994] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e995]
              - cell "test-ui-events-Button Clicked" [ref=e996]
              - cell "test-ui-events-user-u1" [ref=e997]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e998]':
                - generic [ref=e999]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e1000] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e1001]
              - cell "test-ui-events-Button Clicked" [ref=e1002]
              - cell "test-ui-events-user-u1" [ref=e1003]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e1004]':
                - generic [ref=e1005]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 03:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-13 duration_ms: 903, page: /blog" [ref=e1006] [cursor=pointer]':
              - cell "Apr 12, 2026, 03:15:27 PM" [ref=e1007]
              - cell "test-ui-trends-page-viewed" [ref=e1008]
              - cell "test-ui-trends-user-13" [ref=e1009]
              - 'cell "duration_ms: 903, page: /blog" [ref=e1010]':
                - generic [ref=e1011]: "duration_ms: 903, page: /blog"
            - 'row "Apr 12, 2026, 12:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-12 duration_ms: 780, page: /docs" [ref=e1012] [cursor=pointer]':
              - cell "Apr 12, 2026, 12:15:27 PM" [ref=e1013]
              - cell "test-ui-trends-page-viewed" [ref=e1014]
              - cell "test-ui-trends-user-12" [ref=e1015]
              - 'cell "duration_ms: 780, page: /docs" [ref=e1016]':
                - generic [ref=e1017]: "duration_ms: 780, page: /docs"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e1018] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e1019]
              - cell "test-ui-events-Page Viewed" [ref=e1020]
              - cell "test-ui-events-user-u2" [ref=e1021]
              - 'cell "page: /pricing, referrer: google +1" [ref=e1022]':
                - generic [ref=e1023]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e1024] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e1025]
              - cell "test-ui-events-Page Viewed" [ref=e1026]
              - cell "test-ui-events-user-u2" [ref=e1027]
              - 'cell "page: /pricing, referrer: google +1" [ref=e1028]':
                - generic [ref=e1029]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e1030] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e1031]
              - cell "test-ui-events-Page Viewed" [ref=e1032]
              - cell "test-ui-events-user-u2" [ref=e1033]
              - 'cell "page: /pricing, referrer: google +1" [ref=e1034]':
                - generic [ref=e1035]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e1036] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e1037]
              - cell "test-ui-events-Page Viewed" [ref=e1038]
              - cell "test-ui-events-user-u2" [ref=e1039]
              - 'cell "page: /pricing, referrer: google +1" [ref=e1040]':
                - generic [ref=e1041]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 10:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-5 amount: 51, currency: EUR +1" [ref=e1042] [cursor=pointer]':
              - cell "Apr 12, 2026, 10:15:27 AM" [ref=e1043]
              - cell "test-ui-trends-purchase-completed" [ref=e1044]
              - cell "test-ui-trends-user-5" [ref=e1045]
              - 'cell "amount: 51, currency: EUR +1" [ref=e1046]':
                - generic [ref=e1047]: "amount: 51, currency: EUR +1"
            - 'row "Apr 12, 2026, 10:15:00 AM test-ui-enhanced-Feature Used test-ui-enhanced-device-B feature: dark-mode" [ref=e1048] [cursor=pointer]':
              - cell "Apr 12, 2026, 10:15:00 AM" [ref=e1049]
              - cell "test-ui-enhanced-Feature Used" [ref=e1050]
              - cell "test-ui-enhanced-device-B" [ref=e1051]
              - 'cell "feature: dark-mode" [ref=e1052]':
                - generic [ref=e1053]: "feature: dark-mode"
            - 'row "Apr 12, 2026, 10:00:00 AM test-ui-enhanced-Page Viewed test-ui-enhanced-device-B page: /blog" [ref=e1054] [cursor=pointer]':
              - cell "Apr 12, 2026, 10:00:00 AM" [ref=e1055]
              - cell "test-ui-enhanced-Page Viewed" [ref=e1056]
              - cell "test-ui-enhanced-device-B" [ref=e1057]
              - 'cell "page: /blog" [ref=e1058]':
                - generic [ref=e1059]: "page: /blog"
            - 'row "Apr 12, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-11 duration_ms: 657, page: /pricing" [ref=e1060] [cursor=pointer]':
              - cell "Apr 12, 2026, 09:15:27 AM" [ref=e1061]
              - cell "test-ui-trends-page-viewed" [ref=e1062]
              - cell "test-ui-trends-user-11" [ref=e1063]
              - 'cell "duration_ms: 657, page: /pricing" [ref=e1064]':
                - generic [ref=e1065]: "duration_ms: 657, page: /pricing"
            - 'row "Apr 12, 2026, 08:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-4 amount: 44, currency: USD +1" [ref=e1066] [cursor=pointer]':
              - cell "Apr 12, 2026, 08:15:27 AM" [ref=e1067]
              - cell "test-ui-trends-purchase-completed" [ref=e1068]
              - cell "test-ui-trends-user-4" [ref=e1069]
              - 'cell "amount: 44, currency: USD +1" [ref=e1070]':
                - generic [ref=e1071]: "amount: 44, currency: USD +1"
            - row "Apr 12, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e1072] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1073]
              - cell "test-trends-granularity-event" [ref=e1074]
              - cell "test-trends-gran-device-1" [ref=e1075]
              - cell "—" [ref=e1076]
            - row "Apr 12, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e1077] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1078]
              - cell "test-trends-shape-event" [ref=e1079]
              - cell "test-trends-shape-device-1" [ref=e1080]
              - cell "—" [ref=e1081]
            - row "Apr 12, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e1082] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1083]
              - cell "test-trends-granularity-event" [ref=e1084]
              - cell "test-trends-gran-device-1" [ref=e1085]
              - cell "—" [ref=e1086]
            - row "Apr 12, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e1087] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1088]
              - cell "test-trends-shape-event" [ref=e1089]
              - cell "test-trends-shape-device-1" [ref=e1090]
              - cell "—" [ref=e1091]
            - 'row "Apr 12, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-10 duration_ms: 534, page: /home" [ref=e1092] [cursor=pointer]':
              - cell "Apr 12, 2026, 06:15:27 AM" [ref=e1093]
              - cell "test-ui-trends-page-viewed" [ref=e1094]
              - cell "test-ui-trends-user-10" [ref=e1095]
              - 'cell "duration_ms: 534, page: /home" [ref=e1096]':
                - generic [ref=e1097]: "duration_ms: 534, page: /home"
            - 'row "Apr 12, 2026, 06:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-3 amount: 37, currency: EUR +1" [ref=e1098] [cursor=pointer]':
              - cell "Apr 12, 2026, 06:15:27 AM" [ref=e1099]
              - cell "test-ui-trends-purchase-completed" [ref=e1100]
              - cell "test-ui-trends-user-3" [ref=e1101]
              - 'cell "amount: 37, currency: EUR +1" [ref=e1102]':
                - generic [ref=e1103]: "amount: 37, currency: EUR +1"
            - 'row "Apr 12, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-2 amount: 30, currency: USD +1" [ref=e1104] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:15:27 AM" [ref=e1105]
              - cell "test-ui-trends-purchase-completed" [ref=e1106]
              - cell "test-ui-trends-user-2" [ref=e1107]
              - 'cell "amount: 30, currency: USD +1" [ref=e1108]':
                - generic [ref=e1109]: "amount: 30, currency: USD +1"
            - 'row "Apr 12, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-1 amount: 23, currency: EUR +1" [ref=e1110] [cursor=pointer]':
              - cell "Apr 12, 2026, 02:15:27 AM" [ref=e1111]
              - cell "test-ui-trends-purchase-completed" [ref=e1112]
              - cell "test-ui-trends-user-1" [ref=e1113]
              - 'cell "amount: 23, currency: EUR +1" [ref=e1114]':
                - generic [ref=e1115]: "amount: 23, currency: EUR +1"
            - 'row "Apr 12, 2026, 12:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-0 amount: 16, currency: USD +1" [ref=e1116] [cursor=pointer]':
              - cell "Apr 12, 2026, 12:15:27 AM" [ref=e1117]
              - cell "test-ui-trends-purchase-completed" [ref=e1118]
              - cell "test-ui-trends-user-0" [ref=e1119]
              - 'cell "amount: 16, currency: USD +1" [ref=e1120]':
                - generic [ref=e1121]: "amount: 16, currency: USD +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1122] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1123]
              - cell "test-ui-events-Button Clicked" [ref=e1124]
              - cell "test-ui-events-user-u0" [ref=e1125]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1126]':
                - generic [ref=e1127]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1128] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1129]
              - cell "test-ui-events-Button Clicked" [ref=e1130]
              - cell "test-ui-events-user-u0" [ref=e1131]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1132]':
                - generic [ref=e1133]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1134] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1135]
              - cell "test-ui-events-Button Clicked" [ref=e1136]
              - cell "test-ui-events-user-u0" [ref=e1137]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1138]':
                - generic [ref=e1139]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1140] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1141]
              - cell "test-ui-events-Button Clicked" [ref=e1142]
              - cell "test-ui-events-user-u0" [ref=e1143]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1144]':
                - generic [ref=e1145]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 02:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-17 amount: 68, currency: EUR +1" [ref=e1146] [cursor=pointer]':
              - cell "Apr 11, 2026, 02:15:27 PM" [ref=e1147]
              - cell "test-ui-trends-purchase-completed" [ref=e1148]
              - cell "test-ui-trends-user-17" [ref=e1149]
              - 'cell "amount: 68, currency: EUR +1" [ref=e1150]':
                - generic [ref=e1151]: "amount: 68, currency: EUR +1"
            - 'row "Apr 11, 2026, 12:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-16 amount: 61, currency: USD +1" [ref=e1152] [cursor=pointer]':
              - cell "Apr 11, 2026, 12:15:27 PM" [ref=e1153]
              - cell "test-ui-trends-purchase-completed" [ref=e1154]
              - cell "test-ui-trends-user-16" [ref=e1155]
              - 'cell "amount: 61, currency: USD +1" [ref=e1156]':
                - generic [ref=e1157]: "amount: 61, currency: USD +1"
            - 'row "Apr 11, 2026, 10:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-15 amount: 54, currency: EUR +1" [ref=e1158] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:15:27 AM" [ref=e1159]
              - cell "test-ui-trends-purchase-completed" [ref=e1160]
              - cell "test-ui-trends-user-15" [ref=e1161]
              - 'cell "amount: 54, currency: EUR +1" [ref=e1162]':
                - generic [ref=e1163]: "amount: 54, currency: EUR +1"
            - 'row "Apr 11, 2026, 10:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u1 page: /home, referrer: direct +1" [ref=e1164] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:00:00 AM" [ref=e1165]
              - cell "test-ui-events-Page Viewed" [ref=e1166]
              - cell "test-ui-events-user-u1" [ref=e1167]
              - 'cell "page: /home, referrer: direct +1" [ref=e1168]':
                - generic [ref=e1169]: "page: /home, referrer: direct +1"
            - 'row "Apr 11, 2026, 10:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u1 page: /home, referrer: direct +1" [ref=e1170] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:00:00 AM" [ref=e1171]
              - cell "test-ui-events-Page Viewed" [ref=e1172]
              - cell "test-ui-events-user-u1" [ref=e1173]
              - 'cell "page: /home, referrer: direct +1" [ref=e1174]':
                - generic [ref=e1175]: "page: /home, referrer: direct +1"
            - 'row "Apr 11, 2026, 10:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u1 page: /home, referrer: direct +1" [ref=e1176] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:00:00 AM" [ref=e1177]
              - cell "test-ui-events-Page Viewed" [ref=e1178]
              - cell "test-ui-events-user-u1" [ref=e1179]
              - 'cell "page: /home, referrer: direct +1" [ref=e1180]':
                - generic [ref=e1181]: "page: /home, referrer: direct +1"
        - generic [ref=e1182]:
          - generic [ref=e1183]: 1–200 of 1,128
          - generic [ref=e1184]:
            - button "← Prev" [disabled]
            - generic [ref=e1185]: 1 / 6
            - button "Next →" [ref=e1186] [cursor=pointer]
```

# Test source

```ts
  184 |     await startInput.fill(fmt(startDate));
  185 |     await endInput.fill(fmt(now));
  186 | 
  187 |     // Trigger the filter (either auto or via apply button)
  188 |     const applyBtn = page.getByTestId('filter-apply');
  189 |     if (await applyBtn.isVisible()) {
  190 |       await applyBtn.click();
  191 |     }
  192 | 
  193 |     // Allow table to refresh
  194 |     await page.waitForTimeout(500);
  195 | 
  196 |     // Narrow range should return fewer events than the full unfiltered set
  197 |     // (seeded events span 29 days; last 5 days only contain a subset)
  198 |     const filteredRows = page.getByTestId('event-row');
  199 |     const totalAfter = await filteredRows.count();
  200 | 
  201 |     // The date-filtered count should be strictly less than the full dataset
  202 |     expect(totalAfter).toBeLessThan(totalBefore);
  203 |   });
  204 | 
  205 |   test('pagination — Next loads next page, Previous returns to prior page', async ({ page }) => {
  206 |     await page.goto(BASE_URL);
  207 | 
  208 |     // Make sure we are NOT filtering by event name so all 65 seeded events are visible
  209 |     // (plus any pre-existing data, total > 50 triggers pagination)
  210 |     const table = page.getByTestId('events-table');
  211 |     await expect(table).toBeVisible({ timeout: 10_000 });
  212 | 
  213 |     // Capture the identity shown in the first row on page 1
  214 |     const firstRowPage1 = page.getByTestId('event-row').first();
  215 |     await expect(firstRowPage1).toBeVisible();
  216 |     const identityPage1 = await firstRowPage1.getByTestId('cell-identity').textContent();
  217 | 
  218 |     // Click Next
  219 |     const nextBtn = page.getByTestId('pagination-next');
  220 |     await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
  221 |     await nextBtn.click();
  222 | 
  223 |     // Wait for page 2 to load
  224 |     await expect(page.getByTestId('event-row').first()).toBeVisible({ timeout: 8_000 });
  225 | 
  226 |     // Page 2 should show different data
  227 |     const firstRowPage2 = page.getByTestId('event-row').first();
  228 |     const identityPage2 = await firstRowPage2.getByTestId('cell-identity').textContent();
  229 |     expect(identityPage2).not.toEqual(identityPage1);
  230 | 
  231 |     // Click Previous to go back
  232 |     const prevBtn = page.getByTestId('pagination-prev');
  233 |     await expect(prevBtn).toBeEnabled({ timeout: 5_000 });
  234 |     await prevBtn.click();
  235 | 
  236 |     // Wait for page 1 to reload
  237 |     await expect(page.getByTestId('event-row').first()).toBeVisible({ timeout: 8_000 });
  238 | 
  239 |     const firstRowBack = page.getByTestId('event-row').first();
  240 |     const identityBack = await firstRowBack.getByTestId('cell-identity').textContent();
  241 |     expect(identityBack).toEqual(identityPage1);
  242 |   });
  243 | 
  244 |   test('clicking a table row expands to show all event properties as key-value pairs', async ({
  245 |     page,
  246 |   }) => {
  247 |     await page.goto(BASE_URL);
  248 | 
  249 |     // Filter to Purchase Completed so we get known properties
  250 |     const filter = page.getByTestId('filter-event-name');
  251 |     await expect(filter).toBeVisible({ timeout: 10_000 });
  252 |     await filter.selectOption(EVENT_PURCHASE);
  253 | 
  254 |     const firstRow = page.getByTestId('event-row').first();
  255 |     await expect(firstRow).toBeVisible({ timeout: 8_000 });
  256 | 
  257 |     // Click to expand
  258 |     await firstRow.click();
  259 | 
  260 |     // Expanded properties panel should appear
  261 |     const propsPanel = page.getByTestId('event-properties-detail');
  262 |     await expect(propsPanel).toBeVisible({ timeout: 5_000 });
  263 | 
  264 |     // Should contain known property keys seeded above
  265 |     await expect(propsPanel).toContainText('plan');
  266 |     await expect(propsPanel).toContainText('amount');
  267 |     await expect(propsPanel).toContainText('currency');
  268 |     await expect(propsPanel).toContainText('quantity');
  269 | 
  270 |     // Each property must be presented as a key-value pair
  271 |     const kvPairs = propsPanel.getByTestId('property-kv');
  272 |     await expect(kvPairs.first()).toBeVisible();
  273 |     const pairCount = await kvPairs.count();
  274 |     expect(pairCount).toBeGreaterThanOrEqual(4);
  275 |   });
  276 | 
  277 |   test('empty state message appears when filters match no events', async ({ page }) => {
  278 |     await page.goto(BASE_URL);
  279 | 
  280 |     const filter = page.getByTestId('filter-event-name');
  281 |     await expect(filter).toBeVisible({ timeout: 10_000 });
  282 | 
  283 |     // Select the non-existent event type
> 284 |     await filter.selectOption(EVENT_NONEXISTENT);
      |                  ^ TimeoutError: locator.selectOption: Timeout 5000ms exceeded.
  285 | 
  286 |     // The empty state element must appear
  287 |     const emptyState = page.getByTestId('events-empty-state');
  288 |     await expect(emptyState).toBeVisible({ timeout: 8_000 });
  289 | 
  290 |     // No event rows should be rendered
  291 |     const rows = page.getByTestId('event-row');
  292 |     expect(await rows.count()).toBe(0);
  293 |   });
  294 | 
  295 |   test('loading indicator is visible while data is being fetched', async ({ page }) => {
  296 |     // Intercept API calls and delay them so the spinner has time to appear
  297 |     await page.route('**/api/events**', async (route) => {
  298 |       await new Promise((resolve) => setTimeout(resolve, 1500));
  299 |       await route.continue();
  300 |     });
  301 | 
  302 |     await page.goto(BASE_URL);
  303 | 
  304 |     // The loading indicator must appear before the data arrives
  305 |     const loader = page.getByTestId('events-loading');
  306 |     await expect(loader).toBeVisible({ timeout: 5_000 });
  307 | 
  308 |     // After the delayed response, table should eventually render and loader disappear
  309 |     const table = page.getByTestId('events-table');
  310 |     await expect(table).toBeVisible({ timeout: 10_000 });
  311 |     await expect(loader).not.toBeVisible({ timeout: 5_000 });
  312 |   });
  313 | });
  314 | 
```