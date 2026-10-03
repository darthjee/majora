# Write the Domains spec page

Replace every "_To define (#1487)_" placeholder in
`docs/agents/specs/access-statistics/domains.md` and set the status line to `specced`,
following the section order and wording style of `visits.md` / `duration.md` / `overview.md`.

- **Decided:** list the discussion decisions (see the issue's "Decisions from discussion").
- **Metrics:** the matched-visits sentence shared by the siblings; then the per-row and
  `totals` keys, with definitions and empty values:
  - `visits`, `anonymous`, `logged_in` (`metrics.count`, partitioned on
    `session__user_id`), `0` when empty;
  - `unique_visitors` (`metrics.unique` of `VisitQuery.visitor_key`), `0`;
  - `average_duration_seconds`, `median_duration_seconds` (`metrics.average` /
    `metrics.median` of `last_seen_at − started_at` in whole seconds, rounded to the nearest
    integer, exactly as Duration / Overview), `null` when empty.
  - Row identity: `id` (`Domain.id`, or `"unknown"`), `domain` (hostname, or `null` for
    unknown), `group` (`DomainGroup.name`, or `null` for unknown).
  - `totals` is computed over **all** matched visits (equals Overview's `visits`,
    `unique_visitors` and `average_duration_seconds` for the same filters); note that the
    per-row `unique_visitors` may sum to more than the total.
  - Order: `visits` descending, then `domain` ascending; "unknown" always last.
- **Filters:** date range, `user`, `domain`, `audience` apply. Granularity is accepted,
  echoed and ignored, and the filter bar hides it (`showGranularity={false}`), as on
  Overview. Document what each `domain` value yields (any → every configured domain plus
  "unknown"; `<id>` → that row only; `unknown` → only the unknown row; a well-formed id
  with no `Domain` row → an empty `domains` list and zero totals).
- **Chart and layout:** totals line; a horizontal Recharts `BarChart`
  (`layout="vertical"`, category `YAxis` on the domain label, numeric `XAxis` with integer
  ticks) with two stacked `Bar`s (`anonymous` `var(--majora-chart-1)`, `logged_in`
  `var(--majora-chart-2)`), hiding the series filtered out by `audience` like Visits; chart
  height grows with the row count (e.g. a per-row height with a minimum), wrapped in
  `data-testid="statistics-domains-chart"`; tooltip (domain, group, the counts, logged-in
  share); a table under it (Domain, Group, Visits, Anonymous, Logged-in, Unique visitors,
  Avg duration, Median duration) with client-side column sorting (default: the API order,
  "unknown" pinned last) and rows that navigate to Overview with
  `statisticsHref('/staff/statistics', { ...filters, domain: id })`; states (loading,
  error, empty: `totals.visits == 0`, still listing the zero rows with a note); layering
  (`pages/StaffStatisticsDomains.jsx`, `pages/controllers/DomainsController.js`,
  `charts/DomainsChart.jsx`, `charts/helpers/DomainsChartHelper.jsx`) and the reuse of
  Overview's duration formatter; i18n keys under `domains.*` in `staff_statistics_page`
  (including the "unknown" label).
- **API:** `GET /staff/statistics/domains/summary.json` with the standard decorator stack,
  view / URL name / test file names, access-control row, frontend quantity type
  (`domainsSummary`, path `/staff/statistics/domains/summary.json`); a JSON example with the
  `filters` echo, the `domains` list (including a zero row and the unknown row) and
  `totals`; a key / type table; the query: one
  `VisitQuery(filters).rows('session__domain_id', 'session_id', 'session__user_id',
  'started_at', 'last_seen_at')` pass grouped by domain id in Python, plus one `Domain`
  query (`select_related('domain_group')`, filtered to the `domain` filter's id when set)
  to build zero-filled rows; logic in `statistics/aggregation/domains_summary.py`
  (`DomainsSummary(filters)` returning `(domains, totals)`), tested in
  `statistics/tests/aggregation/`.
- **Edge cases:** the unknown row (null domain; shown even with zero visits when no domain
  filter is set); a deleted `Domain` (its sessions become `domain = NULL`, check the FK's
  `on_delete` and document the resulting behaviour); visitors on several domains; deleted
  users counted as anonymous; open visits; visits started before `from`; login as a visit
  boundary; proxy-cached requests; no backfill.
- **Open questions:** list the deferred items (time series per domain, a `DomainGroup`
  rollup, comparison with the previous period).

## Files to Change
- `docs/agents/specs/access-statistics/domains.md` — fill every section, status `specced`.
