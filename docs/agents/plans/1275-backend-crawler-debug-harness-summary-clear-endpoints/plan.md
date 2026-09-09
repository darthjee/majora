# Plan: Backend — crawler debug harness summary + clear endpoints

Issue: [1275-backend-crawler-debug-harness-summary-clear-endpoints.md](../../issues/1275-backend-crawler-debug-harness-summary-clear-endpoints.md)

## Overview

Add two staff-only endpoints to the temporary crawler debug harness (spec:
`docs/agents/specs/crawler-test-harness.md`), on top of the `CrawlerDebugEmission`
model and `staff_crawler` view already shipped by #1273: `GET /staff/crawler/summary.json`
(per-`type` entry counts) and `DELETE /staff/crawler.json` (blanket table clear,
`204`). Both copy the `staff_cache_summary` / `staff_cache_clear` precedent
exactly. All work is within the `backend/` `staff` app plus one access-control
doc — no other agent is involved.

See [backend.md](backend.md) for the full plan.
