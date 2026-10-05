# Issue: Access statistics: Users tab (ranking table)

## Description
Frontend of the access statistics **Users** tab (#1477): a paginated, server-sorted ranking table of logged-in users. The full behavior is in the spec `docs/agents/specs/access-statistics/users.md` (specced in #1488), which builds on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the sections listed below. Read the details in the spec; they are not copied here.

Dependencies: #1499 (frontend shell) and #1519 (Users endpoint), both done. #1500 (Recharts) is not needed because the tab has no chart.

## Problem
`/staff/statistics/users` still renders the shell placeholder (`StaffStatisticsPlaceholder`). Staff cannot see which logged-in users visit most, how long they stay or when they were last seen, even though `GET /staff/statistics/users.json` already serves that data.

## Expected Behavior
- **Table** (spec "Chart and layout"): Bootstrap `Table` (`hover`, `responsive`) with User (name, plus `display_name` / email as secondary text and a small profile link to `#/staff/users/<id>`), Visits, Time on site, Avg duration, Hits, Domains and Last seen. Numbers use `Intl.NumberFormat` and dates `Intl.DateTimeFormat`. Durations reuse `StatisticsDurationFormatter` (`—` for `null`).
- **Sortable headers** set `?sort=<key>` (the default `visits` drops the param) and reset to page 1. The active column carries `aria-sort="descending"`. There is no ascending toggle.
- **Row click** opens Overview with `?user=<id>` through `statisticsHref`, keeping the other filters. Rows are keyboard-accessible links. The profile link stops propagation, so it does not trigger the row click.
- **Pagination**: the shared `Pagination` component with `basePath="#/staff/statistics/users"` and `extraParams` holding the current filters plus `sort`.
- **States**: loading, error, empty on page 1 (note, no table), and past the last page (note plus pagination).
- **Filters** (spec "Filters"): the granularity control is hidden (`showGranularity={false}`). `sort` is not added to `FILTER_KEYS` and is not carried across tabs. A filter or sort change goes back to page 1.

## Solution
Follow the layering the Domains tab (#1517) already uses:

- `pages/StaffStatisticsUsers.jsx`: route `staffStatisticsUsers`. It replaces the placeholder and wraps a body in `StaffStatisticsAccessGate`.
- `pages/elements/StaffStatisticsUsersBody.jsx`: the shell with `tab="users"` and `showGranularity={false}`, which runs the controller. State rendering goes in `pages/helpers/StaffStatisticsUsersHelper.jsx`.
- `pages/controllers/UsersController.js`: a RequestStore read of a new `usersRanking` quantity type in `staffStatisticsConfig.js` (`/staff/statistics/users.json`). It queries with `{ ...StatisticsQuery.fromHash(), sort, ...getPaginationParams() }` (as `StaffUsersController.js` does), reads `{ data, pagination }`, and maps rows to `{ id, name, displayName, email, visits, timeOnSiteSeconds, averageDurationSeconds, hits, domains, lastSeenAt }` plus the pagination and the active `sort`.
- `pages/elements/StatisticsUsersTable.jsx`: the table, sortable headers, row navigation and profile link.
- `pages/helpers/usersSort.js`: pure helpers that read and validate `sort` from the hash (an invalid value falls back to the default) and build a header href.
- Jasmine specs for the controller, the sort helpers, the table and the page.
- **Translations**: `users.*` keys in `staff_statistics_page` (en + pt), as listed in the spec.

**Out of scope:** the endpoint (#1519), a chart, previous-period comparison, CSV export and ascending sort (all deferred).

**Acceptance criteria**
- [ ] The Users tab renders the spec's columns, sortable headers, row click, profile link (which does not trigger the row click) and pagination.
- [ ] Sort and filter changes reset to page 1. Page links keep filters and `sort`. `sort` is not carried across tabs.
- [ ] The controller and sort helpers are unit-tested, and the i18n keys exist in en and pt.
