# Issue: Spec: access statistics Visitors tab

## Description
Spec-only sub-issue of #1477 (no code). Fill in the **Visitors tab** (`/staff/statistics/visitors`) spec page `docs/agents/specs/access-statistics/visitors.md` (currently a `stub`), consistent with the [shared infrastructure](docs/agents/specs/access-statistics/shared-infrastructure.md) (#1482), [data model](docs/agents/specs/access-statistics/data-model.md), [Overview](docs/agents/specs/access-statistics/overview.md) (#1483) and [Visits](docs/agents/specs/access-statistics/visits.md) (#1484) pages, then create its implementation sub-issues under #1477.

The Visitors tab shows unique visitors over time, split into new vs returning and into anonymous vs logged-in.

## Expected Behavior
`visitors.md` replaces every "To define (#1485)" placeholder with the decisions below, at the level of detail of `overview.md` and `visits.md`.

### Decisions (from the #1485 discussion)
- **Unique visitors per bucket:** distinct [visitor keys](docs/agents/specs/access-statistics/data-model.md#visitor-key) among the visits **started** in the bucket (`Visit.started_at`, shared half-open convention, shared filters applied), using `metrics.unique`.
- **New vs returning, per bucket:** a visitor key is **returning** in a bucket if it has any `Visit` before that **bucket's start**, otherwise **new**. A visitor is therefore new only in the bucket of their first visit ever. As in Overview, the earlier-visits lookup ignores the range and the `domain` / `audience` filters (any domain). Per bucket: `new_visitors + returning_visitors == unique_visitors`.
- **Anonymous vs logged-in, per bucket:** distinct anonymous session keys and distinct user keys. Per bucket: `anonymous + logged_in == unique_visitors`.
- **Chart:** **two stacked-bar charts** sharing the categorical X axis over the zero-filled buckets: (1) new vs returning, (2) anonymous vs logged-in. In both, the bar height is the bucket's unique visitors. Colors come from the `--majora-chart-*` variables. Each tooltip shows the clipped bucket date range (`Intl.DateTimeFormat`), both series, the total, and a share as a percentage (hidden when the total is 0).
- **Totals:** `totals` carries **range-level distinct counts**: `unique_visitors`, `new_visitors` and `returning_visitors` (Overview's definition, before the range start, so they match the Overview tiles), plus `anonymous` and `logged_in`. They are shown as a summary above the charts, with a note that range totals are not sums of the buckets, because a visitor seen in several buckets counts once.
- **Audience filter:** the API always returns every key. With `audience=anonymous` or `logged_in`, the filtered-out series in chart 2 is all zeros and is **hidden**, as on the Visits tab.
- **Filters:** all shared filters apply (date range, user, domain, audience, and granularity with its control shown).
- **API:** `GET /staff/statistics/visitors.json`, following the shared API conventions: the standard envelope, with `buckets` (`start`, `end`, `unique_visitors`, `new_visitors`, `returning_visitors`, `anonymous`, `logged_in`) and the `totals` above.
- **Implementation sub-issues:** a **backend + frontend pair**: the `visitors.json` endpoint (needs #1498), and the frontend tab (needs #1499, #1500 and the endpoint).

### Still to write in the spec
- The query plan: one `VisitQuery` pass (`started_at`, `session_id`, `session__user_id`), plus one ORM lookup of each in-range key's **first visit ever** (`Min('started_at')` grouped by `session__user_id` / anonymous `session_id`, restricted to the in-range keys), which classifies keys both per bucket and for the range totals. This lives in an aggregation class (e.g. `statistics/aggregation/visitors_series.py`).
- Loading / error / empty states, file layering per the shared Recharts conventions, and `visitors.*` i18n keys.
- Tab-specific edge cases: no backfill (near the deploy almost everyone shows as new, with a "first visit recorded" note as in Overview), the user filter (counts of 0 or 1 per bucket), `user` with `audience=anonymous`, an anonymous visitor who later logs in (two keys), deleted users counted as anonymous, the domain filter not affecting the earlier-visits lookup, and the first bucket clipped to `from`.
- Open questions resolved or explicitly deferred.
- The implementation sub-issues listed in `visitors.md` and added to the hub's sub-issue map. The page status changes from `stub` to `specced`.

## Solution
- Follow the structure of `overview.md` (#1483) and `visits.md` (#1484).
- Reuse the shared aggregator (`VisitQuery`, `BucketCalendar`, `Series`, `metrics`) and the `staffStatistics` RequestStore resource with a new `visitors` quantity type.
- Documentation only: no code changes.

### Dependencies
- #1481 (spec init), #1482 (shared infrastructure spec): done.

## Benefits
- Completes the visitor-focused tab linked from two Overview tiles (Unique visitors, New vs returning), with numbers consistent with Overview.
- Shows staff both acquisition (new vs returning) and audience mix (anonymous vs logged-in) over time.
