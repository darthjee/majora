# Backend Plan: Game content copy: Documents tab

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the `GET staff/copies/documents.json` row shape from [plan.md](plan.md#shared-contracts)
exactly (`id`, `name`, `hidden`, `photo`, `pages_count`, `photos_count`, `files_count`,
`copied_to_target`), and register the `documents` slug right after `recipes` in `COPY_TYPES`.

## Steps

- [01 — Document link builders](backend/01-document-link-builders.md)
- [02 — Document cache paths and copy-link hooks](backend/02-cache-paths-and-link-hooks.md)
- [03 — Documents copy type, serializer and registry](backend/03-documents-copy-type.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`,
  `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes
- Source of truth: `docs/agents/specs/game-content-copy/documents.md`. If this plan and the spec
  disagree, the spec wins.
- No migration: `GameDocument.copied_from` already exists (`games/migrations/0105_copied_from.py`).
- The copy is one transaction that only writes rows (no file I/O); there is no limit on pages,
  photos or files.
- Markdown URLs inside copied page `content` are intentionally not rewritten (known limitation
  in the spec).
