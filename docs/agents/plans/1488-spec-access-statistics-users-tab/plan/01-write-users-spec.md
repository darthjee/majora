# Write the Users tab spec page

Rewrite `docs/agents/specs/access-statistics/users.md` from stub to `specced`, mirroring the
structure and depth of `domains.md`:

- **Header:** status `specced`, owner #1488, route, back-link to the hub.
- **Purpose** and **Decided:** the decisions from the issue (rows, no cap, server sort,
  row click + profile link, paginated response, no chart, hidden granularity).
- **Metrics:** a table of row keys and definitions over the matched visits (shared filters,
  `Visit.started_at` in the half-open UTC range), grouped by `session__user_id`:
  `visits` (`metrics.count`), `time_on_site_seconds` (sum of durations),
  `average_duration_seconds` (`metrics.average`, rounded), `hits` (sum of `Visit.hits`),
  `domains` (sorted list of hostnames, `"unknown"` for null domains; decide the exact shape,
  e.g. `[{ "id", "domain" }]`), `last_seen_at` (max `Visit.last_seen_at`, ISO 8601 UTC).
  Identity keys: `id`, `name` (username), `display_name`, `email`, read from `User` in a
  single extra query.
- **Ordering:** the `sort` param (allowed keys, default `visits`, descending, ties by user
  id), validation (`400`, `{"errors": {"sort": ["invalid_sort"]}}`), reported together
  with the shared errors.
- **Filters:** date range, `user`, `domain`, `audience` with shared semantics; granularity
  accepted, validated, ignored, control hidden (`showGranularity={false}`);
  `audience=anonymous` → empty list; `user=<id>` → at most one row; unknown user id → empty
  list. `sort`, `page` and `per_page` are not carried across tabs, and a filter or sort
  change resets to page 1.
- **Chart and layout:** table only (Bootstrap `Table`, `hover`, `responsive`), columns and
  formatters (Overview's duration formatter, `Intl.NumberFormat`, `Intl.DateTimeFormat` for
  last seen in the browser zone), clickable headers setting `?sort=`, the shared
  `Pagination` component, row click via
  `statisticsHref('/staff/statistics', { ...filters, user: row.id })`, a profile link to
  `#/staff/users/<id>` that does not trigger the row click, loading / error / empty states,
  layering (page, controller, table element, quantity type `usersRanking` or similar in
  `staffStatisticsConfig.js` using `fetchIndex` / `getPaginationParams()`), and i18n keys
  under `users.*` in `staff_statistics_page`.
- **API:** `GET /staff/statistics/users.json`, view / URL name / test file names following
  the Domains pattern, `@restricted`, `require_staff`, shared params + `sort` + `page` /
  `per_page`, `paginated_list_response`, not warmed by Navi, access-control row, an example
  response with headers, a type table, and the query plan (one `VisitQuery.rows(...)` pass
  filtered to logged-in sessions plus the domain hostnames, grouped in Python by a
  `UsersRanking(filters, sort)` aggregation class in `statistics/aggregation/`, sorted,
  sliced by the paginator; one `User` query for the page's ids).
- **Edge cases:** deleted users (counted as anonymous, so never listed), users on several
  domains or devices, open visits, visits starting before `from`, login as a visit
  boundary, proxy caching, no backfill, a page past the last one, and staff traffic being
  counted.
- **Open questions:** deferred items only (a chart, comparison with the previous period,
  CSV export, sorting ascending).
- **Implementation sub-issues:** filled in by step 03.

## Files to Change

- `docs/agents/specs/access-statistics/users.md` — full spec content
