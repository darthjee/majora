# Issue: Spec: access statistics Visits tab

## Description
Spec-only sub-issue of #1477 (no code). Fill in the **Visits tab** (`/staff/statistics/visits`) spec page `docs/agents/specs/access-statistics/visits.md` (currently a `stub`), consistent with the [shared infrastructure](docs/agents/specs/access-statistics/shared-infrastructure.md) (#1482) and [data model](docs/agents/specs/access-statistics/data-model.md) pages, then create its implementation sub-issues under #1477.

The Visits tab is a visits-over-time chart split into anonymous and logged-in, and is implemented **first** among the tabs, since it proves the end-to-end pipeline (shared backend #1498 → frontend shell #1499 → Recharts setup #1500 → this tab).

## Expected Behavior
`visits.md` replaces every "To define (#1484)" placeholder with the decisions below, at the level of detail of `overview.md` (#1483).

### Decisions (from the #1484 discussion)
- **Metrics:** visits **started** in each bucket (`Visit.started_at` in the half-open UTC range, shared convention), split by the session's audience (`session.user` null → anonymous, not null → logged-in). Per bucket and in `totals`: `anonymous`, `logged_in` and `visits` (total, `anonymous + logged_in`). **Visits only**: no hits.
- **Chart:** **stacked bars**, one bar per bucket with anonymous and logged-in stacked (bar height = total), categorical X axis over the zero-filled buckets, colors from the `--majora-chart-*` variables.
- **Tooltip:** the bucket's date range (clipped `start`–`end`, formatted with `Intl.DateTimeFormat`), anonymous, logged-in and total counts, and the logged-in share as a percentage (hidden when the total is 0).
- **Audience filter:** the API always returns both keys per bucket; with `audience=anonymous` or `logged_in`, the filtered-out series is all zeros and the chart **hides that series** (and its legend entry).
- **Filters:** all shared filters apply (date range, user, domain, audience, granularity with the granularity control shown).
- **API:** `GET /staff/statistics/visits.json` following the shared API conventions; the standard envelope with `buckets` and `totals` carrying the keys above.
- **Implementation sub-issues:** a **backend + frontend pair**, like Overview: the `visits.json` endpoint (needs #1498), and the frontend tab (needs #1499, #1500 and the endpoint).

### Still to write in the spec
- Loading / error / empty states, file layering per the shared Recharts conventions, i18n keys.
- Tab-specific edge cases (no backfill before #1478, user filter with `audience=anonymous`, deleted users counted as anonymous, open visits, login as a visit boundary).
- Open questions resolved or explicitly deferred.
- The implementation sub-issues listed in `visits.md` and appended to the hub's sub-issue map; the hub page status changes from `stub` to `specced`.

## Solution
- Follow the structure of `overview.md` (#1483).
- Reuse the shared aggregator (`VisitQuery`, `BucketCalendar`, `Series`, `metrics`) with one `VisitQuery` pass fetching `started_at` and `session__user_id`, and the `staffStatistics` RequestStore resource with a new `visits` quantity type.
- Documentation only: no code changes.

### Dependencies
- #1481 (spec init) and #1482 (shared infrastructure spec): done.

## Benefits
- Defines the first tab to be implemented, validating the whole statistics pipeline end to end.
- Gives the remaining time-series tabs (Visitors, Duration) a worked example of a bucketed chart spec.
