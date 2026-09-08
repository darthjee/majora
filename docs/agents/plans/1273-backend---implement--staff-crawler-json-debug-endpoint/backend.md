# Backend Plan: Backend — implement /staff/crawler.json debug endpoint

Main plan: [plan.md](plan.md)

## Steps

- [01 — CrawlerDebugEmission model + migration](backend/01-model-and-migration.md)
- [02 — Cursor pagination helper](backend/02-cursor-paginator.md)
- [03 — POST/GET /staff/crawler.json endpoints](backend/03-endpoints.md)
- [04 — Access control doc](backend/04-access-control-doc.md)
- [05 — Crawler service-account staff check](backend/05-crawler-service-account-check.md)
- [06 — Tests](backend/06-tests.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: backend tests)
- `backend`: `docker-compose run --rm majora_backend ruff check .` (CI job: backend lint)

## Notes

- Depends on the spec doc `docs/agents/specs/crawler-test-harness.md` (landed via #1272)
  for the exact wire contract — this plan follows it as the source of truth for
  pagination/eviction semantics.
- Retention cap (200) and page size (50) are plain module-level constants, not Django
  settings — this is a temporary debug harness (deleted once #1262 is proven), not a
  long-lived tunable surface.
- Out of scope (sibling sub-issues): frontend page (#1274), summary/clear endpoints
  (#1275), the real crawler-import upsert logic (#1262).
