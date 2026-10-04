# Generalize the chart series helper

`charts/helpers/visitsSeries.js` hardcodes the anonymous / logged-in definitions and the `staff_statistics_page.visits.` label prefix. Replace it with a shared helper, e.g. `charts/helpers/chartSeries.js`, exporting a function `chartSeries(definitions, keys, labelPrefix)` that filters `definitions` (`[{ key, color }]`, already in stack order, bottom first) to the visible `keys` and adds the translated `label` (`Translator.t(\`${labelPrefix}.${key}\`)`) on every call.

Export the definition lists as named constants so they are shared:
- `AUDIENCE_SERIES`: `anonymous` (`var(--majora-chart-1)`), `logged_in` (`var(--majora-chart-2)`) — used by Visits and the Visitors audience chart;
- `NEW_RETURNING_SERIES`: `new_visitors` (`var(--majora-chart-3)`), `returning_visitors` (`var(--majora-chart-4)`) — used by the Visitors new vs returning chart. Their labels map to `visitors.new` / `visitors.returning`, so either let a definition carry an explicit `labelKey` (`new`, `returning`) or name the keys accordingly; pick one and document it in the JSDoc.

Update `VisitsChartHelper` and `VisitsChartTooltipHelper` to call `chartSeries(AUDIENCE_SERIES, series, 'staff_statistics_page.visits')`; delete `visitsSeries.js` and move / rewrite its spec for the new helper (stack order whatever the key order, filtering, label translation, explicit `labelKey`). Visits output must be identical.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/chartSeries.js` — new shared helper and series constants.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/visitsSeries.js` — removed.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/VisitsChartHelper.jsx` — use `chartSeries`.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/VisitsChartTooltipHelper.jsx` — use `chartSeries`.
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/helpers/visitsSeriesSpec.js` → `frontend/specs/assets/js/components/resources/staff_statistics/charts/helpers/chartSeriesSpec.js` — specs for the shared helper.
