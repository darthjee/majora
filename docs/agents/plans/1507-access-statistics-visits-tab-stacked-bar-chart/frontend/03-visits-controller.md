# VisitsController

Add `pages/controllers/VisitsController.js`, extending `BasePageController` like
`StaffUsersController`. The page-level access check already happens in
`StaffStatisticsAccessGate`, so this controller only loads data.

- Constructor setters: `setData` (an object `{ points, series, totals, granularity }`),
  `setLoading`, `setError`.
- `buildEffect()` returns the effect. It uses `buildSafeSetter` with a `mounted` flag and calls
  `RequestStore.ensure({ componentName: 'VisitsController', resource: 'staffStatistics', quantityType: 'visits', query: StatisticsQuery.fromHash() })`.
  On success it sets the mapped data; on failure it sets
  `Translator.t('staff_statistics_page.visits.load_error')`; finally it clears loading. Check how
  the `domains` read in `StaffStatisticsFiltersController` unwraps the result (plain JSON vs
  `{ data }`) and follow it.
- Static, pure `VisitsController.map(response, locale)` (unit-tested without RequestStore):
  - `points`: `buckets` in order, each
    `{ start, end, label: StatisticsBucketFormatter.label(start, filters.granularity, locale), anonymous, logged_in, visits, loggedInShare }`,
    with `loggedInShare = visits === 0 ? null : logged_in / visits`;
  - `series` from `filters.audience`: `['anonymous', 'logged_in']` for `all` (or missing),
    `['anonymous']` for `anonymous`, `['logged_in']` for `logged_in`;
  - `totals` (passed through), `audience`, and `granularity` (the resolved
    `filters.granularity`, for the shell's `resolvedGranularity`);
  - `empty`: `totals.visits === 0`.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/VisitsController.js`
  — new controller.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/VisitsControllerSpec.js`
  — `map` with empty buckets, a single bucket, normal data with a zero bucket (`loggedInShare`
  `null`), and each audience (`all`, `anonymous`, `logged_in`). `buildEffect` with a spied
  `RequestStore.ensure` (resolve → setters called with mapped data and loading cleared; reject →
  error set; no setter calls after the cleanup runs) and fake setters. Assert the request
  arguments (`resource`, `quantityType`, `query`).
