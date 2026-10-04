# Issue: Spec: access statistics Visit list tab

## Description

Spec-only sub-issue (no code). Discuss and document the **Visit list tab (`/staff/statistics/visit-list`)** in its spec page `docs/agents/specs/access-statistics/visit-list.md`, then create its implementation sub-issue(s) under #1477 and record them in the spec hub.

Part of the staff **access statistics page** (parent #1477). The shared conventions are already specced in `shared-infrastructure.md` (#1482), and the Overview, Visits, Visitors, Duration, Domains and Users tabs are specced (#1483–#1488). The Users tab (`users.md`) is the closest analog: a paginated table with no time series.

Constraints already settled upstream:

- Data: one row per `statistics.Visit`. A visit's IP, domain and user come from its `Session` (the session is reused only while the IP and domain match). Deleted users (`user = NULL`) count as anonymous. Visit duration is `last_seen_at − started_at`; `hits` counts uncached backend requests, not page views.
- Raw IPs are shown to all staff, unmasked, as recorded (best effort and spoofable until #1501).
- The Visit list is a **paginated endpoint** (`visit-list.json`): per the shared API conventions it returns a plain JSON array with `page` / `pages` / `per_page` / `total` headers, with no envelope; `page` / `per_page` are validated strictly (`per_page ≤ 100`) and are not carried across tabs.
- Staff-only, GET-only, `@restricted`, inline `require_staff`, not warmed by Navi; a row goes in `access-control/staff-statistics.md` (noting it exposes IPs and user identities).

## Problem

`visit-list.md` is still a stub. It does not yet define the columns, sort order, pagination, filter behavior, row links, endpoint response shape or edge cases, so the implementation sub-issues cannot be written.

## Expected Behavior

`visit-list.md` is filled in (status `specced`) with the same sections as the other tab pages (Decided, Metrics, Filters, Chart and layout, API, Edge cases, Open questions, Implementation sub-issues), consistent with the shared-infrastructure spec.

### What to define

- The columns: user, IP, domain, start, duration, hits.
- Sort order.
- Pagination (per `docs/agents/pagination.md`).
- How filters apply.
- Whether a row links anywhere (e.g. to the user filter).
- The endpoint response shape.

### Decisions from the discussion

- **Rows:** one row per `Visit` matched by the shared filters (`started_at` in the range, plus `user`, `domain` and `audience` on the visit's session). No zero-filling, no hard cap. Paginated per `pagination.md` (default `Settings.pagination_size()`, `per_page ≤ 100`).
- **Columns:** user, IP, domain ("unknown" for null domains), start, last seen (end), duration (`last_seen_at − started_at`, whole seconds, Overview's duration formatter), hits, and an **ongoing** indicator for visits whose `last_seen_at` is still within the inactivity window (`Settings.visit_inactivity_seconds()`, computed server-side at request time). Times are shown in the browser time zone.
- **Anonymous visits:** shown as "Anonymous" plus a short visitor id (the `Session` id) so staff can tell repeat anonymous visitors apart. The cookie token is never exposed.
- **Ordering:** server-side, through a tab-specific `sort` query param, as on the Users tab: keys `started_at` (default, newest first), `last_seen`, `duration`, `hits` (the spec settles the exact key names); always descending, ties broken by visit id descending. An invalid value is a `400` with the existing `invalid_sort` code. Clicking a sortable header sets `?sort=` and resets to page 1. `sort`, like `page` / `per_page`, is not carried across tabs.
- **Links:** the row itself is not clickable. For a logged-in visit, the user cell links to the Overview tab with `?user=<id>`, keeping the other filters (`statisticsHref`), plus a separate small link to the user's staff page (`#/staff/users/<id>`), like the Users tab. Anonymous rows, IPs and domains are not links.
- **Filters:** date range, `user`, `domain` and `audience` apply with the shared semantics; granularity is irrelevant (hidden, accepted and ignored, like Users and Domains).
- **Response:** a plain JSON array of visit rows with pagination headers (no envelope, no totals), per the shared API conventions. The spec defines the row keys (including the user identity keys, matching the Users tab, and the session id for anonymous rows).
- **No chart** in this iteration (table only).

## Solution

Documentation only. Update `docs/agents/specs/access-statistics/visit-list.md`, flip its status in the hub, create the implementation sub-issue(s) under #1477 (backend endpoint + frontend tab, as one issue or a pair, as the spec decides), referencing the spec page, and append them to the hub's sub-issue map.

### Dependencies

- #1481 (spec init) and #1482 (shared-infrastructure spec): done.

### Acceptance criteria

- [ ] `docs/agents/specs/access-statistics/visit-list.md` documents the items above, consistent with the shared-infrastructure spec page.
- [ ] Open questions are resolved or explicitly listed as deferred.
- [ ] Implementation sub-issue(s) for this tab are created under #1477, referencing the spec page.
- [ ] Documentation only: no code changes.
- [ ] The created implementation sub-issue numbers are added to the sub-issue map in the spec hub (`docs/agents/specs/access-statistics.md`), and the Visit list page status is set to `specced`.
