# Plan: Access statistics: Overview tab (KPI tiles)

Issue: [1504-access-statistics-overview-tab-kpi-tiles.md](../../issues/1504-access-statistics-overview-tab-kpi-tiles.md)

## Overview

Replace the placeholder on the access statistics landing tab (`/staff/statistics`) with five
linked Bootstrap KPI cards fed by `GET /staff/statistics/overview.json` (#1503). The frontend
work follows the Visits tab layering (#1507): page → body element → controller → render helper,
plus a `StatisticsKpiTile` element, a pure duration formatter and a `showGranularity` prop on the
filter bar. The page is renamed from `StaffStatistics.jsx` to `StaffStatisticsOverview.jsx`. The
translator adds the `staff_statistics_page.overview.*` strings in `en` and `pt`.

Spec: `docs/agents/specs/access-statistics/overview.md` ("Filters", "Chart and layout", "Edge
cases").

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Backend response (already merged in #1503, consumed by frontend)

`GET /staff/statistics/overview.json` → `{ filters: {...}, totals: {...} }` (no `buckets`):

| `totals` key | Type |
|--------------|------|
| `visits`, `unique_visitors`, `logged_in_users`, `new_visitors`, `returning_visitors` | non-negative integer |
| `average_duration_seconds` | non-negative integer, or `null` when there are no visits |

### i18n keys (translator produces, frontend consumes)

Namespace `staff_statistics_page`, new `overview` block in
`frontend/assets/i18n/en/staff_statistics_page.yaml` and `.../pt/staff_statistics_page.yaml`.
Interpolation uses `{{name}}`.

| Key | English text |
|-----|--------------|
| `overview.visits` | `Visits` |
| `overview.unique_visitors` | `Unique visitors` |
| `overview.logged_in_users` | `Logged-in users` |
| `overview.average_duration` | `Average visit duration` |
| `overview.new_vs_returning` | `New vs returning` |
| `overview.new_visitors` | `New: {{count}}` |
| `overview.returning_visitors` | `Returning: {{count}}` |
| `overview.returning_share` | `{{share}} returning` |
| `overview.first_visit_note` | `"New" means first visit recorded; visits before tracking started are not counted.` |
| `overview.loading` | `Loading overview...` |
| `overview.load_error` | `Unable to load the overview.` |

Numbers and the share are formatted by the frontend (`Intl.NumberFormat`, browser locale) before interpolation. The duration value (`Xm Ys` / `Xh Ym` / `—`) is not translated.
