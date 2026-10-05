# Add the VisitList aggregation

Add `VisitList(filters, sort=DEFAULT_SORT)` in `statistics/aggregation/visit_list.py`, following the plain-class, one-per-file style of the package:

- `SORT_KEYS`: maps each public sort key to its order field: `started_at` → `started_at`, `last_seen` → `last_seen_at`, `duration` → the duration annotation, `hits` → `hits`. `DEFAULT_SORT = 'started_at'`. The view passes `SORT_KEYS` to `parse_sort` as the allowed choices, the same way `UsersRanking.SORT_KEYS` is used.
- `queryset()`: `VisitQuery(filters).queryset().select_related('session__user__profile', 'session__domain')`, ordered by `-<field>` then `-id`. For `duration`, annotate with `ExpressionWrapper(F('last_seen_at') - F('started_at'), output_field=DurationField())` and order on that annotation. Annotate only when sorting by duration, or always if that is simpler (the row's `duration_seconds` is computed in Python either way).
- Returns a lazy queryset. Nothing is evaluated here, so the `Paginator` counts and slices it in SQL.

Export `VisitList` from `statistics/aggregation/__init__.py` (import and `__all__`, alphabetical) and mention it in the package docstring's list.

Tests in `statistics/tests/aggregation/visit_list_test.py`:
- every sort key orders descending;
- ties are broken by `-id` for each key (equal `started_at`, equal hits, equal duration, …);
- the default sort is `started_at`;
- the filters are applied (range, including a visit started before `from` being excluded; `user`; `domain` including `unknown`; `audience`, with a deleted user's session counted as anonymous);
- `select_related` is in place (accessing `visit.session.user.profile` and `visit.session.domain` on the results issues no extra queries).

## Files to Change
- `backend/statistics/aggregation/visit_list.py` (new): `VisitList`.
- `backend/statistics/aggregation/__init__.py`: export `VisitList`.
- `backend/statistics/tests/aggregation/visit_list_test.py` (new): tests.
