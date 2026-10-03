# Plan: Spec: access statistics Overview tab

Issue: [1483-spec-access-statistics-overview-tab.md](../../issues/1483-spec-access-statistics-overview-tab.md)

## Overview

Documentation-only: fill in `docs/agents/specs/access-statistics/overview.md` (promote it
from `stub` to `specced`), then create the backend and frontend implementation sub-issues
under #1477 and record them in the spec pages. Owned by the architect (no specialist code).

## Context

The Overview tab is the landing tab of `/staff/statistics`: Bootstrap KPI cards for the
selected range, each linking to its tab. Already decided in the issue discussion: new vs
returning is based on the visitor's first visit ever (lookup of visits before `start_utc`),
previous-period comparison is deferred, the endpoint is a dedicated
`GET /staff/statistics/overview.json` returning the standard envelope with `totals` only,
and the implementation is a backend + frontend pair (like #1498/#1499). The conventions to
build on are in `shared-infrastructure.md` (params, validation, envelope, aggregator
classes) and `data-model.md` (visit, visitor key, caveats).

## Implementation Steps

### Step 1 — Fill in `overview.md`

Rewrite every `_To define (#1483)_` section:

- **Metrics:** `visits` (count of `Visit` rows in range), `unique_visitors` (distinct
  visitor keys), `logged_in_users` (distinct `session__user_id` not null),
  `average_duration_seconds` (`metrics.average` of `last_seen_at − started_at`, `null` when
  no visits), `new_visitors` / `returning_visitors` (visitor keys whose earliest visit ever
  is inside the range vs. those with any visit before `start_utc`; the two sum to
  `unique_visitors`). Empty-range values: counts `0`, average `null` (shown as "—").
- **Previous-period comparison:** deferred.
- **Filters:** range, user, domain, audience apply; granularity is accepted and echoed but
  unused (no buckets) and the filter bar hides / disables the control on this tab.
- **Layout:** tile order, responsive grid, link target of each tile (via
  `statisticsHref(tabPath, filters)`).
- **API:** `overview.json` envelope with `filters` + `totals` (no `buckets`), key types,
  one `VisitQuery.rows(...)` pass plus the earlier-visits lookup (ORM, filtered by the same
  user/domain/audience filters, `started_at < start_utc`, restricted to the in-range visitor
  keys), view/test file names per API conventions, restricted, not in Navi.
- **Edge cases:** no backfill caveat (near deploy almost all visitors are new), user filter
  (logged-in users ≤ 1, unique visitors ≤ 1), `audience=anonymous` → logged-in users `0`,
  new vs returning computed within the filtered population, deleted users / null domains,
  unknown ids → zero totals.
- Set status to `specced` on the page and in the hub.

### Step 2 — Create sub-issues and record them

Create via `gh issue create` (linked as sub-issues of #1477) a backend issue
(`overview.json`, needs #1498) and a frontend issue (Overview tab, needs #1499 and the
backend issue), both pointing at the spec page and noting the tab is implemented last.
Append them to the hub's sub-issue map and to `overview.md`'s "Implementation sub-issues".

## Files to Change

- `docs/agents/specs/access-statistics/overview.md` — full spec, status `specced`
- `docs/agents/specs/access-statistics.md` — status of Overview and sub-issue map rows

## Notes

- No code changes; no CI job beyond markdown checks is affected.
- `access-control/staff-statistics.md` gets its `overview.json` row in the backend
  implementation sub-issue, not here.
