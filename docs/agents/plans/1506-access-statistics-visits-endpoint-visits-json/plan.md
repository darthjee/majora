# Plan: Access statistics: Visits endpoint (visits.json)

Issue: [1506-access-statistics-visits-endpoint-visits-json.md](../../issues/1506-access-statistics-visits-endpoint-visits-json.md)

## Overview

Add `GET /staff/statistics/visits.json`: a staff-only, uncached endpoint returning visits started per
time bucket, split into `anonymous` / `logged_in` (`visits` = their sum), in the shared
`{filters, buckets, totals}` envelope. The counting lives in a new `VisitsSeries` aggregation class
built on the shared #1498 pieces (`VisitQuery`, `BucketCalendar`, `Series`, `metrics`); the view
stays thin. Backend only: the frontend is #1507, and no Navi change is needed.

See [backend.md](backend.md) for the full plan.
