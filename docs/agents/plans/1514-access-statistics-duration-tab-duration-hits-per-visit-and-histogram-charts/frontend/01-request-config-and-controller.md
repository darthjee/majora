# Request config and controller
Add the `duration` quantity type, and a controller that loads it and maps the response to chart-ready data.

**Request config.** In `staffStatisticsConfig.js`, add the following and extend the JSDoc paragraph with a `GET.duration` sentence (issue #1514):

```js
const duration = { path: () => '/staff/statistics/duration.json', permission: null };
// ...
duration: { regular: duration, private: duration },
```

**Bin keys.** Add `pages/helpers/durationBins.js`, exporting `DURATION_BIN_KEYS`, an object mapping `lower` to `labelKey` (see plan.md), and a `durationBinKey(lower)` function.

**Controller.** Add `pages/controllers/DurationController.js`, a copy of the `VisitorsController` shape (`BasePageController`, constructor `(setData, setLoading, setError)`, `buildEffect()` with a mount guard and `RequestStore.ensure({ componentName: 'DurationController', resource: 'staffStatistics', quantityType: 'duration', query: StatisticsQuery.fromHash() })`). On error it sets `Translator.t('staff_statistics_page.duration.load_error')`.

`static map(response, locale)` returns:
- `points`: the buckets in order. Each is `{ start, end, label: StatisticsBucketFormatter.label(start, granularity, locale), visits, single_hit_visits, singleHitShare, average_duration_seconds, median_duration_seconds, average_hits, median_hits }`, where `singleHitShare = visits === 0 ? null : single_hit_visits / visits`.
- `bins`: the histogram as `{ lower, upper, labelKey: durationBinKey(lower), count, share }`, where `share = totals.visits === 0 ? null : count / totals.visits`.
- `totals`: `{ ...totals, singleHitShare }`.
- `granularity`: `filters.granularity`.
- `empty`: `totals.visits === 0`.

**Specs.** Cover empty data (every metric `null`, `empty: true`, all shares `null`), a single bucket, normal data, `null` metrics within non-empty data, the bin key mapping for all 8 bins, and the fetch success, error and unmount paths with fake setters, following `VisitorsControllerSpec`. Add a `duration` case to `resourceConfigStaffStatisticsSpec.js`.

## Files to Change
- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`: `duration` quantity type and doc.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/durationBins.js`: new, bin `lower` → `labelKey`.
- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/DurationController.js`: new.
- `frontend/specs/assets/js/utils/requests/resourceConfigStaffStatisticsSpec.js`: `duration` case.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/durationBinsSpec.js`: new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/DurationControllerSpec.js`: new.
