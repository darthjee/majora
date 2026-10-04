# KPI tile element and render helper

**`StatisticsKpiTile`** (`elements/StatisticsKpiTile.jsx`) is a presentational Bootstrap card wrapped in a `Col xs={12} sm={6} lg={4}`. Props: `label`, `value` (an already formatted string), `href` (a hash path), optional `children` for secondary lines, and `testId`. The whole card is clickable through a stretched link: `<a className="stretched-link" href={href}>` inside a `card position-relative h-100`, with the label as a muted title and the value as a large number.

**`StaffStatisticsOverviewHelper`** (`pages/helpers/StaffStatisticsOverviewHelper.jsx`) mirrors `StaffStatisticsVisitsHelper`:
- `renderState({ data, loading, error })`: `LoadingMessage` with `overview.loading`, `ErrorAlert` on error, or `render(data, filters)`.
- `render(data, filters)`: a `<section data-testid="statistics-overview">` holding a `Row` of five tiles, in spec order. Each `href` is `#${statisticsHref(path, filters)}`, with `path` from `StatisticsTabs` (visits, visitors, users, duration, visitors), the same way `StaffStatisticsTabs` builds its links.
  - Counts use `StatisticsBucketFormatter.count`.
  - The average uses `StatisticsDurationFormatter.format`.
  - The new vs returning tile shows `overview.new_visitors` and `overview.returning_visitors` lines, the `overview.returning_share` line (via `StatisticsBucketFormatter.percent`) only when `returningShare !== null`, and always the small muted `overview.first_visit_note`. Its main value can be `new / returning` counts.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StatisticsKpiTile.jsx` (new).
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsOverviewHelper.jsx` (new).
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StatisticsKpiTileSpec.js` (new): markup, link and children.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsOverviewHelperSpec.js` (new): loading, error, normal data (five tiles in order, hrefs carry the filters without `page`), `null` average shown as `—`, share hidden at zero visitors, note present.
