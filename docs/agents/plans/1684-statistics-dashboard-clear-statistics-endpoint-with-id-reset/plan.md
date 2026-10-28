# Plan: Statistics dashboard: clear statistics endpoint with ID reset

Issue: [1684-statistics-dashboard-clear-statistics-endpoint-with-id-reset.md](../../issues/1684-statistics-dashboard-clear-statistics-endpoint-with-id-reset.md)

## Overview

Add the staff-only `DELETE staff/statistics.json` endpoint. It wipes every statistics visit
and session in batches, resets both tables' auto-increment counters, returns the deleted counts
and writes one audit line per run. Backend only.

See [backend.md](backend.md) for the full plan.
