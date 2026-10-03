# Issue: Spec: access statistics Duration tab

## Description

Spec-only sub-issue (no code). Discuss and document the **Duration tab (`/staff/statistics/duration`)** in its spec page
`docs/agents/specs/access-statistics/duration.md`, then create its implementation sub-issue(s) under
#1477.

## Context

Part of the staff **access statistics page** (parent #1477): a staff-only page (`staffOrSuperuser`) with a new staff menu entry and seven tabs (Overview, Visits, Visitors, Duration, Domains, Users, Visit list), each its own route under `/staff/statistics`.

Key decisions already made in #1477 and the sibling specs:

- **Data:** `statistics.Session` is the long-lived **visitor** identity. Activity comes from `statistics.Visit` (#1478): `session`, `started_at`, `last_seen_at`, `hits`, with a 30-minute inactivity window. Visit duration is `last_seen_at - started_at` (whole seconds); hits per visit is `hits` ([data model](docs/agents/specs/access-statistics/data-model.md)).
- **Access:** staff-only, GET-only endpoints under `staff/statistics/...json` (`@restricted`, `require_staff`).
- **Aggregation:** on the fly, bucketed in Python by the shared aggregator (`VisitQuery`, `BucketCalendar`, `Series`, `metrics.average` / `metrics.median` / `metrics.histogram`), zero-filled buckets, capped range, no rollups.
- **Charts:** Recharts 3, lazy-loaded; client / controller / pure render helper layering; smoke tests only for chart components.
- **Shared filter bar** and the standard response envelope (`filters`, `buckets`, `totals`, plus tab-specific top-level keys such as a histogram).
- **Consistency with Overview (#1483):** Overview's `average_duration_seconds` already includes open visits (current duration) and single-hit visits (duration `0`); the Duration tab's totals must match it.
- **Precision finding:** the #1478 throttle only applies to `Session.last_seen_at`. `Visit.last_seen_at` is updated on **every** uncached request (atomic `UPDATE`), so durations are exact to the request. The real limits are that duration measures first-to-last **backend request** (time on the last page is never seen) and proxy-cached requests never extend a visit.

## Decisions from discussion

- **Single-hit visits** (duration `0`) are **included** in the average and median (matching
  Overview's `average_duration_seconds`), get their own `0 s` histogram bin, and are also
  reported as a single-hit count and share in `totals` and the tooltip.
- **Histogram bin edges** (seconds), fixed for every range: `[0, 1, 30, 60, 180, 600, 1800, 3600]`,
  i.e. `0 s` (single-hit), `<30 s`, `30 s–1 m`, `1–3 m`, `3–10 m`, `10–30 m`, `30 m–1 h`,
  `≥1 h` (via `metrics.histogram`). The histogram covers the whole range (a tab-specific
  top-level key), not each bucket.
- **Layout: three charts** under a totals line:
  1. `LineChart`: average and median visit duration per bucket;
  2. `LineChart`: average and median hits per visit per bucket;
  3. `BarChart`: duration histogram for the whole range.
- **No audience split:** one series per metric; the shared `audience` filter narrows it.
- Visits belong to the bucket they **started** in (same rule as Visits / Overview); open
  visits count with their current duration.

## What to define in the spec

- Exact metric keys per bucket and in `totals` (average / median duration, average / median
  hits, visit count, single-hit count and share); `null` handling for empty buckets.
- The histogram response key and bin shape (`lower`, `upper`, `count`).
- The precision caveats (replacing the "write throttle" item, see the finding above).
- Chart details (axes, duration formatting, tooltips, states, layering, i18n keys).
- The endpoint response shape.

## Dependencies

- **Blocked by #1481** (spec init) and **#1482** (shared-infrastructure spec): the stub pages and the shared conventions must exist first.

## Acceptance criteria

- [ ] `docs/agents/specs/access-statistics/duration.md` documents the items above, consistent with
      the shared-infrastructure, data-model and Overview spec pages.
- [ ] Open questions are resolved or explicitly listed as deferred.
- [ ] Implementation sub-issue(s) for this tab are created under #1477 (backend endpoint +
      frontend tab, as one issue or a pair, as the spec decides), referencing the spec page.
- [ ] Documentation only: no code changes.
- [ ] The created implementation sub-issue numbers are added to the sub-issue map in the
      spec hub (`docs/agents/specs/access-statistics.md`).
