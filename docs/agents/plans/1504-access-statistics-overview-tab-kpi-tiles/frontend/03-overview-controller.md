# Overview controller

Create `OverviewController` as a mirror of `VisitsController`: it extends `BasePageController`, its constructor takes `(setData, setLoading, setError)`, and `buildEffect()` returns a mount effect whose cleanup drops a late response. The effect calls `RequestStore.ensure({ componentName: 'OverviewController', resource: 'staffStatistics', quantityType: 'overview', query: StatisticsQuery.fromHash() })`. On error it sets `Translator.t('staff_statistics_page.overview.load_error')`; it always clears loading.

`static map(response)` returns `{ totals, returningShare, empty }`:
- `returningShare` is `returning_visitors / unique_visitors`, or `null` when `unique_visitors === 0`, so the share is hidden;
- `empty` is `totals.visits === 0`.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/OverviewController.js` (new).
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/OverviewControllerSpec.js` (new): `map` for normal data, zero visitors (`null` share) and a `null` average, plus the effect's success, error and late-response paths, following `VisitsControllerSpec.js`.
