# Issue: Spec: access statistics Users tab

## Description

Spec-only sub-issue (no code). Discuss and document the **Users tab (`/staff/statistics/users`)** in its spec page `docs/agents/specs/access-statistics/users.md`, then create its implementation sub-issue(s) under #1477 and record them in the spec hub.

Part of the staff **access statistics page** (parent #1477). The shared conventions are already specced in `shared-infrastructure.md` (#1482), and the Overview, Visits, Visitors, Duration and Domains tabs are specced (#1483–#1487). The Domains tab (`domains.md`) is the closest analog: a whole-range table with no time series.

Constraints already settled upstream:

- Data: activity comes from `statistics.Visit`; the visitor key is `('user', user_id)` for logged-in sessions. Deleted users (`user = NULL`) count as anonymous.
- The Users ranking is a **paginated endpoint**: per the shared API conventions it returns a plain JSON array with `page` / `pages` / `per_page` / `total` headers (`paginated_list_response`), with no envelope; `page` / `per_page` are validated strictly (`per_page ≤ 100`) and are not carried across tabs.
- Clicking a user sets `?user=<id>` in the URL query (`statisticsHref`), applying the user filter on the other tabs.
- Staff-only, GET-only, `@restricted`, inline `require_staff`, not warmed by Navi; a row goes in `access-control/staff-statistics.md`.

## Problem

`users.md` is still a stub. It does not yet define the ranking metric(s), columns, ordering, top N / pagination, filter behavior, row-click target, endpoint response shape or edge cases, so the implementation sub-issues cannot be written.

## Expected Behavior

`users.md` is filled in (status `specced`) with the same sections as the other tab pages (Decided, Metrics, Filters, Chart and layout, API, Edge cases, Open questions, Implementation sub-issues), consistent with the shared-infrastructure spec.

### What to define

- The ranking metric(s) for logged-in users: visits, time on site.
- The columns (including last seen).
- Ordering, top N and pagination (per `docs/agents/pagination.md`).
- Clicking a user sets the `user` filter on the other tabs.
- The endpoint response shape.

### Decisions from the discussion

- **Rows:** one row per logged-in user (`session__user_id` not null) with at least one matched visit; users with no visits in the range are not listed. There is no hard cap: "top N" is the current page. The list is paginated per `pagination.md` (default `Settings.pagination_size()`, `per_page ≤ 100`).
- **Metrics / columns:** user (name + email as secondary text), visits, total time on site (sum of visit durations, `last_seen_at − started_at` in whole seconds), average visit duration (rounded like Duration, `null`-safe), hits (sum of `Visit.hits`: uncached backend requests, not page views), domains (the hostnames the user visited in the range, "unknown" for null domains), and last seen (latest `Visit.last_seen_at` among the matched visits, shown in the browser time zone).
- **Ordering:** server-side, through a `sort` query param. Allowed keys cover the numeric columns (at least `visits`, `time_on_site`, `last_seen`; the spec decides whether `average_duration` and `hits` are sortable too), always descending, ties broken by user id. Defaults to `visits`. An invalid value is a `400` with a new `invalid_sort` error code. Clicking a column header sets `?sort=` and resets to page 1. `sort`, like `page` / `per_page`, is not carried across tabs.
- **Row click:** opens the Overview tab with `?user=<id>`, keeping the other filters (`statisticsHref`), like the Domains row click. A separate small link in the row opens that user's staff page (`/staff/users/<id>`).
- **Response:** a plain JSON array of user rows with pagination headers (no envelope, no totals), per the shared API conventions. The spec defines the row keys.
- **Filters:** date range, `user`, `domain` and `audience` apply with the shared semantics; granularity is irrelevant (hidden, accepted and ignored, like Domains). With `audience=anonymous` the list is empty; with `user=<id>` it holds at most that one row.
- **No chart** in this iteration (table only); a chart is left as a deferred open question.

## Solution

Documentation only. Update `docs/agents/specs/access-statistics/users.md`, flip its status in the hub, create the implementation sub-issue(s) under #1477 (backend endpoint + frontend tab, as one issue or a pair, as the spec decides), referencing the spec page, and append them to the hub's sub-issue map.

### Dependencies

- #1481 (spec init) and #1482 (shared-infrastructure spec): done.

### Acceptance criteria

- [ ] `docs/agents/specs/access-statistics/users.md` documents the items above, consistent with the shared-infrastructure spec page.
- [ ] Open questions are resolved or explicitly listed as deferred.
- [ ] Implementation sub-issue(s) for this tab are created under #1477, referencing the spec page.
- [ ] Documentation only: no code changes.
- [ ] The created implementation sub-issue numbers are added to the sub-issue map in the spec hub (`docs/agents/specs/access-statistics.md`), and the Users page status is set to `specced`.
