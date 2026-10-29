# Plan: Statistics bug: statistics:read scope and staff export endpoint (backend)

Issue: [1699-statistics-bug-statistics-read-scope-and-staff-export-endpoint-backend.md](../../issues/1699-statistics-bug-statistics-read-scope-and-staff-export-endpoint-backend.md)

## Overview

Add a read-only, staff-only `statistics:read` scope and a single staff export endpoint,
`GET staff/statistics/export.json`, that a scoped token carrying that scope may reach through an
exact-route carve-out of the `staff/` exclusion. The endpoint returns raw statistics sessions and
their visits, is never cached and never tracked by `StatisticsSessionMiddleware`. The contract is
`docs/agents/specs/statistics-bug/export-endpoint.md`.

See [backend.md](backend.md) for the full plan.
