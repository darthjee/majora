# Plan: Access statistics: Visitors endpoint (visitors.json)

Issue: [1509-access-statistics-visitors-endpoint-visitors-json.md](../../issues/1509-access-statistics-visitors-endpoint-visitors-json.md)

## Overview
Add `GET /staff/statistics/visitors.json`, the backend of the access statistics Visitors tab. It needs a new `FirstVisits` lookup class and a `VisitorsSeries` aggregator, and the view mirrors `staff_statistics_visits.py`. The architect updates `docs/agents/access-control/staff-statistics.md` once the backend work is in. The endpoint is not added to the Navi warm-up chain.

See [backend.md](backend.md) for the full plan.
