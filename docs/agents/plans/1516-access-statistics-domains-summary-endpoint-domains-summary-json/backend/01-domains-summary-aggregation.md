# DomainsSummary aggregation

Add `backend/statistics/aggregation/domains_summary.py` with class `DomainsSummary(filters)`, following the style of `overview_totals.py` / `duration_series.py` (module docstring, tuple-index constants, small static helpers). Its `build()` returns `(domains, totals)`.

1. Rows: `list(VisitQuery(filters).rows('session__domain_id', 'session_id', 'session__user_id', 'started_at', 'last_seen_at'))`, grouped by `session__domain_id` into a dict (`None` key = unknown).
2. Reducer `_metrics(rows)` returning the six keys:
   - `visits` = `metrics.count(rows)`; `anonymous` / `logged_in` = counts of rows with `session__user_id` null / not null;
   - `unique_visitors` = `metrics.unique` of `VisitQuery.visitor_key(user_id, session_id)`;
   - `average_duration_seconds` / `median_duration_seconds` = `metrics.average` / `metrics.median` of `metrics.duration_seconds(started_at, last_seen_at)`, rounded with `round()`, `None` kept.
   - `_metrics([])` gives zero counts and `None` durations (zero-fill).
3. Domains: `Domain.objects.select_related('domain_group')`, filtered with `id=filters.domain` when `filters.domain` is an id; skipped (no query) when it equals `StatisticsFilters.UNKNOWN_DOMAIN`. One row per domain: `{'id': domain.id, 'domain': domain.domain, 'group': domain.domain_group.name, **_metrics(grouped.get(domain.id, []))}`.
4. Unknown row `{'id': 'unknown', 'domain': None, 'group': None, **_metrics(grouped.get(None, []))}` appended when `filters.domain` is `None` or `unknown`.
5. Sort the domain rows by `(-visits, domain)`, then append the unknown row last.
6. `totals = _metrics(rows)` over all rows. With a missing domain id, `VisitQuery` already matches nothing, so totals are zero and `domains` is `[]`.

Export `DomainsSummary` from `statistics/aggregation/__init__.py` (import + `__all__`, and mention it in the module docstring list).

Tests in `backend/statistics/tests/aggregation/domains_summary_test.py` (pytest, `django_db`, build `DomainGroup` / `Domain` / `Session` / `Visit` rows directly like the other aggregation tests):
- zero-filled rows for every configured domain, unknown row present and last even at zero visits;
- ordering (visits desc, domain asc for ties / zero rows);
- `domain=<id>` → single row (zero-filled if no visits); missing id → `[]` and zero totals; `domain=unknown` → unknown row only;
- `group` from `DomainGroup.name`; unknown row `domain`/`group` `None`;
- totals over all rows: a logged-in user on two domains counts on both rows but once in `totals.unique_visitors`; `totals.visits/anonymous/logged_in` equal row sums;
- totals agree with `OverviewTotals` (`visits`, `unique_visitors`, `average_duration_seconds`) and `DurationSeries` (`median_duration_seconds`) for the same filters;
- deleted `Domain` → its sessions land on unknown (SET_NULL); deleted user (session `user=None`) counts as anonymous;
- single-hit / open visits (duration `0`) included in average and median; visits started before `from` excluded;
- `audience=anonymous` → all `logged_in` `0` (and vice versa); `user` filter → `anonymous` `0`; `user` + `audience=anonymous` → zero rows.

## Files to Change
- `backend/statistics/aggregation/domains_summary.py` — new `DomainsSummary` class.
- `backend/statistics/aggregation/__init__.py` — export `DomainsSummary`.
- `backend/statistics/tests/aggregation/domains_summary_test.py` — new aggregation tests.
