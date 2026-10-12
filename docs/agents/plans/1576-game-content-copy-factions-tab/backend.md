# Backend Plan: Game content copy: Factions tab

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce:
- `GET /staff/copies/factions.json?from=&to=` rows `id`, `name`, `photo` (path only when ready, else null), `copied_to_target`, `name_taken_in_target` (bool).
- `POST /staff/copies/factions/<id>.json {target}` → `201 {id, links}` (0 or 1 cover link) or `422 {"errors": {"name": ["unique"]}}` with nothing created and no `X-Cache-Clear`.

## Steps

- [01 — Serializer and cache paths](backend/01-serializer-and-cache-paths.md)
- [02 — Factions copy type](backend/02-factions-copy-type.md)
- [03 — Cover link finalize cache paths](backend/03-cover-link-finalize.md)
- [04 — Tests](backend/04-tests.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest` and `docker-compose run --rm majora_tests ruff check .`

## Notes
- Spec: `docs/agents/specs/game-content-copy/factions.md` (wins over this plan on disagreement).
- Reference implementation: the Possessions tab (commit 79fa3d2a).
