# Plan: Spec: access statistics Domains tab

Issue: [1487-spec-access-statistics-domains-tab.md](../../issues/1487-spec-access-statistics-domains-tab.md)

## Overview

Documentation only. Fill in the Domains tab spec page
(`docs/agents/specs/access-statistics/domains.md`) with the decisions recorded in the issue:
a whole-range, per-`Domain` comparison (visits split anonymous / logged-in, unique visitors,
average and median duration) shown as a stacked horizontal bar chart plus a table, with an
"unknown" row last and a dedicated `domains/summary.json` endpoint. Then create the backend
+ frontend implementation sub-issues under #1477 and record them in the spec page and the
hub. No code changes.

## Context

- Sibling tab specs already specced and used as the template for structure and wording:
  [visits.md](../../specs/access-statistics/visits.md) (#1484),
  [overview.md](../../specs/access-statistics/overview.md) (#1483, whole-range tab that
  hides the granularity control via `showGranularity={false}`),
  [duration.md](../../specs/access-statistics/duration.md) (#1486, average / median
  duration definitions and rounding).
- Shared conventions live in
  [shared-infrastructure.md](../../specs/access-statistics/shared-infrastructure.md):
  `parse_statistics_filters`, `StatisticsFilters`, `VisitQuery` (`rows(...)`,
  `visitor_key`), `metrics.count` / `unique` / `average` / `median`, the response envelope,
  the Recharts conventions (CSS colour variables `--majora-chart-*`, client / controller /
  helper layering), `statisticsHref`, and the `domains.json` support endpoint from #1498
  that the tab endpoint must not reuse.
- Data: `Session.domain` is a nullable FK to `domains.Domain` (`domain` hostname,
  `domain_group` FK to `DomainGroup` with `name`).
- Decisions from the issue discussion: metrics = visits (anonymous / logged-in), unique
  visitors, average + median duration; whole range only (granularity hidden); one row per
  `Domain` showing its `DomainGroup` name; the domain filter applies (single row); every
  configured `Domain` gets a zero-filled row, "unknown" always last; row click opens Overview
  with `?domain=<id|unknown>`; dedicated endpoint, proposed
  `GET /staff/statistics/domains/summary.json`; backend + frontend pair.

## Steps

- [01 — Write the Domains spec page](plan/01-write-domains-spec.md)
- [02 — Create the implementation sub-issues](plan/02-create-implementation-sub-issues.md)
- [03 — Record the sub-issues in the spec page and the hub](plan/03-update-spec-and-hub.md)
- [04 — Cross-check the sibling pages](plan/04-cross-check-sibling-pages.md)

## Notes

- Documentation only: nothing under `backend/`, `frontend/`, `navi/` or `proxy/` changes, so
  no CI test job is affected beyond any docs/markdown linting.
- The endpoint name (`domains/summary.json`, URL name `staff-statistics-domains-summary`,
  view `staff_statistics_domains_summary`) is the issue's proposal; the spec confirms it.
  It nests under `staff/statistics/domains/` next to the support endpoint
  `staff/statistics/domains.json`, which is fine in Django (distinct paths).
- Per-domain `unique_visitors` can sum to more than `totals.unique_visitors` (one visitor on
  several domains); the spec must call this out, and the table must not show a "sum" row
  for that column.
- Zero-visit rows have `null` average / median duration (same `null` rule as Duration's
  empty buckets).
- With `domain=<id>` the response holds just that row (zero-filled if the id exists but has
  no visits; empty `domains` list for an unknown id, per the shared "unknown id is not an
  error" rule, decide and document). With `domain=unknown` it holds only the "unknown" row.
