# Plan: Statistics dashboard: unique-visitors count endpoint

Issue: [1682-statistics-dashboard-unique-visitors-count-endpoint.md](../../issues/1682-statistics-dashboard-unique-visitors-count-endpoint.md)

## Overview

Add `GET staff/statistics/summary.json?period=day|week|month&tz=<IANA zone>`, a staff-only
endpoint that returns the unique-visitors count of a rolling window, computed with one SQL
aggregate. Every step belongs to the backend agent.

See [backend.md](backend.md) for the full plan.
