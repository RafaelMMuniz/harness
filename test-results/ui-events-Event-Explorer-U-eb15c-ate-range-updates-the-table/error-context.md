# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-events.spec.ts >> Event Explorer UI >> filter by date range updates the table
- Location: e2e/ui-events.spec.ts:160:7

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 200
Received:   200
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
        - textbox [ref=e37]: 2026-04-09
        - textbox [ref=e38]: 2026-04-14
        - button "Apply" [active] [ref=e39] [cursor=pointer]
      - generic [ref=e40]:
        - table [ref=e42]:
          - rowgroup [ref=e43]:
            - row "Timestamp Event User Properties" [ref=e44]:
              - columnheader "Timestamp" [ref=e45]
              - columnheader "Event" [ref=e46]
              - columnheader "User" [ref=e47]
              - columnheader "Properties" [ref=e48]
          - rowgroup [ref=e49]:
            - 'row "Apr 14, 2026, 06:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-4 duration_ms: 992, page: /home" [ref=e50] [cursor=pointer]':
              - cell "Apr 14, 2026, 06:15:27 PM" [ref=e51]
              - cell "test-ui-trends-page-viewed" [ref=e52]
              - cell "test-ui-trends-user-4" [ref=e53]
              - 'cell "duration_ms: 992, page: /home" [ref=e54]':
                - generic [ref=e55]: "duration_ms: 992, page: /home"
            - 'row "Apr 14, 2026, 03:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-3 duration_ms: 869, page: /blog" [ref=e56] [cursor=pointer]':
              - cell "Apr 14, 2026, 03:15:27 PM" [ref=e57]
              - cell "test-ui-trends-page-viewed" [ref=e58]
              - cell "test-ui-trends-user-3" [ref=e59]
              - 'cell "duration_ms: 869, page: /blog" [ref=e60]':
                - generic [ref=e61]: "duration_ms: 869, page: /blog"
            - 'row "Apr 14, 2026, 03:00:00 PM test-ui-enhanced-Page Viewed test-ui-enhanced-user@example.com page: /dashboard" [ref=e62] [cursor=pointer]':
              - cell "Apr 14, 2026, 03:00:00 PM" [ref=e63]
              - cell "test-ui-enhanced-Page Viewed" [ref=e64]
              - cell "test-ui-enhanced-user@example.com" [ref=e65]
              - 'cell "page: /dashboard" [ref=e66]':
                - generic [ref=e67]: "page: /dashboard"
            - row "Apr 14, 2026, 02:27:18 PM page_viewed test-identity-device-D —" [ref=e68] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:18 PM" [ref=e69]
              - cell "page_viewed" [ref=e70]
              - cell "test-identity-device-D" [ref=e71]
              - cell "—" [ref=e72]
            - row "Apr 14, 2026, 02:27:18 PM button_clicked test-identity-device-D —" [ref=e73] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:18 PM" [ref=e74]
              - cell "button_clicked" [ref=e75]
              - cell "test-identity-device-D" [ref=e76]
              - cell "—" [ref=e77]
            - row "Apr 14, 2026, 02:27:17 PM page_viewed test-identity-device-D —" [ref=e78] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:17 PM" [ref=e79]
              - cell "page_viewed" [ref=e80]
              - cell "test-identity-device-D" [ref=e81]
              - cell "—" [ref=e82]
            - row "Apr 14, 2026, 02:27:15 PM signup_completed test-identity-user-P —" [ref=e83] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e84]
              - cell "signup_completed" [ref=e85]
              - cell "test-identity-user-P" [ref=e86]
              - cell "—" [ref=e87]
            - row "Apr 14, 2026, 02:27:15 PM login test-identity-user-Z —" [ref=e88] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e89]
              - cell "login" [ref=e90]
              - cell "test-identity-user-Z" [ref=e91]
              - cell "—" [ref=e92]
            - row "Apr 14, 2026, 02:27:15 PM login test-identity-user-Z —" [ref=e93] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e94]
              - cell "login" [ref=e95]
              - cell "test-identity-user-Z" [ref=e96]
              - cell "—" [ref=e97]
            - row "Apr 14, 2026, 02:27:15 PM feature_used test-identity-device-B —" [ref=e98] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e99]
              - cell "feature_used" [ref=e100]
              - cell "test-identity-device-B" [ref=e101]
              - cell "—" [ref=e102]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-B —" [ref=e103] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e104]
              - cell "page_viewed" [ref=e105]
              - cell "test-identity-device-B" [ref=e106]
              - cell "—" [ref=e107]
            - row "Apr 14, 2026, 02:27:15 PM button_clicked test-identity-device-A —" [ref=e108] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e109]
              - cell "button_clicked" [ref=e110]
              - cell "test-identity-device-A" [ref=e111]
              - cell "—" [ref=e112]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-A —" [ref=e113] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e114]
              - cell "page_viewed" [ref=e115]
              - cell "test-identity-device-A" [ref=e116]
              - cell "—" [ref=e117]
            - row "Apr 14, 2026, 02:27:15 PM signup_completed test-identity-user-Y —" [ref=e118] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e119]
              - cell "signup_completed" [ref=e120]
              - cell "test-identity-user-Y" [ref=e121]
              - cell "—" [ref=e122]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-X —" [ref=e123] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e124]
              - cell "page_viewed" [ref=e125]
              - cell "test-identity-device-X" [ref=e126]
              - cell "—" [ref=e127]
            - row "Apr 14, 2026, 02:27:15 PM form_submitted test-identity-device-X —" [ref=e128] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e129]
              - cell "form_submitted" [ref=e130]
              - cell "test-identity-device-X" [ref=e131]
              - cell "—" [ref=e132]
            - row "Apr 14, 2026, 02:27:15 PM button_clicked test-identity-device-X —" [ref=e133] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e134]
              - cell "button_clicked" [ref=e135]
              - cell "test-identity-device-X" [ref=e136]
              - cell "—" [ref=e137]
            - row "Apr 14, 2026, 02:27:15 PM page_viewed test-identity-device-X —" [ref=e138] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:15 PM" [ref=e139]
              - cell "page_viewed" [ref=e140]
              - cell "test-identity-device-X" [ref=e141]
              - cell "—" [ref=e142]
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-types-event test-props-types-device-3 amount: 199.99, quantity: 1 +3" [ref=e143] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e144]
              - cell "test-props-types-event" [ref=e145]
              - cell "test-props-types-device-3" [ref=e146]
              - 'cell "amount: 199.99, quantity: 1 +3" [ref=e147]':
                - generic [ref=e148]: "amount: 199.99, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-types-event test-props-types-device-2 amount: 29, quantity: 10 +3" [ref=e149] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e150]
              - cell "test-props-types-event" [ref=e151]
              - cell "test-props-types-device-2" [ref=e152]
              - 'cell "amount: 29, quantity: 10 +3" [ref=e153]':
                - generic [ref=e154]: "amount: 29, quantity: 10 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-types-event test-props-types-device-1 amount: 99.99, quantity: 3 +3" [ref=e155] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e156]
              - cell "test-props-types-event" [ref=e157]
              - cell "test-props-types-device-1" [ref=e158]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e159]':
                - generic [ref=e160]: "amount: 99.99, quantity: 3 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-shape-event test-props-shape-device-3 amount: 149.5, quantity: 5 +3" [ref=e161] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e162]
              - cell "test-props-shape-event" [ref=e163]
              - cell "test-props-shape-device-3" [ref=e164]
              - 'cell "amount: 149.5, quantity: 5 +3" [ref=e165]':
                - generic [ref=e166]: "amount: 149.5, quantity: 5 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-shape-event test-props-shape-device-2 amount: 49, quantity: 1 +3" [ref=e167] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e168]
              - cell "test-props-shape-event" [ref=e169]
              - cell "test-props-shape-device-2" [ref=e170]
              - 'cell "amount: 49, quantity: 1 +3" [ref=e171]':
                - generic [ref=e172]: "amount: 49, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:27:13 PM test-props-shape-event test-props-shape-device-1 amount: 99.99, quantity: 3 +3" [ref=e173] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:13 PM" [ref=e174]
              - cell "test-props-shape-event" [ref=e175]
              - cell "test-props-shape-device-1" [ref=e176]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e177]':
                - generic [ref=e178]: "amount: 99.99, quantity: 3 +3"
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-mix-valid-2 api-events-batch-user-2 —" [ref=e179] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e180]
              - cell "api-events-batch-mix-valid-2" [ref=e181]
              - cell "api-events-batch-user-2" [ref=e182]
              - cell "—" [ref=e183]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-mix-valid-1 api-events-batch-device-3 —" [ref=e184] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e185]
              - cell "api-events-batch-mix-valid-1" [ref=e186]
              - cell "api-events-batch-device-3" [ref=e187]
              - cell "—" [ref=e188]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-event-c api-events-batch-user-1 —" [ref=e189] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e190]
              - cell "api-events-batch-event-c" [ref=e191]
              - cell "api-events-batch-user-1" [ref=e192]
              - cell "—" [ref=e193]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-event-b api-events-batch-device-2 —" [ref=e194] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e195]
              - cell "api-events-batch-event-b" [ref=e196]
              - cell "api-events-batch-device-2" [ref=e197]
              - cell "—" [ref=e198]
            - row "Apr 14, 2026, 02:27:12 PM api-events-batch-event-a api-events-batch-device-1 —" [ref=e199] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e200]
              - cell "api-events-batch-event-a" [ref=e201]
              - cell "api-events-batch-device-1" [ref=e202]
              - cell "—" [ref=e203]
            - 'row "Apr 14, 2026, 02:27:12 PM api-events-properties-roundtrip api-events-device-5 page: /home, duration_ms: 1234 +1" [ref=e204] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e205]
              - cell "api-events-properties-roundtrip" [ref=e206]
              - cell "api-events-device-5" [ref=e207]
              - 'cell "page: /home, duration_ms: 1234 +1" [ref=e208]':
                - generic [ref=e209]: "page: /home, duration_ms: 1234 +1"
            - row "Apr 14, 2026, 02:27:12 PM api-events-no-timestamp api-events-device-4 —" [ref=e210] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e211]
              - cell "api-events-no-timestamp" [ref=e212]
              - cell "api-events-device-4" [ref=e213]
              - cell "—" [ref=e214]
            - row "Apr 14, 2026, 02:27:12 PM api-events-minimal-user api-events-user-2 —" [ref=e215] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e216]
              - cell "api-events-minimal-user" [ref=e217]
              - cell "api-events-user-2" [ref=e218]
              - cell "—" [ref=e219]
            - row "Apr 14, 2026, 02:27:12 PM api-events-minimal-device api-events-device-2 —" [ref=e220] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:27:12 PM" [ref=e221]
              - cell "api-events-minimal-device" [ref=e222]
              - cell "api-events-device-2" [ref=e223]
              - cell "—" [ref=e224]
            - 'row "Apr 14, 2026, 02:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-7 amount: 59, currency: EUR +1" [ref=e225] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:15:27 PM" [ref=e226]
              - cell "test-ui-trends-purchase-completed" [ref=e227]
              - cell "test-ui-trends-user-7" [ref=e228]
              - 'cell "amount: 59, currency: EUR +1" [ref=e229]':
                - generic [ref=e230]: "amount: 59, currency: EUR +1"
            - row "Apr 14, 2026, 02:14:54 PM page_viewed test-identity-device-D —" [ref=e231] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:54 PM" [ref=e232]
              - cell "page_viewed" [ref=e233]
              - cell "test-identity-device-D" [ref=e234]
              - cell "—" [ref=e235]
            - row "Apr 14, 2026, 02:14:54 PM button_clicked test-identity-device-D —" [ref=e236] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:54 PM" [ref=e237]
              - cell "button_clicked" [ref=e238]
              - cell "test-identity-device-D" [ref=e239]
              - cell "—" [ref=e240]
            - row "Apr 14, 2026, 02:14:54 PM page_viewed test-identity-device-D —" [ref=e241] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:54 PM" [ref=e242]
              - cell "page_viewed" [ref=e243]
              - cell "test-identity-device-D" [ref=e244]
              - cell "—" [ref=e245]
            - row "Apr 14, 2026, 02:14:51 PM signup_completed test-identity-user-P —" [ref=e246] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e247]
              - cell "signup_completed" [ref=e248]
              - cell "test-identity-user-P" [ref=e249]
              - cell "—" [ref=e250]
            - row "Apr 14, 2026, 02:14:51 PM login test-identity-user-Z —" [ref=e251] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e252]
              - cell "login" [ref=e253]
              - cell "test-identity-user-Z" [ref=e254]
              - cell "—" [ref=e255]
            - row "Apr 14, 2026, 02:14:51 PM login test-identity-user-Z —" [ref=e256] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e257]
              - cell "login" [ref=e258]
              - cell "test-identity-user-Z" [ref=e259]
              - cell "—" [ref=e260]
            - row "Apr 14, 2026, 02:14:51 PM feature_used test-identity-device-B —" [ref=e261] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e262]
              - cell "feature_used" [ref=e263]
              - cell "test-identity-device-B" [ref=e264]
              - cell "—" [ref=e265]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-B —" [ref=e266] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e267]
              - cell "page_viewed" [ref=e268]
              - cell "test-identity-device-B" [ref=e269]
              - cell "—" [ref=e270]
            - row "Apr 14, 2026, 02:14:51 PM button_clicked test-identity-device-A —" [ref=e271] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e272]
              - cell "button_clicked" [ref=e273]
              - cell "test-identity-device-A" [ref=e274]
              - cell "—" [ref=e275]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-A —" [ref=e276] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e277]
              - cell "page_viewed" [ref=e278]
              - cell "test-identity-device-A" [ref=e279]
              - cell "—" [ref=e280]
            - row "Apr 14, 2026, 02:14:51 PM signup_completed test-identity-user-Y —" [ref=e281] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e282]
              - cell "signup_completed" [ref=e283]
              - cell "test-identity-user-Y" [ref=e284]
              - cell "—" [ref=e285]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-X —" [ref=e286] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e287]
              - cell "page_viewed" [ref=e288]
              - cell "test-identity-device-X" [ref=e289]
              - cell "—" [ref=e290]
            - row "Apr 14, 2026, 02:14:51 PM form_submitted test-identity-device-X —" [ref=e291] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e292]
              - cell "form_submitted" [ref=e293]
              - cell "test-identity-device-X" [ref=e294]
              - cell "—" [ref=e295]
            - row "Apr 14, 2026, 02:14:51 PM button_clicked test-identity-device-X —" [ref=e296] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e297]
              - cell "button_clicked" [ref=e298]
              - cell "test-identity-device-X" [ref=e299]
              - cell "—" [ref=e300]
            - row "Apr 14, 2026, 02:14:51 PM page_viewed test-identity-device-X —" [ref=e301] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:51 PM" [ref=e302]
              - cell "page_viewed" [ref=e303]
              - cell "test-identity-device-X" [ref=e304]
              - cell "—" [ref=e305]
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-types-event test-props-types-device-3 amount: 199.99, quantity: 1 +3" [ref=e306] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e307]
              - cell "test-props-types-event" [ref=e308]
              - cell "test-props-types-device-3" [ref=e309]
              - 'cell "amount: 199.99, quantity: 1 +3" [ref=e310]':
                - generic [ref=e311]: "amount: 199.99, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-types-event test-props-types-device-2 amount: 29, quantity: 10 +3" [ref=e312] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e313]
              - cell "test-props-types-event" [ref=e314]
              - cell "test-props-types-device-2" [ref=e315]
              - 'cell "amount: 29, quantity: 10 +3" [ref=e316]':
                - generic [ref=e317]: "amount: 29, quantity: 10 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-types-event test-props-types-device-1 amount: 99.99, quantity: 3 +3" [ref=e318] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e319]
              - cell "test-props-types-event" [ref=e320]
              - cell "test-props-types-device-1" [ref=e321]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e322]':
                - generic [ref=e323]: "amount: 99.99, quantity: 3 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-shape-event test-props-shape-device-3 amount: 149.5, quantity: 5 +3" [ref=e324] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e325]
              - cell "test-props-shape-event" [ref=e326]
              - cell "test-props-shape-device-3" [ref=e327]
              - 'cell "amount: 149.5, quantity: 5 +3" [ref=e328]':
                - generic [ref=e329]: "amount: 149.5, quantity: 5 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-shape-event test-props-shape-device-2 amount: 49, quantity: 1 +3" [ref=e330] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e331]
              - cell "test-props-shape-event" [ref=e332]
              - cell "test-props-shape-device-2" [ref=e333]
              - 'cell "amount: 49, quantity: 1 +3" [ref=e334]':
                - generic [ref=e335]: "amount: 49, quantity: 1 +3"
            - 'row "Apr 14, 2026, 02:14:49 PM test-props-shape-event test-props-shape-device-1 amount: 99.99, quantity: 3 +3" [ref=e336] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:49 PM" [ref=e337]
              - cell "test-props-shape-event" [ref=e338]
              - cell "test-props-shape-device-1" [ref=e339]
              - 'cell "amount: 99.99, quantity: 3 +3" [ref=e340]':
                - generic [ref=e341]: "amount: 99.99, quantity: 3 +3"
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-mix-valid-2 api-events-batch-user-2 —" [ref=e342] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e343]
              - cell "api-events-batch-mix-valid-2" [ref=e344]
              - cell "api-events-batch-user-2" [ref=e345]
              - cell "—" [ref=e346]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-mix-valid-1 api-events-batch-device-3 —" [ref=e347] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e348]
              - cell "api-events-batch-mix-valid-1" [ref=e349]
              - cell "api-events-batch-device-3" [ref=e350]
              - cell "—" [ref=e351]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-event-c api-events-batch-user-1 —" [ref=e352] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e353]
              - cell "api-events-batch-event-c" [ref=e354]
              - cell "api-events-batch-user-1" [ref=e355]
              - cell "—" [ref=e356]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-event-b api-events-batch-device-2 —" [ref=e357] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e358]
              - cell "api-events-batch-event-b" [ref=e359]
              - cell "api-events-batch-device-2" [ref=e360]
              - cell "—" [ref=e361]
            - row "Apr 14, 2026, 02:14:48 PM api-events-batch-event-a api-events-batch-device-1 —" [ref=e362] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e363]
              - cell "api-events-batch-event-a" [ref=e364]
              - cell "api-events-batch-device-1" [ref=e365]
              - cell "—" [ref=e366]
            - 'row "Apr 14, 2026, 02:14:48 PM api-events-properties-roundtrip api-events-device-5 page: /home, duration_ms: 1234 +1" [ref=e367] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e368]
              - cell "api-events-properties-roundtrip" [ref=e369]
              - cell "api-events-device-5" [ref=e370]
              - 'cell "page: /home, duration_ms: 1234 +1" [ref=e371]':
                - generic [ref=e372]: "page: /home, duration_ms: 1234 +1"
            - row "Apr 14, 2026, 02:14:48 PM api-events-no-timestamp api-events-device-4 —" [ref=e373] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:48 PM" [ref=e374]
              - cell "api-events-no-timestamp" [ref=e375]
              - cell "api-events-device-4" [ref=e376]
              - cell "—" [ref=e377]
            - row "Apr 14, 2026, 02:14:47 PM api-events-minimal-user api-events-user-2 —" [ref=e378] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:47 PM" [ref=e379]
              - cell "api-events-minimal-user" [ref=e380]
              - cell "api-events-user-2" [ref=e381]
              - cell "—" [ref=e382]
            - row "Apr 14, 2026, 02:14:47 PM api-events-minimal-device api-events-device-2 —" [ref=e383] [cursor=pointer]:
              - cell "Apr 14, 2026, 02:14:47 PM" [ref=e384]
              - cell "api-events-minimal-device" [ref=e385]
              - cell "api-events-device-2" [ref=e386]
              - cell "—" [ref=e387]
            - 'row "Apr 14, 2026, 02:00:00 PM test-ui-enhanced-Purchase Completed test-ui-enhanced-user@example.com amount: 99, currency: USD +1" [ref=e388] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:00:00 PM" [ref=e389]
              - cell "test-ui-enhanced-Purchase Completed" [ref=e390]
              - cell "test-ui-enhanced-user@example.com" [ref=e391]
              - 'cell "amount: 99, currency: USD +1" [ref=e392]':
                - generic [ref=e393]: "amount: 99, currency: USD +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e394] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e395]
              - cell "test-ui-events-Page Viewed" [ref=e396]
              - cell "test-ui-events-user-u1" [ref=e397]
              - 'cell "page: /blog, referrer: google +1" [ref=e398]':
                - generic [ref=e399]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e400] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e401]
              - cell "test-ui-events-Page Viewed" [ref=e402]
              - cell "test-ui-events-user-u1" [ref=e403]
              - 'cell "page: /blog, referrer: google +1" [ref=e404]':
                - generic [ref=e405]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 01:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u1 page: /blog, referrer: google +1" [ref=e406] [cursor=pointer]':
              - cell "Apr 14, 2026, 01:00:00 PM" [ref=e407]
              - cell "test-ui-events-Page Viewed" [ref=e408]
              - cell "test-ui-events-user-u1" [ref=e409]
              - 'cell "page: /blog, referrer: google +1" [ref=e410]':
                - generic [ref=e411]: "page: /blog, referrer: google +1"
            - 'row "Apr 14, 2026, 12:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-2 duration_ms: 746, page: /docs" [ref=e412] [cursor=pointer]':
              - cell "Apr 14, 2026, 12:15:27 PM" [ref=e413]
              - cell "test-ui-trends-page-viewed" [ref=e414]
              - cell "test-ui-trends-user-2" [ref=e415]
              - 'cell "duration_ms: 746, page: /docs" [ref=e416]':
                - generic [ref=e417]: "duration_ms: 746, page: /docs"
            - 'row "Apr 14, 2026, 12:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-6 amount: 52, currency: USD +1" [ref=e418] [cursor=pointer]':
              - cell "Apr 14, 2026, 12:15:27 PM" [ref=e419]
              - cell "test-ui-trends-purchase-completed" [ref=e420]
              - cell "test-ui-trends-user-6" [ref=e421]
              - 'cell "amount: 52, currency: USD +1" [ref=e422]':
                - generic [ref=e423]: "amount: 52, currency: USD +1"
            - 'row "Apr 14, 2026, 10:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-5 amount: 45, currency: EUR +1" [ref=e424] [cursor=pointer]':
              - cell "Apr 14, 2026, 10:15:27 AM" [ref=e425]
              - cell "test-ui-trends-purchase-completed" [ref=e426]
              - cell "test-ui-trends-user-5" [ref=e427]
              - 'cell "amount: 45, currency: EUR +1" [ref=e428]':
                - generic [ref=e429]: "amount: 45, currency: EUR +1"
            - 'row "Apr 14, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-1 duration_ms: 623, page: /pricing" [ref=e430] [cursor=pointer]':
              - cell "Apr 14, 2026, 09:15:27 AM" [ref=e431]
              - cell "test-ui-trends-page-viewed" [ref=e432]
              - cell "test-ui-trends-user-1" [ref=e433]
              - 'cell "duration_ms: 623, page: /pricing" [ref=e434]':
                - generic [ref=e435]: "duration_ms: 623, page: /pricing"
            - 'row "Apr 14, 2026, 08:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-4 amount: 38, currency: USD +1" [ref=e436] [cursor=pointer]':
              - cell "Apr 14, 2026, 08:15:27 AM" [ref=e437]
              - cell "test-ui-trends-purchase-completed" [ref=e438]
              - cell "test-ui-trends-user-4" [ref=e439]
              - 'cell "amount: 38, currency: USD +1" [ref=e440]':
                - generic [ref=e441]: "amount: 38, currency: USD +1"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-2 page: /contact" [ref=e442] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e443]
              - cell "test-trends-breakdown-event" [ref=e444]
              - cell "test-trends-breakdown-device-contact-2" [ref=e445]
              - 'cell "page: /contact" [ref=e446]':
                - generic [ref=e447]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-1 page: /contact" [ref=e448] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e449]
              - cell "test-trends-breakdown-event" [ref=e450]
              - cell "test-trends-breakdown-device-contact-1" [ref=e451]
              - 'cell "page: /contact" [ref=e452]':
                - generic [ref=e453]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-0 page: /contact" [ref=e454] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e455]
              - cell "test-trends-breakdown-event" [ref=e456]
              - cell "test-trends-breakdown-device-contact-0" [ref=e457]
              - 'cell "page: /contact" [ref=e458]':
                - generic [ref=e459]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-2 page: /about" [ref=e460] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e461]
              - cell "test-trends-breakdown-event" [ref=e462]
              - cell "test-trends-breakdown-device-about-2" [ref=e463]
              - 'cell "page: /about" [ref=e464]':
                - generic [ref=e465]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-1 page: /about" [ref=e466] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e467]
              - cell "test-trends-breakdown-event" [ref=e468]
              - cell "test-trends-breakdown-device-about-1" [ref=e469]
              - 'cell "page: /about" [ref=e470]':
                - generic [ref=e471]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-0 page: /about" [ref=e472] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e473]
              - cell "test-trends-breakdown-event" [ref=e474]
              - cell "test-trends-breakdown-device-about-0" [ref=e475]
              - 'cell "page: /about" [ref=e476]':
                - generic [ref=e477]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-2 page: /blog" [ref=e478] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e479]
              - cell "test-trends-breakdown-event" [ref=e480]
              - cell "test-trends-breakdown-device-blog-2" [ref=e481]
              - 'cell "page: /blog" [ref=e482]':
                - generic [ref=e483]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-1 page: /blog" [ref=e484] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e485]
              - cell "test-trends-breakdown-event" [ref=e486]
              - cell "test-trends-breakdown-device-blog-1" [ref=e487]
              - 'cell "page: /blog" [ref=e488]':
                - generic [ref=e489]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-0 page: /blog" [ref=e490] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e491]
              - cell "test-trends-breakdown-event" [ref=e492]
              - cell "test-trends-breakdown-device-blog-0" [ref=e493]
              - 'cell "page: /blog" [ref=e494]':
                - generic [ref=e495]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-2 page: /docs" [ref=e496] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e497]
              - cell "test-trends-breakdown-event" [ref=e498]
              - cell "test-trends-breakdown-device-docs-2" [ref=e499]
              - 'cell "page: /docs" [ref=e500]':
                - generic [ref=e501]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-1 page: /docs" [ref=e502] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e503]
              - cell "test-trends-breakdown-event" [ref=e504]
              - cell "test-trends-breakdown-device-docs-1" [ref=e505]
              - 'cell "page: /docs" [ref=e506]':
                - generic [ref=e507]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-0 page: /docs" [ref=e508] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e509]
              - cell "test-trends-breakdown-event" [ref=e510]
              - cell "test-trends-breakdown-device-docs-0" [ref=e511]
              - 'cell "page: /docs" [ref=e512]':
                - generic [ref=e513]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-2 page: /pricing" [ref=e514] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e515]
              - cell "test-trends-breakdown-event" [ref=e516]
              - cell "test-trends-breakdown-device-pricing-2" [ref=e517]
              - 'cell "page: /pricing" [ref=e518]':
                - generic [ref=e519]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-1 page: /pricing" [ref=e520] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e521]
              - cell "test-trends-breakdown-event" [ref=e522]
              - cell "test-trends-breakdown-device-pricing-1" [ref=e523]
              - 'cell "page: /pricing" [ref=e524]':
                - generic [ref=e525]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-0 page: /pricing" [ref=e526] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e527]
              - cell "test-trends-breakdown-event" [ref=e528]
              - cell "test-trends-breakdown-device-pricing-0" [ref=e529]
              - 'cell "page: /pricing" [ref=e530]':
                - generic [ref=e531]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-2 page: /home" [ref=e532] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e533]
              - cell "test-trends-breakdown-event" [ref=e534]
              - cell "test-trends-breakdown-device-home-2" [ref=e535]
              - 'cell "page: /home" [ref=e536]':
                - generic [ref=e537]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-1 page: /home" [ref=e538] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e539]
              - cell "test-trends-breakdown-event" [ref=e540]
              - cell "test-trends-breakdown-device-home-1" [ref=e541]
              - 'cell "page: /home" [ref=e542]':
                - generic [ref=e543]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-0 page: /home" [ref=e544] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e545]
              - cell "test-trends-breakdown-event" [ref=e546]
              - cell "test-trends-breakdown-device-home-0" [ref=e547]
              - 'cell "page: /home" [ref=e548]':
                - generic [ref=e549]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a label: hello" [ref=e550] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e551]
              - cell "test-trends-numeric-event" [ref=e552]
              - cell "test-trends-numeric-device-a" [ref=e553]
              - 'cell "label: hello" [ref=e554]':
                - generic [ref=e555]: "label: hello"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-b amount: 50" [ref=e556] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e557]
              - cell "test-trends-numeric-event" [ref=e558]
              - cell "test-trends-numeric-device-b" [ref=e559]
              - 'cell "amount: 50" [ref=e560]':
                - generic [ref=e561]: "amount: 50"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 200" [ref=e562] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e563]
              - cell "test-trends-numeric-event" [ref=e564]
              - cell "test-trends-numeric-device-a" [ref=e565]
              - 'cell "amount: 200" [ref=e566]':
                - generic [ref=e567]: "amount: 200"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 100" [ref=e568] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e569]
              - cell "test-trends-numeric-event" [ref=e570]
              - cell "test-trends-numeric-device-a" [ref=e571]
              - 'cell "amount: 100" [ref=e572]':
                - generic [ref=e573]: "amount: 100"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-b amount: 50" [ref=e574] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e575]
              - cell "test-trends-numeric-event" [ref=e576]
              - cell "test-trends-numeric-device-b" [ref=e577]
              - 'cell "amount: 50" [ref=e578]':
                - generic [ref=e579]: "amount: 50"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 200" [ref=e580] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e581]
              - cell "test-trends-numeric-event" [ref=e582]
              - cell "test-trends-numeric-device-a" [ref=e583]
              - 'cell "amount: 200" [ref=e584]':
                - generic [ref=e585]: "amount: 200"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 100" [ref=e586] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e587]
              - cell "test-trends-numeric-event" [ref=e588]
              - cell "test-trends-numeric-device-a" [ref=e589]
              - 'cell "amount: 100" [ref=e590]':
                - generic [ref=e591]: "amount: 100"
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-link test-trends-identity-user-1 —" [ref=e592] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e593]
              - cell "test-trends-identity-link" [ref=e594]
              - cell "test-trends-identity-user-1" [ref=e595]
              - cell "—" [ref=e596]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e597] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e598]
              - cell "test-trends-identity-event" [ref=e599]
              - cell "test-trends-identity-device-1" [ref=e600]
              - cell "—" [ref=e601]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e602] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e603]
              - cell "test-trends-identity-event" [ref=e604]
              - cell "test-trends-identity-device-1" [ref=e605]
              - cell "—" [ref=e606]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e607] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e608]
              - cell "test-trends-identity-event" [ref=e609]
              - cell "test-trends-identity-device-1" [ref=e610]
              - cell "—" [ref=e611]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-zerofill-event test-trends-zerofill-device-1 —" [ref=e612] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e613]
              - cell "test-trends-zerofill-event" [ref=e614]
              - cell "test-trends-zerofill-device-1" [ref=e615]
              - cell "—" [ref=e616]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e617] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e618]
              - cell "test-trends-granularity-event" [ref=e619]
              - cell "test-trends-gran-device-1" [ref=e620]
              - cell "—" [ref=e621]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e622] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e623]
              - cell "test-trends-shape-event" [ref=e624]
              - cell "test-trends-shape-device-1" [ref=e625]
              - cell "—" [ref=e626]
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-2 page: /contact" [ref=e627] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e628]
              - cell "test-trends-breakdown-event" [ref=e629]
              - cell "test-trends-breakdown-device-contact-2" [ref=e630]
              - 'cell "page: /contact" [ref=e631]':
                - generic [ref=e632]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-1 page: /contact" [ref=e633] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e634]
              - cell "test-trends-breakdown-event" [ref=e635]
              - cell "test-trends-breakdown-device-contact-1" [ref=e636]
              - 'cell "page: /contact" [ref=e637]':
                - generic [ref=e638]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-contact-0 page: /contact" [ref=e639] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e640]
              - cell "test-trends-breakdown-event" [ref=e641]
              - cell "test-trends-breakdown-device-contact-0" [ref=e642]
              - 'cell "page: /contact" [ref=e643]':
                - generic [ref=e644]: "page: /contact"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-2 page: /about" [ref=e645] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e646]
              - cell "test-trends-breakdown-event" [ref=e647]
              - cell "test-trends-breakdown-device-about-2" [ref=e648]
              - 'cell "page: /about" [ref=e649]':
                - generic [ref=e650]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-1 page: /about" [ref=e651] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e652]
              - cell "test-trends-breakdown-event" [ref=e653]
              - cell "test-trends-breakdown-device-about-1" [ref=e654]
              - 'cell "page: /about" [ref=e655]':
                - generic [ref=e656]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-about-0 page: /about" [ref=e657] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e658]
              - cell "test-trends-breakdown-event" [ref=e659]
              - cell "test-trends-breakdown-device-about-0" [ref=e660]
              - 'cell "page: /about" [ref=e661]':
                - generic [ref=e662]: "page: /about"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-2 page: /blog" [ref=e663] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e664]
              - cell "test-trends-breakdown-event" [ref=e665]
              - cell "test-trends-breakdown-device-blog-2" [ref=e666]
              - 'cell "page: /blog" [ref=e667]':
                - generic [ref=e668]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-1 page: /blog" [ref=e669] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e670]
              - cell "test-trends-breakdown-event" [ref=e671]
              - cell "test-trends-breakdown-device-blog-1" [ref=e672]
              - 'cell "page: /blog" [ref=e673]':
                - generic [ref=e674]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-blog-0 page: /blog" [ref=e675] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e676]
              - cell "test-trends-breakdown-event" [ref=e677]
              - cell "test-trends-breakdown-device-blog-0" [ref=e678]
              - 'cell "page: /blog" [ref=e679]':
                - generic [ref=e680]: "page: /blog"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-2 page: /docs" [ref=e681] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e682]
              - cell "test-trends-breakdown-event" [ref=e683]
              - cell "test-trends-breakdown-device-docs-2" [ref=e684]
              - 'cell "page: /docs" [ref=e685]':
                - generic [ref=e686]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-1 page: /docs" [ref=e687] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e688]
              - cell "test-trends-breakdown-event" [ref=e689]
              - cell "test-trends-breakdown-device-docs-1" [ref=e690]
              - 'cell "page: /docs" [ref=e691]':
                - generic [ref=e692]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-docs-0 page: /docs" [ref=e693] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e694]
              - cell "test-trends-breakdown-event" [ref=e695]
              - cell "test-trends-breakdown-device-docs-0" [ref=e696]
              - 'cell "page: /docs" [ref=e697]':
                - generic [ref=e698]: "page: /docs"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-2 page: /pricing" [ref=e699] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e700]
              - cell "test-trends-breakdown-event" [ref=e701]
              - cell "test-trends-breakdown-device-pricing-2" [ref=e702]
              - 'cell "page: /pricing" [ref=e703]':
                - generic [ref=e704]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-1 page: /pricing" [ref=e705] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e706]
              - cell "test-trends-breakdown-event" [ref=e707]
              - cell "test-trends-breakdown-device-pricing-1" [ref=e708]
              - 'cell "page: /pricing" [ref=e709]':
                - generic [ref=e710]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-pricing-0 page: /pricing" [ref=e711] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e712]
              - cell "test-trends-breakdown-event" [ref=e713]
              - cell "test-trends-breakdown-device-pricing-0" [ref=e714]
              - 'cell "page: /pricing" [ref=e715]':
                - generic [ref=e716]: "page: /pricing"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-2 page: /home" [ref=e717] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e718]
              - cell "test-trends-breakdown-event" [ref=e719]
              - cell "test-trends-breakdown-device-home-2" [ref=e720]
              - 'cell "page: /home" [ref=e721]':
                - generic [ref=e722]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-1 page: /home" [ref=e723] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e724]
              - cell "test-trends-breakdown-event" [ref=e725]
              - cell "test-trends-breakdown-device-home-1" [ref=e726]
              - 'cell "page: /home" [ref=e727]':
                - generic [ref=e728]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-breakdown-event test-trends-breakdown-device-home-0 page: /home" [ref=e729] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e730]
              - cell "test-trends-breakdown-event" [ref=e731]
              - cell "test-trends-breakdown-device-home-0" [ref=e732]
              - 'cell "page: /home" [ref=e733]':
                - generic [ref=e734]: "page: /home"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a label: hello" [ref=e735] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e736]
              - cell "test-trends-numeric-event" [ref=e737]
              - cell "test-trends-numeric-device-a" [ref=e738]
              - 'cell "label: hello" [ref=e739]':
                - generic [ref=e740]: "label: hello"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-b amount: 50" [ref=e741] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e742]
              - cell "test-trends-numeric-event" [ref=e743]
              - cell "test-trends-numeric-device-b" [ref=e744]
              - 'cell "amount: 50" [ref=e745]':
                - generic [ref=e746]: "amount: 50"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 200" [ref=e747] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e748]
              - cell "test-trends-numeric-event" [ref=e749]
              - cell "test-trends-numeric-device-a" [ref=e750]
              - 'cell "amount: 200" [ref=e751]':
                - generic [ref=e752]: "amount: 200"
            - 'row "Apr 14, 2026, 07:00:00 AM test-trends-numeric-event test-trends-numeric-device-a amount: 100" [ref=e753] [cursor=pointer]':
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e754]
              - cell "test-trends-numeric-event" [ref=e755]
              - cell "test-trends-numeric-device-a" [ref=e756]
              - 'cell "amount: 100" [ref=e757]':
                - generic [ref=e758]: "amount: 100"
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-link test-trends-identity-user-1 —" [ref=e759] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e760]
              - cell "test-trends-identity-link" [ref=e761]
              - cell "test-trends-identity-user-1" [ref=e762]
              - cell "—" [ref=e763]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e764] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e765]
              - cell "test-trends-identity-event" [ref=e766]
              - cell "test-trends-identity-device-1" [ref=e767]
              - cell "—" [ref=e768]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e769] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e770]
              - cell "test-trends-identity-event" [ref=e771]
              - cell "test-trends-identity-device-1" [ref=e772]
              - cell "—" [ref=e773]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-identity-event test-trends-identity-device-1 —" [ref=e774] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e775]
              - cell "test-trends-identity-event" [ref=e776]
              - cell "test-trends-identity-device-1" [ref=e777]
              - cell "—" [ref=e778]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-zerofill-event test-trends-zerofill-device-1 —" [ref=e779] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e780]
              - cell "test-trends-zerofill-event" [ref=e781]
              - cell "test-trends-zerofill-device-1" [ref=e782]
              - cell "—" [ref=e783]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e784] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e785]
              - cell "test-trends-granularity-event" [ref=e786]
              - cell "test-trends-gran-device-1" [ref=e787]
              - cell "—" [ref=e788]
            - row "Apr 14, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e789] [cursor=pointer]:
              - cell "Apr 14, 2026, 07:00:00 AM" [ref=e790]
              - cell "test-trends-shape-event" [ref=e791]
              - cell "test-trends-shape-device-1" [ref=e792]
              - cell "—" [ref=e793]
            - 'row "Apr 14, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-0 duration_ms: 500, page: /home" [ref=e794] [cursor=pointer]':
              - cell "Apr 14, 2026, 06:15:27 AM" [ref=e795]
              - cell "test-ui-trends-page-viewed" [ref=e796]
              - cell "test-ui-trends-user-0" [ref=e797]
              - 'cell "duration_ms: 500, page: /home" [ref=e798]':
                - generic [ref=e799]: "duration_ms: 500, page: /home"
            - 'row "Apr 14, 2026, 06:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-3 amount: 31, currency: EUR +1" [ref=e800] [cursor=pointer]':
              - cell "Apr 14, 2026, 06:15:27 AM" [ref=e801]
              - cell "test-ui-trends-purchase-completed" [ref=e802]
              - cell "test-ui-trends-user-3" [ref=e803]
              - 'cell "amount: 31, currency: EUR +1" [ref=e804]':
                - generic [ref=e805]: "amount: 31, currency: EUR +1"
            - 'row "Apr 14, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-2 amount: 24, currency: USD +1" [ref=e806] [cursor=pointer]':
              - cell "Apr 14, 2026, 04:15:27 AM" [ref=e807]
              - cell "test-ui-trends-purchase-completed" [ref=e808]
              - cell "test-ui-trends-user-2" [ref=e809]
              - 'cell "amount: 24, currency: USD +1" [ref=e810]':
                - generic [ref=e811]: "amount: 24, currency: USD +1"
            - 'row "Apr 14, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-1 amount: 17, currency: EUR +1" [ref=e812] [cursor=pointer]':
              - cell "Apr 14, 2026, 02:15:27 AM" [ref=e813]
              - cell "test-ui-trends-purchase-completed" [ref=e814]
              - cell "test-ui-trends-user-1" [ref=e815]
              - 'cell "amount: 17, currency: EUR +1" [ref=e816]':
                - generic [ref=e817]: "amount: 17, currency: EUR +1"
            - 'row "Apr 14, 2026, 12:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-0 amount: 10, currency: USD +1" [ref=e818] [cursor=pointer]':
              - cell "Apr 14, 2026, 12:15:27 AM" [ref=e819]
              - cell "test-ui-trends-purchase-completed" [ref=e820]
              - cell "test-ui-trends-user-0" [ref=e821]
              - 'cell "amount: 10, currency: USD +1" [ref=e822]':
                - generic [ref=e823]: "amount: 10, currency: USD +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e824] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e825]
              - cell "test-ui-events-Page Viewed" [ref=e826]
              - cell "test-ui-events-user-u0" [ref=e827]
              - 'cell "page: /docs, referrer: direct +1" [ref=e828]':
                - generic [ref=e829]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e830] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e831]
              - cell "test-ui-events-Page Viewed" [ref=e832]
              - cell "test-ui-events-user-u0" [ref=e833]
              - 'cell "page: /docs, referrer: direct +1" [ref=e834]':
                - generic [ref=e835]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 12:00:00 PM test-ui-events-Page Viewed test-ui-events-user-u0 page: /docs, referrer: direct +1" [ref=e836] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:00:00 PM" [ref=e837]
              - cell "test-ui-events-Page Viewed" [ref=e838]
              - cell "test-ui-events-user-u0" [ref=e839]
              - 'cell "page: /docs, referrer: direct +1" [ref=e840]':
                - generic [ref=e841]: "page: /docs, referrer: direct +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e842] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e843]
              - cell "test-ui-events-Button Clicked" [ref=e844]
              - cell "test-ui-events-user-u0" [ref=e845]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e846]':
                - generic [ref=e847]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e848] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e849]
              - cell "test-ui-events-Button Clicked" [ref=e850]
              - cell "test-ui-events-user-u0" [ref=e851]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e852]':
                - generic [ref=e853]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 11:00:00 AM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Contact, page: /signup +1" [ref=e854] [cursor=pointer]':
              - cell "Apr 13, 2026, 11:00:00 AM" [ref=e855]
              - cell "test-ui-events-Button Clicked" [ref=e856]
              - cell "test-ui-events-user-u0" [ref=e857]
              - 'cell "button_label: Contact, page: /signup +1" [ref=e858]':
                - generic [ref=e859]: "button_label: Contact, page: /signup +1"
            - 'row "Apr 13, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-6 duration_ms: 640, page: /pricing" [ref=e860] [cursor=pointer]':
              - cell "Apr 13, 2026, 09:15:27 AM" [ref=e861]
              - cell "test-ui-trends-page-viewed" [ref=e862]
              - cell "test-ui-trends-user-6" [ref=e863]
              - 'cell "duration_ms: 640, page: /pricing" [ref=e864]':
                - generic [ref=e865]: "duration_ms: 640, page: /pricing"
            - 'row "Apr 13, 2026, 09:00:00 AM test-ui-enhanced-Login test-ui-enhanced-user@example.com method: google" [ref=e866] [cursor=pointer]':
              - cell "Apr 13, 2026, 09:00:00 AM" [ref=e867]
              - cell "test-ui-enhanced-Login" [ref=e868]
              - cell "test-ui-enhanced-user@example.com" [ref=e869]
              - 'cell "method: google" [ref=e870]':
                - generic [ref=e871]: "method: google"
            - 'row "Apr 13, 2026, 08:00:00 AM test-ui-enhanced-Signup Completed test-ui-enhanced-user@example.com plan: pro" [ref=e872] [cursor=pointer]':
              - cell "Apr 13, 2026, 08:00:00 AM" [ref=e873]
              - cell "test-ui-enhanced-Signup Completed" [ref=e874]
              - cell "test-ui-enhanced-user@example.com" [ref=e875]
              - 'cell "plan: pro" [ref=e876]':
                - generic [ref=e877]: "plan: pro"
            - row "Apr 13, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e878] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e879]
              - cell "test-trends-granularity-event" [ref=e880]
              - cell "test-trends-gran-device-1" [ref=e881]
              - cell "—" [ref=e882]
            - row "Apr 13, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e883] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e884]
              - cell "test-trends-shape-event" [ref=e885]
              - cell "test-trends-shape-device-1" [ref=e886]
              - cell "—" [ref=e887]
            - row "Apr 13, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e888] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e889]
              - cell "test-trends-granularity-event" [ref=e890]
              - cell "test-trends-gran-device-1" [ref=e891]
              - cell "—" [ref=e892]
            - row "Apr 13, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e893] [cursor=pointer]:
              - cell "Apr 13, 2026, 07:00:00 AM" [ref=e894]
              - cell "test-trends-shape-event" [ref=e895]
              - cell "test-trends-shape-device-1" [ref=e896]
              - cell "—" [ref=e897]
            - 'row "Apr 13, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-5 duration_ms: 517, page: /home" [ref=e898] [cursor=pointer]':
              - cell "Apr 13, 2026, 06:15:27 AM" [ref=e899]
              - cell "test-ui-trends-page-viewed" [ref=e900]
              - cell "test-ui-trends-user-5" [ref=e901]
              - 'cell "duration_ms: 517, page: /home" [ref=e902]':
                - generic [ref=e903]: "duration_ms: 517, page: /home"
            - 'row "Apr 13, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-12 amount: 27, currency: USD +1" [ref=e904] [cursor=pointer]':
              - cell "Apr 13, 2026, 04:15:27 AM" [ref=e905]
              - cell "test-ui-trends-purchase-completed" [ref=e906]
              - cell "test-ui-trends-user-12" [ref=e907]
              - 'cell "amount: 27, currency: USD +1" [ref=e908]':
                - generic [ref=e909]: "amount: 27, currency: USD +1"
            - 'row "Apr 13, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-11 amount: 20, currency: EUR +1" [ref=e910] [cursor=pointer]':
              - cell "Apr 13, 2026, 02:15:27 AM" [ref=e911]
              - cell "test-ui-trends-purchase-completed" [ref=e912]
              - cell "test-ui-trends-user-11" [ref=e913]
              - 'cell "amount: 20, currency: EUR +1" [ref=e914]':
                - generic [ref=e915]: "amount: 20, currency: EUR +1"
            - 'row "Apr 13, 2026, 12:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-10 amount: 13, currency: USD +1" [ref=e916] [cursor=pointer]':
              - cell "Apr 13, 2026, 12:15:27 AM" [ref=e917]
              - cell "test-ui-trends-purchase-completed" [ref=e918]
              - cell "test-ui-trends-user-10" [ref=e919]
              - 'cell "amount: 13, currency: USD +1" [ref=e920]':
                - generic [ref=e921]: "amount: 13, currency: USD +1"
            - 'row "Apr 12, 2026, 09:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-15 duration_ms: 1149, page: /pricing" [ref=e922] [cursor=pointer]':
              - cell "Apr 12, 2026, 09:15:27 PM" [ref=e923]
              - cell "test-ui-trends-page-viewed" [ref=e924]
              - cell "test-ui-trends-user-15" [ref=e925]
              - 'cell "duration_ms: 1149, page: /pricing" [ref=e926]':
                - generic [ref=e927]: "duration_ms: 1149, page: /pricing"
            - 'row "Apr 12, 2026, 06:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-14 duration_ms: 1026, page: /home" [ref=e928] [cursor=pointer]':
              - cell "Apr 12, 2026, 06:15:27 PM" [ref=e929]
              - cell "test-ui-trends-page-viewed" [ref=e930]
              - cell "test-ui-trends-user-14" [ref=e931]
              - 'cell "duration_ms: 1026, page: /home" [ref=e932]':
                - generic [ref=e933]: "duration_ms: 1026, page: /home"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e934] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e935]
              - cell "test-ui-events-Button Clicked" [ref=e936]
              - cell "test-ui-events-user-u1" [ref=e937]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e938]':
                - generic [ref=e939]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e940] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e941]
              - cell "test-ui-events-Button Clicked" [ref=e942]
              - cell "test-ui-events-user-u1" [ref=e943]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e944]':
                - generic [ref=e945]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 04:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u1 button_label: Buy Now, page: /blog +1" [ref=e946] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:00:00 PM" [ref=e947]
              - cell "test-ui-events-Button Clicked" [ref=e948]
              - cell "test-ui-events-user-u1" [ref=e949]
              - 'cell "button_label: Buy Now, page: /blog +1" [ref=e950]':
                - generic [ref=e951]: "button_label: Buy Now, page: /blog +1"
            - 'row "Apr 12, 2026, 03:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-13 duration_ms: 903, page: /blog" [ref=e952] [cursor=pointer]':
              - cell "Apr 12, 2026, 03:15:27 PM" [ref=e953]
              - cell "test-ui-trends-page-viewed" [ref=e954]
              - cell "test-ui-trends-user-13" [ref=e955]
              - 'cell "duration_ms: 903, page: /blog" [ref=e956]':
                - generic [ref=e957]: "duration_ms: 903, page: /blog"
            - 'row "Apr 12, 2026, 12:15:27 PM test-ui-trends-page-viewed test-ui-trends-user-12 duration_ms: 780, page: /docs" [ref=e958] [cursor=pointer]':
              - cell "Apr 12, 2026, 12:15:27 PM" [ref=e959]
              - cell "test-ui-trends-page-viewed" [ref=e960]
              - cell "test-ui-trends-user-12" [ref=e961]
              - 'cell "duration_ms: 780, page: /docs" [ref=e962]':
                - generic [ref=e963]: "duration_ms: 780, page: /docs"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e964] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e965]
              - cell "test-ui-events-Page Viewed" [ref=e966]
              - cell "test-ui-events-user-u2" [ref=e967]
              - 'cell "page: /pricing, referrer: google +1" [ref=e968]':
                - generic [ref=e969]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e970] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e971]
              - cell "test-ui-events-Page Viewed" [ref=e972]
              - cell "test-ui-events-user-u2" [ref=e973]
              - 'cell "page: /pricing, referrer: google +1" [ref=e974]':
                - generic [ref=e975]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 11:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u2 page: /pricing, referrer: google +1" [ref=e976] [cursor=pointer]':
              - cell "Apr 12, 2026, 11:00:00 AM" [ref=e977]
              - cell "test-ui-events-Page Viewed" [ref=e978]
              - cell "test-ui-events-user-u2" [ref=e979]
              - 'cell "page: /pricing, referrer: google +1" [ref=e980]':
                - generic [ref=e981]: "page: /pricing, referrer: google +1"
            - 'row "Apr 12, 2026, 10:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-5 amount: 51, currency: EUR +1" [ref=e982] [cursor=pointer]':
              - cell "Apr 12, 2026, 10:15:27 AM" [ref=e983]
              - cell "test-ui-trends-purchase-completed" [ref=e984]
              - cell "test-ui-trends-user-5" [ref=e985]
              - 'cell "amount: 51, currency: EUR +1" [ref=e986]':
                - generic [ref=e987]: "amount: 51, currency: EUR +1"
            - 'row "Apr 12, 2026, 10:15:00 AM test-ui-enhanced-Feature Used test-ui-enhanced-device-B feature: dark-mode" [ref=e988] [cursor=pointer]':
              - cell "Apr 12, 2026, 10:15:00 AM" [ref=e989]
              - cell "test-ui-enhanced-Feature Used" [ref=e990]
              - cell "test-ui-enhanced-device-B" [ref=e991]
              - 'cell "feature: dark-mode" [ref=e992]':
                - generic [ref=e993]: "feature: dark-mode"
            - 'row "Apr 12, 2026, 10:00:00 AM test-ui-enhanced-Page Viewed test-ui-enhanced-device-B page: /blog" [ref=e994] [cursor=pointer]':
              - cell "Apr 12, 2026, 10:00:00 AM" [ref=e995]
              - cell "test-ui-enhanced-Page Viewed" [ref=e996]
              - cell "test-ui-enhanced-device-B" [ref=e997]
              - 'cell "page: /blog" [ref=e998]':
                - generic [ref=e999]: "page: /blog"
            - 'row "Apr 12, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-11 duration_ms: 657, page: /pricing" [ref=e1000] [cursor=pointer]':
              - cell "Apr 12, 2026, 09:15:27 AM" [ref=e1001]
              - cell "test-ui-trends-page-viewed" [ref=e1002]
              - cell "test-ui-trends-user-11" [ref=e1003]
              - 'cell "duration_ms: 657, page: /pricing" [ref=e1004]':
                - generic [ref=e1005]: "duration_ms: 657, page: /pricing"
            - 'row "Apr 12, 2026, 08:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-4 amount: 44, currency: USD +1" [ref=e1006] [cursor=pointer]':
              - cell "Apr 12, 2026, 08:15:27 AM" [ref=e1007]
              - cell "test-ui-trends-purchase-completed" [ref=e1008]
              - cell "test-ui-trends-user-4" [ref=e1009]
              - 'cell "amount: 44, currency: USD +1" [ref=e1010]':
                - generic [ref=e1011]: "amount: 44, currency: USD +1"
            - row "Apr 12, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e1012] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1013]
              - cell "test-trends-granularity-event" [ref=e1014]
              - cell "test-trends-gran-device-1" [ref=e1015]
              - cell "—" [ref=e1016]
            - row "Apr 12, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e1017] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1018]
              - cell "test-trends-shape-event" [ref=e1019]
              - cell "test-trends-shape-device-1" [ref=e1020]
              - cell "—" [ref=e1021]
            - row "Apr 12, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e1022] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1023]
              - cell "test-trends-granularity-event" [ref=e1024]
              - cell "test-trends-gran-device-1" [ref=e1025]
              - cell "—" [ref=e1026]
            - row "Apr 12, 2026, 07:00:00 AM test-trends-shape-event test-trends-shape-device-1 —" [ref=e1027] [cursor=pointer]:
              - cell "Apr 12, 2026, 07:00:00 AM" [ref=e1028]
              - cell "test-trends-shape-event" [ref=e1029]
              - cell "test-trends-shape-device-1" [ref=e1030]
              - cell "—" [ref=e1031]
            - 'row "Apr 12, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-10 duration_ms: 534, page: /home" [ref=e1032] [cursor=pointer]':
              - cell "Apr 12, 2026, 06:15:27 AM" [ref=e1033]
              - cell "test-ui-trends-page-viewed" [ref=e1034]
              - cell "test-ui-trends-user-10" [ref=e1035]
              - 'cell "duration_ms: 534, page: /home" [ref=e1036]':
                - generic [ref=e1037]: "duration_ms: 534, page: /home"
            - 'row "Apr 12, 2026, 06:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-3 amount: 37, currency: EUR +1" [ref=e1038] [cursor=pointer]':
              - cell "Apr 12, 2026, 06:15:27 AM" [ref=e1039]
              - cell "test-ui-trends-purchase-completed" [ref=e1040]
              - cell "test-ui-trends-user-3" [ref=e1041]
              - 'cell "amount: 37, currency: EUR +1" [ref=e1042]':
                - generic [ref=e1043]: "amount: 37, currency: EUR +1"
            - 'row "Apr 12, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-2 amount: 30, currency: USD +1" [ref=e1044] [cursor=pointer]':
              - cell "Apr 12, 2026, 04:15:27 AM" [ref=e1045]
              - cell "test-ui-trends-purchase-completed" [ref=e1046]
              - cell "test-ui-trends-user-2" [ref=e1047]
              - 'cell "amount: 30, currency: USD +1" [ref=e1048]':
                - generic [ref=e1049]: "amount: 30, currency: USD +1"
            - 'row "Apr 12, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-1 amount: 23, currency: EUR +1" [ref=e1050] [cursor=pointer]':
              - cell "Apr 12, 2026, 02:15:27 AM" [ref=e1051]
              - cell "test-ui-trends-purchase-completed" [ref=e1052]
              - cell "test-ui-trends-user-1" [ref=e1053]
              - 'cell "amount: 23, currency: EUR +1" [ref=e1054]':
                - generic [ref=e1055]: "amount: 23, currency: EUR +1"
            - 'row "Apr 12, 2026, 12:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-0 amount: 16, currency: USD +1" [ref=e1056] [cursor=pointer]':
              - cell "Apr 12, 2026, 12:15:27 AM" [ref=e1057]
              - cell "test-ui-trends-purchase-completed" [ref=e1058]
              - cell "test-ui-trends-user-0" [ref=e1059]
              - 'cell "amount: 16, currency: USD +1" [ref=e1060]':
                - generic [ref=e1061]: "amount: 16, currency: USD +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1062] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1063]
              - cell "test-ui-events-Button Clicked" [ref=e1064]
              - cell "test-ui-events-user-u0" [ref=e1065]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1066]':
                - generic [ref=e1067]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1068] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1069]
              - cell "test-ui-events-Button Clicked" [ref=e1070]
              - cell "test-ui-events-user-u0" [ref=e1071]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1072]':
                - generic [ref=e1073]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 03:00:00 PM test-ui-events-Button Clicked test-ui-events-user-u0 button_label: Get Started, page: /docs +1" [ref=e1074] [cursor=pointer]':
              - cell "Apr 11, 2026, 03:00:00 PM" [ref=e1075]
              - cell "test-ui-events-Button Clicked" [ref=e1076]
              - cell "test-ui-events-user-u0" [ref=e1077]
              - 'cell "button_label: Get Started, page: /docs +1" [ref=e1078]':
                - generic [ref=e1079]: "button_label: Get Started, page: /docs +1"
            - 'row "Apr 11, 2026, 02:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-17 amount: 68, currency: EUR +1" [ref=e1080] [cursor=pointer]':
              - cell "Apr 11, 2026, 02:15:27 PM" [ref=e1081]
              - cell "test-ui-trends-purchase-completed" [ref=e1082]
              - cell "test-ui-trends-user-17" [ref=e1083]
              - 'cell "amount: 68, currency: EUR +1" [ref=e1084]':
                - generic [ref=e1085]: "amount: 68, currency: EUR +1"
            - 'row "Apr 11, 2026, 12:15:27 PM test-ui-trends-purchase-completed test-ui-trends-user-16 amount: 61, currency: USD +1" [ref=e1086] [cursor=pointer]':
              - cell "Apr 11, 2026, 12:15:27 PM" [ref=e1087]
              - cell "test-ui-trends-purchase-completed" [ref=e1088]
              - cell "test-ui-trends-user-16" [ref=e1089]
              - 'cell "amount: 61, currency: USD +1" [ref=e1090]':
                - generic [ref=e1091]: "amount: 61, currency: USD +1"
            - 'row "Apr 11, 2026, 10:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-15 amount: 54, currency: EUR +1" [ref=e1092] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:15:27 AM" [ref=e1093]
              - cell "test-ui-trends-purchase-completed" [ref=e1094]
              - cell "test-ui-trends-user-15" [ref=e1095]
              - 'cell "amount: 54, currency: EUR +1" [ref=e1096]':
                - generic [ref=e1097]: "amount: 54, currency: EUR +1"
            - 'row "Apr 11, 2026, 10:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u1 page: /home, referrer: direct +1" [ref=e1098] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:00:00 AM" [ref=e1099]
              - cell "test-ui-events-Page Viewed" [ref=e1100]
              - cell "test-ui-events-user-u1" [ref=e1101]
              - 'cell "page: /home, referrer: direct +1" [ref=e1102]':
                - generic [ref=e1103]: "page: /home, referrer: direct +1"
            - 'row "Apr 11, 2026, 10:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u1 page: /home, referrer: direct +1" [ref=e1104] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:00:00 AM" [ref=e1105]
              - cell "test-ui-events-Page Viewed" [ref=e1106]
              - cell "test-ui-events-user-u1" [ref=e1107]
              - 'cell "page: /home, referrer: direct +1" [ref=e1108]':
                - generic [ref=e1109]: "page: /home, referrer: direct +1"
            - 'row "Apr 11, 2026, 10:00:00 AM test-ui-events-Page Viewed test-ui-events-user-u1 page: /home, referrer: direct +1" [ref=e1110] [cursor=pointer]':
              - cell "Apr 11, 2026, 10:00:00 AM" [ref=e1111]
              - cell "test-ui-events-Page Viewed" [ref=e1112]
              - cell "test-ui-events-user-u1" [ref=e1113]
              - 'cell "page: /home, referrer: direct +1" [ref=e1114]':
                - generic [ref=e1115]: "page: /home, referrer: direct +1"
            - 'row "Apr 11, 2026, 09:20:00 AM test-ui-enhanced-Page Viewed test-ui-enhanced-device-A page: /pricing" [ref=e1116] [cursor=pointer]':
              - cell "Apr 11, 2026, 09:20:00 AM" [ref=e1117]
              - cell "test-ui-enhanced-Page Viewed" [ref=e1118]
              - cell "test-ui-enhanced-device-A" [ref=e1119]
              - 'cell "page: /pricing" [ref=e1120]':
                - generic [ref=e1121]: "page: /pricing"
            - 'row "Apr 11, 2026, 09:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-16 duration_ms: 674, page: /pricing" [ref=e1122] [cursor=pointer]':
              - cell "Apr 11, 2026, 09:15:27 AM" [ref=e1123]
              - cell "test-ui-trends-page-viewed" [ref=e1124]
              - cell "test-ui-trends-user-16" [ref=e1125]
              - 'cell "duration_ms: 674, page: /pricing" [ref=e1126]':
                - generic [ref=e1127]: "duration_ms: 674, page: /pricing"
            - 'row "Apr 11, 2026, 09:10:00 AM test-ui-enhanced-Button Clicked test-ui-enhanced-device-A button_label: Learn More" [ref=e1128] [cursor=pointer]':
              - cell "Apr 11, 2026, 09:10:00 AM" [ref=e1129]
              - cell "test-ui-enhanced-Button Clicked" [ref=e1130]
              - cell "test-ui-enhanced-device-A" [ref=e1131]
              - 'cell "button_label: Learn More" [ref=e1132]':
                - generic [ref=e1133]: "button_label: Learn More"
            - 'row "Apr 11, 2026, 09:00:00 AM test-ui-enhanced-Page Viewed test-ui-enhanced-device-A page: /home, referrer: google" [ref=e1134] [cursor=pointer]':
              - cell "Apr 11, 2026, 09:00:00 AM" [ref=e1135]
              - cell "test-ui-enhanced-Page Viewed" [ref=e1136]
              - cell "test-ui-enhanced-device-A" [ref=e1137]
              - 'cell "page: /home, referrer: google" [ref=e1138]':
                - generic [ref=e1139]: "page: /home, referrer: google"
            - 'row "Apr 11, 2026, 08:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-14 amount: 47, currency: USD +1" [ref=e1140] [cursor=pointer]':
              - cell "Apr 11, 2026, 08:15:27 AM" [ref=e1141]
              - cell "test-ui-trends-purchase-completed" [ref=e1142]
              - cell "test-ui-trends-user-14" [ref=e1143]
              - 'cell "amount: 47, currency: USD +1" [ref=e1144]':
                - generic [ref=e1145]: "amount: 47, currency: USD +1"
            - row "Apr 11, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e1146] [cursor=pointer]:
              - cell "Apr 11, 2026, 07:00:00 AM" [ref=e1147]
              - cell "test-trends-granularity-event" [ref=e1148]
              - cell "test-trends-gran-device-1" [ref=e1149]
              - cell "—" [ref=e1150]
            - row "Apr 11, 2026, 07:00:00 AM test-trends-granularity-event test-trends-gran-device-1 —" [ref=e1151] [cursor=pointer]:
              - cell "Apr 11, 2026, 07:00:00 AM" [ref=e1152]
              - cell "test-trends-granularity-event" [ref=e1153]
              - cell "test-trends-gran-device-1" [ref=e1154]
              - cell "—" [ref=e1155]
            - 'row "Apr 11, 2026, 06:15:27 AM test-ui-trends-page-viewed test-ui-trends-user-15 duration_ms: 551, page: /home" [ref=e1156] [cursor=pointer]':
              - cell "Apr 11, 2026, 06:15:27 AM" [ref=e1157]
              - cell "test-ui-trends-page-viewed" [ref=e1158]
              - cell "test-ui-trends-user-15" [ref=e1159]
              - 'cell "duration_ms: 551, page: /home" [ref=e1160]':
                - generic [ref=e1161]: "duration_ms: 551, page: /home"
            - 'row "Apr 11, 2026, 06:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-13 amount: 40, currency: EUR +1" [ref=e1162] [cursor=pointer]':
              - cell "Apr 11, 2026, 06:15:27 AM" [ref=e1163]
              - cell "test-ui-trends-purchase-completed" [ref=e1164]
              - cell "test-ui-trends-user-13" [ref=e1165]
              - 'cell "amount: 40, currency: EUR +1" [ref=e1166]':
                - generic [ref=e1167]: "amount: 40, currency: EUR +1"
            - 'row "Apr 11, 2026, 04:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-12 amount: 33, currency: USD +1" [ref=e1168] [cursor=pointer]':
              - cell "Apr 11, 2026, 04:15:27 AM" [ref=e1169]
              - cell "test-ui-trends-purchase-completed" [ref=e1170]
              - cell "test-ui-trends-user-12" [ref=e1171]
              - 'cell "amount: 33, currency: USD +1" [ref=e1172]':
                - generic [ref=e1173]: "amount: 33, currency: USD +1"
            - 'row "Apr 11, 2026, 02:15:27 AM test-ui-trends-purchase-completed test-ui-trends-user-11 amount: 26, currency: EUR +1" [ref=e1174] [cursor=pointer]':
              - cell "Apr 11, 2026, 02:15:27 AM" [ref=e1175]
              - cell "test-ui-trends-purchase-completed" [ref=e1176]
              - cell "test-ui-trends-user-11" [ref=e1177]
              - 'cell "amount: 26, currency: EUR +1" [ref=e1178]':
                - generic [ref=e1179]: "amount: 26, currency: EUR +1"
        - generic [ref=e1180]:
          - generic [ref=e1181]: 1–200 of 275
          - generic [ref=e1182]:
            - button "← Prev" [disabled]
            - generic [ref=e1183]: 1 / 2
            - button "Next →" [ref=e1184] [cursor=pointer]
```

# Test source

```ts
  102 |     await page.goto(BASE_URL);
  103 | 
  104 |     // The events explorer table must be present
  105 |     const table = page.getByTestId('events-table');
  106 |     await expect(table).toBeVisible({ timeout: 10_000 });
  107 | 
  108 |     // At least one row of data should exist (seeded above)
  109 |     const rows = page.getByTestId('event-row');
  110 |     await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  111 |   });
  112 | 
  113 |   test('table displays Timestamp, Event Name, User identity, and Properties preview columns', async ({
  114 |     page,
  115 |   }) => {
  116 |     await page.goto(BASE_URL);
  117 | 
  118 |     const table = page.getByTestId('events-table');
  119 |     await expect(table).toBeVisible({ timeout: 10_000 });
  120 | 
  121 |     // Column headers
  122 |     await expect(page.getByTestId('col-timestamp')).toBeVisible();
  123 |     await expect(page.getByTestId('col-event-name')).toBeVisible();
  124 |     await expect(page.getByTestId('col-identity')).toBeVisible();
  125 |     await expect(page.getByTestId('col-properties')).toBeVisible();
  126 | 
  127 |     // First row should populate all four cells
  128 |     const firstRow = page.getByTestId('event-row').first();
  129 |     await expect(firstRow.getByTestId('cell-timestamp')).toBeVisible();
  130 |     await expect(firstRow.getByTestId('cell-event-name')).toBeVisible();
  131 |     await expect(firstRow.getByTestId('cell-identity')).toBeVisible();
  132 |     await expect(firstRow.getByTestId('cell-properties')).toBeVisible();
  133 |   });
  134 | 
  135 |   test('filter by event name updates table to show only matching events', async ({ page }) => {
  136 |     await page.goto(BASE_URL);
  137 | 
  138 |     const table = page.getByTestId('events-table');
  139 |     await expect(table).toBeVisible({ timeout: 10_000 });
  140 | 
  141 |     // Select the event-name filter dropdown and pick Purchase Completed
  142 |     const filter = page.getByTestId('filter-event-name');
  143 |     await expect(filter).toBeVisible();
  144 |     await filter.selectOption(EVENT_PURCHASE);
  145 | 
  146 |     // Wait for table to update
  147 |     await expect(page.getByTestId('event-row').first()).toBeVisible({ timeout: 8_000 });
  148 | 
  149 |     // Every visible row must match the chosen event name
  150 |     const rows = page.getByTestId('event-row');
  151 |     const count = await rows.count();
  152 |     expect(count).toBeGreaterThan(0);
  153 | 
  154 |     for (let i = 0; i < count; i++) {
  155 |       const cellText = await rows.nth(i).getByTestId('cell-event-name').textContent();
  156 |       expect(cellText).toContain(EVENT_PURCHASE);
  157 |     }
  158 |   });
  159 | 
  160 |   test('filter by date range updates the table', async ({ page }) => {
  161 |     await page.goto(BASE_URL);
  162 | 
  163 |     const table = page.getByTestId('events-table');
  164 |     await expect(table).toBeVisible({ timeout: 10_000 });
  165 | 
  166 |     // Record current row count before filtering
  167 |     const allRows = page.getByTestId('event-row');
  168 |     await expect(allRows.first()).toBeVisible();
  169 |     const totalBefore = await allRows.count();
  170 | 
  171 |     // Set a narrow date range: only last 5 days
  172 |     const now = new Date();
  173 |     const startDate = new Date(now);
  174 |     startDate.setDate(startDate.getDate() - 5);
  175 | 
  176 |     const fmt = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD
  177 | 
  178 |     const startInput = page.getByTestId('filter-start-date');
  179 |     const endInput = page.getByTestId('filter-end-date');
  180 | 
  181 |     await expect(startInput).toBeVisible();
  182 |     await expect(endInput).toBeVisible();
  183 | 
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
> 202 |     expect(totalAfter).toBeLessThan(totalBefore);
      |                        ^ Error: expect(received).toBeLessThan(expected)
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
  284 |     await filter.selectOption(EVENT_NONEXISTENT);
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
```