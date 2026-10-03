# Issue: Spec: access statistics Domains tab

## Description

Spec-only sub-issue (no code). Discuss and document the **Domains tab (`/staff/statistics/domains`)** in its spec page
`docs/agents/specs/access-statistics/domains.md`, then create its implementation sub-issue(s) under
#1477.

## Context

Part of the staff **access statistics page** (parent #1477): a staff-only page (`staffOrSuperuser`) with a new staff menu entry and seven tabs (Overview, Visits, Visitors, Duration, Domains, Users, Visit list), each its own route under `/staff/statistics`.

Key decisions already made in #1477:

- **Data:** `statistics.Session` is the long-lived **visitor** (device/browser) identity. Activity comes from the new `statistics.Visit` model (#1478): `session`, `started_at`, `last_seen_at`, `hits`, with a 30-minute inactivity window. #1480 (ghost anonymous sessions) is assumed fixed.
- **Visitor key:** `user_id` when the session has a user, otherwise the session id.
- **Access:** staff-only, GET-only endpoints under `staff/statistics/...json`, following the `staff_cache_summary` pattern (`@restricted`, `require_staff`). All staff see everything, including IPs.
- **Aggregation:** on the fly, bucketed **in Python** (`zoneinfo`, browser time zone), with zero-filled buckets and a capped date range. There are no rollups.
- **Charts:** Recharts 3, lazy-loaded. Each chart has a client, a controller (no JSX) and a pure render helper; chart components get smoke tests only.
- **Shared filter bar:** date range, user, domain, audience (anonymous/logged-in) and granularity, kept in the URL query.

Spec hub: `docs/agents/specs/access-statistics.md` (created by the first spec sub-issue).

Relevant data facts:

- `statistics.Session.domain` is a nullable FK to `domains.Domain` (a hostname); each `Domain`
  belongs to a `DomainGroup` (tenant/brand). The shared `domain` filter works on
  `Session.domain_id` or `unknown` (`domain IS NULL`).
- The shared backend (#1498) already adds `GET /staff/statistics/domains.json` (the plain
  domain list for the filter select); the Domains **tab** endpoint must not reuse that name.

## Decisions from discussion

- **Metrics per domain:** visits (split into anonymous / logged-in), unique visitors (by
  visitor key), and average + median visit duration, reusing the shared `metrics` helpers
  and the Duration / Overview definitions and rounding. `totals` is computed over **all**
  matched visits, never summed from rows. As a result, per-domain unique visitors can add up
  to more than `totals.unique_visitors` (a visitor seen on several domains), and the spec
  must say so.
- **Whole-range comparison only:** no buckets or time series. There is one horizontal
  Recharts `BarChart` (visits per domain, anonymous / logged-in stacked) and a table with
  every metric under it. The tab **hides the granularity control**.
- **Grouping:** one row per `Domain` (hostname), matching the shared filter. The row also
  shows its `DomainGroup` name.
- **Domain filter:** applies as on every other tab, so a selected domain leaves a single row.
- **Rows:** every configured `Domain` gets a row, zero-filled when it has no visits
  (domains are a small, admin-managed set), plus the **"unknown"** row (`domain = NULL`),
  always listed **last**.
- **Row click:** navigates to the Overview tab with `?domain=<id|unknown>`, keeping the
  other filters (via `statisticsHref`).
- **Endpoint:** a dedicated endpoint. The proposed name is
  `GET /staff/statistics/domains/summary.json`, following `staff/cache/summary.json`; the
  spec confirms the final name. It uses the standard envelope (`filters`, `totals`), with a
  `domains` list replacing `buckets`.
- **Implementation:** a backend + frontend pair, like the other tabs.

## What to define in the spec

- Exact metric keys per domain row and in `totals`, the row order (default sort: visits,
  descending, with "unknown" last), and the `null` handling for duration on zero-visit rows.
- The chart and table details: axes, tooltip, table columns and client-side sorting, the
  row-click navigation, the states (loading / error / empty), the layering
  (client / controller / helper) and the i18n keys.
- The "unknown" row: its id (`"unknown"`), its label, and when it shows up with each
  domain filter value.
- How the tab interacts with the domain filter (single row) and the hidden granularity
  control.
- The endpoint name and response shape, plus the ORM query (a single `VisitQuery` pass
  plus the `Domain` list).

## Dependencies

- **Blocked by #1481** (spec init) and **#1482** (shared-infrastructure spec): the stub pages and the shared conventions must exist first.

## Acceptance criteria

- [ ] `docs/agents/specs/access-statistics/domains.md` documents the items above, consistent with
      the shared-infrastructure, data-model, Overview and Duration spec pages.
- [ ] Open questions are resolved or explicitly listed as deferred.
- [ ] Implementation sub-issue(s) for this tab are created under #1477 (backend endpoint +
      frontend tab, as one issue or a pair, as the spec decides), referencing the spec page.
- [ ] Documentation only: no code changes.
- [ ] The created implementation sub-issue numbers are added to the sub-issue map in the
      spec hub (`docs/agents/specs/access-statistics.md`).

