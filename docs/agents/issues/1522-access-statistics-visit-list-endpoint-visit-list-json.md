# Issue: Access statistics: Visit list endpoint (visit-list.json)

## Description

Backend endpoint for the access statistics **Visit list** tab (#1477). Spec: `docs/agents/specs/access-statistics/visit-list.md` (specced in #1489), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec sections listed below. Read them in the spec; they are not copied here.

## Dependencies

Both dependencies have landed:

- #1498 (shared backend): `StatisticsParamsParser` / `parse_statistics_filters` (strict `page` / `per_page` validation already included) and `VisitQuery`.
- #1519 (Users ranking): the shared `sort` validation helper `parse_sort(request, choices, default)` in `backend/staff/views/_staff_statistics_shared.py`. This endpoint reuses it as-is and does not add a second copy.

## Solution

- **API** ("API"): `GET /staff/statistics/visit-list.json`. View `staff_statistics_visit_list` in `backend/staff/views/staff_statistics_visit_list.py`, URL name `staff-statistics-visit-list`, tests in `backend/staff/tests/staff_statistics_visit_list_test.py`. Uses the shared decorator stack (`@restricted`, `@api_view(['GET'])`, `AllowAny`, inline `require_staff` first). Params are checked with `parse_sort(request, VisitList.SORT_KEYS, VisitList.DEFAULT_SORT)`, and its errors are merged into `parse_statistics_filters(request, sort_errors)`, as in `staff_statistics_users.py`. The response is a plain JSON array of visit rows with the shared `page` / `pages` / `per_page` / `total` headers, built by `paginated_list_response(request, queryset, serializer_cls, context={'now': ...})`. No envelope, no totals.
- **Metrics** ("Metrics"): one row per matched `Visit`:
  - `id`, `started_at` and `last_seen_at` (ISO 8601 UTC), `duration_seconds` (truncated, `0` for a single hit) and `hits`.
  - `ongoing`: `now − last_seen_at < Settings.visit_inactivity_seconds()`, with `now` read once per request.
  - `ip` (`Session.ip`) and `session_id`.
  - `domain`: `{ "id", "domain" }`, or `{ "id": "unknown", "domain": null }` for null domains.
  - `user`: `{ id, name, display_name, email }` (`display_name` is `null` when blank or when there is no profile), or `null` for anonymous visits.
  - `Session.token` is never serialized.
- **User identity (shared)**: move the identity logic, now private to `_UserIdentities._identity` / `_display_name` in `staff_statistics_users.py`, into one shared serializer, e.g. `StatisticsUserIdentitySerializer` in `backend/staff/serializers/`. It returns `{id, name, display_name, email}`, with `display_name` `null` when blank or when there is no profile. `users.json` (via `_UserIdentities`) and the visit-row serializer both use it. `users.json` keeps its exact response, and its existing tests still pass. `StaffUserListSerializer` is not reused: it adds `status` and does not null a blank `display_name`.
- **Ordering** ("Ordering"): `sort` is one of `started_at` (default), `last_seen`, `duration` or `hits`. Rows are always descending, with ties broken by visit id descending. Ordering and slicing happen in the database (`duration` orders on an `F('last_seen_at') - F('started_at')` annotation). Any other value, including an empty `sort=`, returns `400` with `{"errors": {"sort": ["invalid_sort"]}}`, reported together with the shared errors.
- **Filters** ("Filters"): the date range, `user`, `domain` and `audience` filters keep their shared semantics and apply to the visit's session. `granularity` is accepted and validated, then ignored.
- **Queryset**: `statistics/aggregation/visit_list.py` holds `VisitList(filters, sort)`, with `SORT_KEYS` / `DEFAULT_SORT`, exported from `statistics.aggregation`. It builds `VisitQuery(filters).queryset()` with `select_related('session__user__profile', 'session__domain')` (no N+1) and the ordering. It is tested in `statistics/tests/aggregation/`.
- **Serializer**: a staff statistics visit-row serializer that reads `now` from the context.
- **Edge cases** ("Edge cases"): deleted users count as anonymous; visits that started before `from` are excluded; open (ongoing) visits are included; single-hit visits; login is a visit boundary; a page past the last one returns an empty list with the headers.
- **Access control**: add the `visit-list.json` row to `docs/agents/access-control/staff-statistics.md` and update its status note. The row says the endpoint exposes raw IPs, statistics session ids (new: other tabs only expose user ids) and user identities to staff, and never the session token.

## Out of scope

The Visit list tab UI (#1523), IP or session filters, ascending sort, CSV export, user agent columns and a chart (all deferred).

## Acceptance criteria

- [ ] `visit-list.json` returns the spec's row keys, types and pagination headers. Tests cover: 401 for anonymous callers, 403 for non-staff, 200 for staff, `X-Skip-Cache`, and 400 on invalid params (including `invalid_sort`, reported with the shared errors).
- [ ] Every `sort` key orders rows descending with the visit-id-descending tie-break, stays stable across pages and is sliced in SQL. A fixed number of queries per page (no N+1).
- [ ] `ongoing`, anonymous rows (`user: null`, deleted users included) and the unknown domain entry match the spec. The session token never appears in the response.
- [ ] The `audience`, `user` and `domain` filters return the rows listed in the spec.
- [ ] The user identity logic lives in one shared helper used by both `users.json` and `visit-list.json`. The `users.json` response is unchanged.
- [ ] The endpoint is not added to the Navi warm-up chain, and `staff-statistics.md` is updated.
- [ ] The `data-access`, `security` and `cache` reviews pass.
