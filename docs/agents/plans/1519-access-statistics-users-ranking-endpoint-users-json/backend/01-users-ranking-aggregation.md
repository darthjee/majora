# UsersRanking aggregation

Add `backend/statistics/aggregation/users_ranking.py` with `UsersRanking(filters, sort)`, export it
from `statistics/aggregation/__init__.py` (import and `__all__`, plus a mention in the module
docstring), and test it in `backend/statistics/tests/aggregation/users_ranking_test.py`.

## Behaviour
- `SORT_KEYS` constant and `DEFAULT_SORT = 'visits'`. `SORT_KEYS` maps each sort key to its row
  field: `visits` → `visits`, `time_on_site` → `time_on_site_seconds`, `average_duration` →
  `average_duration_seconds`, `hits` → `hits`, `last_seen` → `last_seen_at`. The view uses the
  keys to validate `sort`.
- One query: `VisitQuery(filters).queryset().filter(session__user__isnull=False).values_list(
  'session__user_id', 'session__domain_id', 'session__domain__domain', 'started_at',
  'last_seen_at', 'hits')`.
  - `audience=anonymous` already makes this empty (its lookup is `session__user__isnull=True`), so
    no special-casing is needed beyond not querying `User` later.
  - Deleted users never appear, because their sessions have `user = NULL`.
- Group the rows by user id in Python. Reduce each group to:
  - `visits`: `metrics.count`.
  - `time_on_site_seconds`: the sum of `metrics.duration_seconds`.
  - `average_duration_seconds`: `round(metrics.average(durations))`, an int.
  - `hits`: the sum.
  - `last_seen_at`: the max `last_seen_at`, serialized as ISO 8601 UTC with a `Z` suffix (e.g.
    `astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')`).
  - `domains`: one entry per distinct domain id as `{'id': <int>, 'domain': <hostname>}`, sorted
    by hostname, with `{'id': 'unknown', 'domain': None}` last when any session has no domain.
  - Keep `id` (user id) on each row. Identities are added by the view, not here.
- Sort descending on the chosen key, with ties broken by user id ascending. Sort on the raw
  datetime before formatting `last_seen_at`, or on an ISO string with a fixed format, which sorts
  the same way. Two stable sorts work: first by id ascending, then by key with `reverse=True`.
- Return a small sequence wrapper, e.g. `UsersRanking.Rows` or a private `_RankedRows` class.
  It holds the sorted list and exposes a no-arg `count()`, `__getitem__` (slices) and `__len__`,
  so `games.paginator.Paginator` can use it unchanged. Expose this as `build()` (or `rows()`),
  consistent with `DurationSeries.build()`.

## Tests (in `statistics/tests/aggregation/users_ranking_test.py`)
- Metric values for a user with several visits, including an open or single-hit visit (duration
  `0`).
- A user on several domains and devices gets one row, with domains in hostname order and
  `unknown` last.
- The `domain` filter keeps only that domain's visits and domains.
- Anonymous sessions are excluded, `audience=anonymous` gives an empty result, and
  `user=<id>` gives at most one row.
- Visits started before `from` are excluded.
- Each sort key orders descending, and ties are broken by id ascending.
- The wrapper's `count()` and slicing work.

## Files to Change
- `backend/statistics/aggregation/users_ranking.py` — new `UsersRanking` class and sequence wrapper.
- `backend/statistics/aggregation/__init__.py` — export `UsersRanking`.
- `backend/statistics/tests/aggregation/users_ranking_test.py` — new tests.
