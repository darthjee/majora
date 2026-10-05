# Plan: Access statistics: Domains summary endpoint (domains/summary.json)

Issue: [1516-access-statistics-domains-summary-endpoint-domains-summary-json.md](../../issues/1516-access-statistics-domains-summary-endpoint-domains-summary-json.md)

## Overview

Add the staff-only `GET /staff/statistics/domains/summary.json` endpoint of the access statistics Domains tab: a `DomainsSummary` aggregation (one `VisitQuery` pass plus one `Domain` query) returning per-domain rows (every configured domain zero-filled, "unknown" last) and `totals` over all matched visits, a thin view in the `staff` app, and the access-control doc row. Backend only; the frontend is #1517.

See [backend.md](backend.md) for the full plan.
