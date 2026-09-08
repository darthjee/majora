# Plan: Backend — implement /staff/crawler.json debug endpoint

Issue: [1273-backend---implement--staff-crawler-json-debug-endpoint.md](../issues/1273-backend---implement--staff-crawler-json-debug-endpoint.md)

## Overview

Add a temporary, staff-only debug harness for crawler-emitted JSON: a new
`CrawlerDebugEmission` model, a cursor (`last_id`) pagination helper, and
`POST`/`GET /staff/crawler.json` endpoints, following the existing
`backend/staff/views/` flat-file pattern (`staff_cache_summary.py` /
`staff_cache_clear.py`).

See [backend.md](backend.md) for the full plan.
