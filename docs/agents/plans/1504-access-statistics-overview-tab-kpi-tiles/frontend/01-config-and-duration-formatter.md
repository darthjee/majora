# Request config and duration formatter

Register the `overview` quantity type and add the pure duration formatter the average tile needs.

- In `staffStatisticsConfig.js`, add `const overview = { path: () => '/staff/statistics/overview.json', permission: null };` and `GET.overview: { regular: overview, private: overview }`. Mention `GET.overview` (issue #1504) in the JSDoc, next to `GET.visits`.
- Create `StatisticsDurationFormatter.js` in `pages/helpers/`: a class with `static format(seconds)`. It returns `—` for `null` / `undefined`, `Xm Ys` below 3600 s (e.g. `0` → `0m 0s`, `274` → `4m 34s`) and `Xh Ym` from 3600 s (e.g. `3600` → `1h 0m`, `5430` → `1h 30m`). Seconds are dropped in the hour form. Unit-test every branch, including the 3599 / 3600 boundary.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`: add the `overview` GET entry.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatter.js` (new): duration formatter.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatterSpec.js` (new): its specs.
- Spec of `staffStatisticsConfig`, if one exists under `frontend/specs/assets/js/utils/requests/config/`: assert the new path.
