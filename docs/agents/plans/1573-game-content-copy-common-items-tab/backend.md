# Backend Plan: Game content copy: Common items tab

Main plan: [plan.md](plan.md)

## Shared contracts

Produce `GET /staff/copies/common_items.json` rows `{id, name, category, price, hidden, photo,
copied_to_target}` (`photo` only when the cover is ready, `category` the raw choice value) and
`POST /staff/copies/common_items/<id>.json` returning the global `201 {id, links}` (0 or 1 cover
link). Register `common_items` right after `items` in `COPY_TYPES`.

## Steps

- [01 — Common items copy type and serializer](backend/01-common-items-copy-type.md)
- [02 — Common item cache paths and copy link hook](backend/02-cache-paths-and-copy-link.md)
- [03 — Tests](backend/03-tests.md)

## CI Checks
- `backend/`: `cd backend && poetry run pytest --cov` and `poetry run ruff check .`, run through
  docker-compose/make (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`,
  `checks`)

## Notes
- Common items have **no** character links: no `GameCharactersAvailableCachePaths`, unlike
  items.
- Recipes (#1574) will copy a recipe's common item under exactly these rules. Expose a public,
  transaction-agnostic entry point (see step 01) rather than leaving the logic private, but do
  not implement anything recipe-specific here.
- `GameRecipe` rows pointing at the source are not copied. Only the cover `photo` is linked;
  other `GameCommonItemPhoto` rows are ignored (fixed target path would collide).
