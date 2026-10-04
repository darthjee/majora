# Plan: Access statistics: shared backend (aggregator, API conventions, domains endpoint)

Issue: [1498-access-statistics-shared-backend-aggregator-api-conventions-domains-endpoint.md](../../issues/1498-access-statistics-shared-backend-aggregator-api-conventions-domains-endpoint.md)

## Overview

This is backend-only groundwork for the access statistics page (#1477). It covers the range-cap
setting, the `statistics.aggregation` package (filters, params parser, granularity, bucket
calendar, visit query, series, metrics), the shared staff view helper (filter parsing and the
response envelope), the `GET /staff/statistics/domains.json` endpoint, and keeping
`staff-statistics.md` in sync. The `data-access`, `security` and `cache` agents review the result
(read-only).

See [backend.md](backend.md) for the full plan.
