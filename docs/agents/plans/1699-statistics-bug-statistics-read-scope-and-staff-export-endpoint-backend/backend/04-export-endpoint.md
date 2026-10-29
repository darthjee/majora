# Export endpoint

Add `staff_statistics_export` at `GET staff/statistics/export.json`, following the other
`staff_statistics_*` views:

- `@restricted`, `@api_view(['GET'])`, `@permission_classes([AllowAny])`,
  `@token_scopes(GET=['statistics:read'])`; `require_staff` first, on every request.
- Params validated before any query: `from` / `to` (bounded by `MAJORA_STATISTICS_MAX_RANGE_DAYS`,
  `from > to` is a `400`), optional `domain` (an existing `Domain` id or `unknown`), `page` /
  `per_page` (default `MAJORA_PAGINATION_SIZE`, above `100` is a `400`). Reuse
  `StatisticsParamsParser` / `parse_statistics_filters` where they fit.
- Sessions in range, ordered by `created_at`, then `id`, paginated with `paginated_list_response`.
- Visits loaded in one batch for the page's sessions (no N+1), only those with `started_at` in
  range, at most **100 per session**, with `visits_truncated: true` when cut off.
- Serializer fields: sessions `id`, `ip`, `domain`, `user_id`, `created_at`, `last_seen_at`,
  `visits`, `visits_truncated`; visits `started_at`, `last_seen_at`, `hits`. Never `token`, user
  e-mail, name or profile.

Tests: every row of the spec's access matrix (anonymous, invalid token, non-staff, staff browser,
token without the scope, token with the scope and a non-staff / demoted owner — invalidating
`AdminOrStaffCache` — and token with the scope and a staff owner); payload fields and absence of
`token`; visits range, cap and `visits_truncated`; pagination headers, `per_page` cap, range bound,
`from > to`, `domain` filter; query count independent of page size.

## Files to Change

- `backend/staff/views/staff_statistics_export.py` — new view.
- `backend/staff/views/__init__.py` — export the view.
- `backend/staff/urls.py` — route `staff/statistics/export.json`.
- `backend/staff/serializers/` — export session and visit serializers (and `__init__` export).
- `backend/statistics/aggregation/` — export query (sessions + batched visits), if it does not fit
  the view cleanly.
- `backend/staff/tests/` — view, serializer and query tests.
