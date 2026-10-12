# Backend Plan: Game content copy: Recipes tab

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the `GET`/`POST /staff/copies/recipes*.json` endpoints and the `recipes` registry entry
exactly as in [plan.md](plan.md#shared-contracts).

## Steps

- [01 — Recipe list row serializer](backend/01-list-serializer.md)
- [02 — Recipes copy type with common item resolution](backend/02-recipes-copy-type.md)
- [03 — Cache paths](backend/03-cache-paths.md)
- [04 — Registry and tests](backend/04-registry-and-tests.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest staff` and the backend lint (see `AGENTS.md`)

## Notes
- `GameRecipe` already has `copied_from` (#1568); no migration is needed.
- Specs win over this plan on any disagreement (`docs/agents/specs/game-content-copy/recipes.md`).
- Out of scope: the regular recipe create/update views sending no `X-Cache-Clear`.
