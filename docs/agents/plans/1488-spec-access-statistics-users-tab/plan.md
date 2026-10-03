# Plan: Spec: access statistics Users tab

Issue: [1488-spec-access-statistics-users-tab.md](../../issues/1488-spec-access-statistics-users-tab.md)

## Overview

Documentation-only work owned by the architect: fill in the Users tab spec page
(`docs/agents/specs/access-statistics/users.md`) with the decisions recorded in the issue,
create the backend + frontend implementation sub-issues under #1477, and keep the spec hub
and the shared-infrastructure page in sync. No code changes.

## Context

The Users tab (`/staff/statistics/users`) is a paginated, server-sorted table of logged-in
users with at least one matched visit in the range. Columns: user (name + email), visits,
total time on site, average visit duration, hits, domains and last seen. A `sort` query param
(default `visits`, always descending, ties by user id) drives the order. A row click opens
Overview with `?user=<id>`, and a separate link opens `/staff/users/<id>`. The endpoint is a
**paginated** one per the shared API conventions (plain JSON array + `page` / `pages` /
`per_page` / `total` headers, no envelope, no totals). Granularity is hidden and ignored
(like Domains); `audience=anonymous` yields an empty list. The tab has no chart: a chart is a
deferred open question.

The Domains tab spec (`domains.md`, #1487) is the structural template: same section order,
same level of detail (metric table, filter table, layout, layering, i18n keys, API with an
example response and type table, query plan, edge cases, deferred questions, sub-issue
table).

## Steps

- [01 — Write the Users tab spec page](plan/01-write-users-spec.md)
- [02 — Sync the shared-infrastructure page](plan/02-sync-shared-infrastructure.md)
- [03 — Create the implementation sub-issues and update the hub](plan/03-create-sub-issues-and-hub.md)

## CI Checks

- `docs/`: markdownlint (CI job: `markdownlint`), configured by `.markdownlint.json`; run it
  through the project's docker-compose / make tooling, never on the host.

## Notes

- `sort` is the first tab-specific query param. It is validated by the Users endpoint on top
  of `parse_statistics_filters`, and it is **not** added to the shared `FILTER_KEYS`
  allowlist carried across tabs (like `page` / `per_page`).
- Whether `average_duration` and `hits` are sortable is decided while writing the spec; the
  recommendation is to allow sorting on every numeric column plus `last_seen`
  (`visits`, `time_on_site`, `average_duration`, `hits`, `last_seen`).
- Sorting by a computed metric across pages means the backend aggregates every matching user
  in Python, sorts, then slices the page; the user count is bounded by the range cap and
  modest traffic, which the spec should state explicitly.
