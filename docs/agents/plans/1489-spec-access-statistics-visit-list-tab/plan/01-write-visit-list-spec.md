# Write the Visit list spec page

Rewrite `docs/agents/specs/access-statistics/visit-list.md` from stub to `specced`,
mirroring the section layout and depth of `users.md`:

- **Header:** status `specced`, owner #1489, route `/staff/statistics/visit-list`.
- **Purpose / Decided:** summarize the issue decisions (rows, columns, anonymous display,
  sort, links, filters, response, no chart, backend + frontend pair).
- **Metrics** (row definition): filter semantics (`started_at` in the half-open UTC range,
  plus `user` / `domain` / `audience` on the session). A key table: `id` (visit id),
  `started_at`, `last_seen_at` (ISO 8601 UTC `Z`), `duration_seconds`
  (`last_seen_at − started_at`, whole seconds), `hits`, `ongoing` (bool), `ip`,
  `domain` (`{ id, domain }`, with the `{ "id": "unknown", "domain": null }` entry),
  `session_id`, and `user` (`{ id, name, display_name, email }` as in `users.md`, or `null`
  for anonymous). Define `ongoing` as `now − last_seen_at < Settings.visit_inactivity_seconds()`.
- **Ordering** subsection: `sort` values `started_at` (default), `last_seen`, `duration`,
  `hits`; always descending; ties by visit id descending; validation and error shape as in
  `users.md` (`{"errors": {"sort": ["invalid_sort"]}}`, reported together with shared
  errors; empty `sort=` invalid). Note that `started_at` / `last_seen` / `hits` sort in the
  DB (`order_by`), `duration` via an `F('last_seen_at') - F('started_at')` annotation, so
  pagination slices in SQL (unlike Users, which sorts in Python).
- **Filters:** shared filters apply; `audience=anonymous` / `logged_in` restrict rows;
  granularity hidden (`showGranularity={false}`), accepted and ignored; `sort`, `page`,
  `per_page` are tab-specific and not carried; filter/sort changes reset to page 1.
- **Chart and layout:** table columns (User, IP, Domain, Start, Last seen, Duration, Hits,
  plus an "ongoing" badge), formatters (Intl date/time in browser zone, Overview duration
  formatter, `Intl.NumberFormat`), sortable headers with `aria-sort="descending"`, user cell
  link to Overview with `?user=<id>` plus small profile link (`#/staff/users/<id>`), no row
  click; "Anonymous · #<session_id>" for anonymous rows; IP shown as recorded (best effort
  until #1501). Pagination with the shared `Pagination` component, `basePath` and
  `extraParams` (filters + `sort`). States: loading, error, empty, page past the last one.
  Layering: `pages/StaffStatisticsVisitList.jsx`, `pages/controllers/VisitListController.js`
  (quantity type `visitList`), `pages/elements/StatisticsVisitListTable.jsx`, sort helper
  (reuse / generalize Users' `usersSort.js` if practical, else `visitListSort.js`).
  i18n keys under `staff_statistics_page.visit_list.*` (en + pt).
- **API:** `GET /staff/statistics/visit-list.json`, view
  `backend/staff/views/staff_statistics_visit_list.py` (`staff_statistics_visit_list`), URL
  name `staff-statistics-visit-list`, tests file; decorators and `require_staff` per shared
  conventions; `parse_statistics_filters` + strict `page` / `per_page` + `sort`; paginated
  through `paginated_list_response` (DB-sliced queryset with
  `select_related('session__user__profile', 'session__domain')`) with a serializer, or the
  `Paginator` directly if serialization needs it; not warmed by Navi; access-control row
  noting raw IPs, session ids and user identities. Example request/headers/body and a key
  type table, as in `users.md`.
- **Edge cases:** deleted users show as anonymous; visits started before `from` excluded;
  open visits (ongoing, current duration); single-hit visits (duration 0); login as a visit
  boundary (the login request's visit is anonymous); proxy-cached requests not counted;
  no backfill; page past the last one; staff traffic counted; IP spoofable until #1501;
  user renamed shows current identity; a session's IP/domain is fixed per session.
- **Open questions:** deferred — IP / session filters, ascending sort, CSV export, user
  agent (not stored), chart.
- **Implementation sub-issues:** placeholder table filled in by step 03.

## Files to Change
- `docs/agents/specs/access-statistics/visit-list.md` — full spec content.
