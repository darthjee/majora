# Add the visit row serializer

Add a staff serializer for one `Visit` row, e.g. `StaffStatisticsVisitSerializer`, that reads `now` from `self.context['now']`. Output keys, in the spec's order:

- `id`;
- `started_at` and `last_seen_at`, as ISO 8601 UTC with a `Z` suffix (`%Y-%m-%dT%H:%M:%SZ`, like `users.json`'s `last_seen_at`). Do not rely on DRF's `DateTimeField` rendering, which depends on the active time zone. The `_iso_utc` helper is private to `users_ranking.py`; consider moving it to `statistics.aggregation.metrics` (e.g. `metrics.iso_utc`) and using it from both places, rather than copying it;
- `duration_seconds`: `metrics.duration_seconds(started_at, last_seen_at)` (truncated whole seconds, `0` for a single hit);
- `hits`;
- `ongoing`: `now - last_seen_at < timedelta(seconds=Settings.visit_inactivity_seconds())` (`statistics.settings.Settings`);
- `ip`: `session.ip`;
- `domain`: `{"id": domain.id, "domain": domain.domain}`, or `{"id": StatisticsFilters.UNKNOWN_DOMAIN, "domain": None}` when `session.domain` is null;
- `session_id`: `session.id`;
- `user`: the step-01 `StatisticsUserIdentitySerializer(session.user).data`, or `None` when `session.user` is null.

Never include `session.token` (use an explicit field list, not `__all__`).

Unit tests: every key and type; `ongoing` true just inside the inactivity window and false at or beyond it (a fixed `now` in the context); the unknown domain entry; `user: None`; a single-hit visit with duration `0`; `token` absent.

## Files to Change
- `backend/staff/serializers/staff_statistics_visit.py` (new): the row serializer.
- `backend/staff/serializers/__init__.py`: export it.
- `backend/statistics/aggregation/metrics.py` and `backend/statistics/aggregation/users_ranking.py`: optional shared `iso_utc` helper (keep `users_ranking_test.py` passing).
- `backend/staff/tests/serializers/staff_statistics_visit_test.py` (new, same location rule as step 01): tests.
