# Plan: Access statistics: Duration endpoint (duration.json)

Issue: [1513-access-statistics-duration-endpoint-duration-json.md](../../issues/1513-access-statistics-duration-endpoint-duration-json.md)

## Overview

Backend-only: a `DurationSeries` aggregator plus a thin `GET /staff/statistics/duration.json` view,
following the Visits / Visitors pattern, with the per-visit duration helper shared with
Overview and the access-control row added.

See [backend.md](backend.md) for the full plan.
