# Plan: Spec: access statistics Visit list tab

Issue: [1489-spec-access-statistics-visit-list-tab.md](../issues/1489-spec-access-statistics-visit-list-tab.md)

## Overview

Documentation only. Fill in the Visit list tab spec page
(`docs/agents/specs/access-statistics/visit-list.md`) with the decisions from the issue
discussion, keep the shared-infrastructure page consistent with the new tab-specific `sort`
param, then create the backend + frontend implementation sub-issues under #1477 and record
them in the spec hub. No code changes.

## Context

The Visit list is the last stub tab of the staff access statistics page (#1477). The Users
tab (`users.md`, #1488) is the closest analog — a paginated table with server-side `sort`,
no chart, row identity keys matching `StaffUserListSerializer` — and is the template for
section structure, wording and level of detail. Decisions settled in the issue:

- one row per matched `Visit`; IP, domain and user come from its `Session`;
- columns: user (anonymous → "Anonymous" + session id, never the token), IP, domain
  ("unknown" for null), start, last seen, duration, hits, ongoing indicator (server-side,
  `last_seen_at` within `Settings.visit_inactivity_seconds()` of request time);
- `sort` param: `started_at` (default), `last_seen`, `duration`, `hits`; always
  descending, ties by visit id descending; `invalid_sort` on bad values; not carried
  across tabs;
- user cell → Overview with `?user=<id>` (`statisticsHref`) plus a small staff profile
  link; rows, IPs, domains, anonymous rows are not links;
- shared filters apply; granularity hidden, accepted and ignored;
- plain JSON array + pagination headers, no envelope; no chart.

## Steps

- [01 — Write the Visit list spec page](plan/01-write-visit-list-spec.md)
- [02 — Align the shared pages and the hub](plan/02-align-shared-pages.md)
- [03 — Create and record the implementation sub-issues](plan/03-create-implementation-issues.md)

## CI Checks

- Docs only; no CI job targets `docs/agents/specs/`. Check that relative links resolve
  (e.g. `grep -o '](\S*\.md[^)]*)'` and verify each target exists).

## Notes

- The architect owns this work: it touches only `docs/agents/` and creates GitHub issues;
  no specialist agent has code changes.
- Session id exposure for anonymous visits is new (other tabs only expose user ids); call
  it out in the access-control row so the `data-access` / `security` reviews of the
  implementation issues see it.
- "Ongoing" depends on request time, so it is computed server-side (one clock) rather than
  in the browser.
- Keep tie-break direction (`id` descending) consistent with the newest-first default;
  note in the spec that this differs from Users (user id ascending) on purpose.
