# Backend Plan: Plain (AllowAny) routes must never serve hidden content to editors

Main plan: [plan.md](plan.md)

## Shared contracts

The backend produces everything in [plan.md's Shared contracts](plan.md#shared-contracts): the
strict gate on every listed plain GET, and the two new restricted routes
`GET /games/<slug>/npcs/<id>/photos/all.json` (CharacterEdit) and
`GET /games/<slug>/treasures/<treasure_id>/full.json` (GameEdit, adds `hidden`).

## Steps

- [01 — Make the hidden gate strict on plain GETs](backend/01-strict-gate-on-plain-gets.md)
- [02 — Add the missing restricted siblings](backend/02-add-restricted-siblings.md)
- [03 — Survey and regression tests](backend/03-survey-and-tests.md)
- [04 — Update the access-control docs](backend/04-access-control-docs.md)

## CI Checks

- `backend`: `make tests`, then inside the container
  `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`),
  `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`), `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)
- lint/style: CI job `checks`
- docs: CI job `markdownlint`

## Notes

- The plain detail routes serve both GET and the narrow PATCH (`npcs/<id>.json`,
  `items/<item_id>.json`, `games/<slug>/treasures/<id>.json`), so the strict gate must depend on
  the request method (strict only on `GET`) and not only on the route.
- The strict 404 keeps `X-Skip-Cache: true`. The proxy cache cleanup does not clear every plain
  nested route when an NPC's `hidden` flag changes, so a cached 404 could outlive un-hiding. The
  header is now the same for every viewer, so it is no longer a role-based deviation.
- No proxy or navi change is expected. Navi warms plain routes as an anonymous caller, which
  already gets 404 on a hidden NPC. The new restricted routes send `X-Skip-Cache`, so the shared
  cache never stores them. Confirm this during review; don't edit `navi/` or `proxy/` unless the
  review finds an assumption.
- `access.json` / `/permissions/*.json` are per-viewer status endpoints by design and expose no
  hidden content. Leave them as they are, but mention them in the survey (step 03).
