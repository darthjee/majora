# Add the visitors quantity type and controller

1. In `utils/requests/config/staffStatisticsConfig.js`, add `const visitors = { path: () => '/staff/statistics/visitors.json', permission: null };` and `GET.visitors: { regular: visitors, private: visitors }`, and mention it in the file's JSDoc next to `visits` / `overview`.
2. Create `pages/controllers/VisitorsController.js`, a copy of the `VisitsController` shape (`BasePageController`, `buildEffect` with safe setter, `RequestStore.ensure({ componentName: 'VisitorsController', resource: 'staffStatistics', quantityType: 'visitors', query: StatisticsQuery.fromHash() })`, error message `staff_statistics_page.visitors.load_error`).
3. `static map(response, locale)` returns `{ points, audienceSeries, totals, audience, granularity, empty }`:
   - `points`: buckets in order, each `{ start, end, label, unique_visitors, new_visitors, returning_visitors, anonymous, logged_in, returningShare, loggedInShare }` with `label` from `StatisticsBucketFormatter.label(start, granularity, locale)` and both shares `null` when `unique_visitors === 0`;
   - `audienceSeries`: `['anonymous', 'logged_in']` for `all` (or a missing / unknown audience), `['anonymous']` / `['logged_in']` otherwise — same table as `VisitsController` (extract it to a shared module if it avoids duplication cleanly; otherwise keep a local constant);
   - `empty`: `totals.unique_visitors === 0`.
4. Jasmine specs: `map` for empty (zero-filled) buckets, a single bucket, normal data, each audience (`all`, `anonymous`, `logged_in`, missing), shares `null` at zero; `buildEffect` success, error and late-response-after-unmount, following `VisitsControllerSpec`.

## Files to Change
- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — `visitors` quantity type.
- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/VisitorsController.js` — new controller.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/VisitorsControllerSpec.js` — new specs.
- Config spec (if one asserts the `GET` keys) — add `visitors`.
