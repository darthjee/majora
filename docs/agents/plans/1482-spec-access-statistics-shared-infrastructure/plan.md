# Plan: Spec: access statistics shared infrastructure

Issue: [1482-spec-access-statistics-shared-infrastructure.md](../../issues/1482-spec-access-statistics-shared-infrastructure.md)

## Overview

Documentation-only. Resolve every "To define" item in
`docs/agents/specs/access-statistics/shared-infrastructure.md`, flip its status to `specced`,
write `docs/agents/access-control/staff-statistics.md`, then create three shared
implementation sub-issues under #1477 (backend, frontend shell, Recharts setup) and record
them in the page and the hub.

## Context

#1481 created the hub and this page with a "Decided" section (aggregation in Python, filter
bar controls and defaults, Recharts layering, etc.). This issue does not reopen those; it
turns the remaining items into concrete names, values and interfaces, grounded in the
existing code. Already verified: `HashRouteResolver` reads hash query params
(`HashQueryParams`, with a filter-key allowlist near line 125), and `staff/users.json`
supports `?search=` (`backend/staff/views/staff_users_list.py`).

## Steps

- [01 — Navigation and URL query state](plan/01-navigation-and-url-state.md)
- [02 — API conventions, granularity and range cap](plan/02-api-conventions.md)
- [03 — Python aggregator design](plan/03-aggregator-design.md)
- [04 — Frontend conventions: RequestStore and Recharts](plan/04-frontend-conventions.md)
- [05 — Access-control docs and production topology](plan/05-access-control-and-topology.md)
- [06 — Close out: status, sub-issues, hub](plan/06-close-out.md)

## Notes

- No code changes. Every decision must cite the existing file or pattern it follows.
- The range cap is chosen and justified by the spec author (not pinned by the issue).
- Sub-issues are created with GitHub's native sub-issue link to #1477; each one points back
  to the relevant sections of `shared-infrastructure.md` instead of copying them.
- Tab-specific decisions (#1483 to #1489) stay out of this page.
