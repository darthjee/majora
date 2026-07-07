# Plan: Add max units treasure

Issue: [314-add-max-units-treasure.md](../../issues/314-add-max-units-treasure.md)

## Overview

Add a per-game stock cap to treasures shared via the `Game.treasures` many-to-many
connection. `Game.treasures` becomes an explicit `through` model (`GameTreasure`)
carrying a nullable `max_units` (GM-editable) and an internal `acquired_units`
(bookkeeping only). Acquire/sell logic reads and updates `acquired_units` on that
through-row and caps acquisitions at what's available instead of rejecting
over-requests outright. The derived `available_units` is exposed via the treasure
list serializer (used by both the acquire modal's browse list and the game's
treasure management list) so the frontend can badge limited treasures.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **`GameTreasure` through model** (backend-owned, `source/games/models/game_treasure.py`):
  `game` (FK `Game`), `treasure` (FK `Treasure`), `max_units` (nullable `PositiveIntegerField`,
  null = unlimited), `acquired_units` (`PositiveIntegerField`, default `0`, never directly
  user-editable). `Game.treasures` becomes `ManyToManyField('Treasure', through='GameTreasure', ...)`,
  keeping its current `related_name='linked_games'` / `related_query_name='linked_game'`.

- **`TreasureListSerializer`** (`source/games/serializers/treasure_list.py`) — used by both
  `GET /games/<slug>/treasures.json` (`game_treasures.py`, consumed by the game treasure
  management list **and** by the acquire modal's browse fetch — same endpoint, same client
  method `TreasureClient.fetchGameTreasuresPage`) and `GET /games/<slug>/treasures/all.json`
  (`game_treasures_all.py`). Gains two new fields, both computed relative to a `game` passed
  in serializer `context`:
  - `available_units` (`int|null`) — `max_units - acquired_units` for the (game, treasure)
    through-row when the treasure is linked to that game via the M2M; `null` when `max_units`
    is `null` (unlimited) or when the treasure is exclusive to the game (`Treasure.game` FK,
    which has no cap concept) or when no `game` is in context (e.g. the global
    `GET /treasures.json` list, which never has a single game to scope to).
  - `max_units` (`int|null`) — the through-row's `max_units`, `null` under the same conditions
    as above.
  - This requires `paginated_list_response` (`source/games/views/common.py`) to accept an
    optional `context` dict to pass through to the serializer constructor — currently it does
    not forward any context. `game_treasures.py` and `game_treasures_all.py` pass
    `context={'game': game}`; `treasures_list.py` (the global list) passes no context, so both
    fields serialize as `null` there.

- **Acquire endpoint contract** (`POST /games/<slug>/(pcs|npcs)/<id>/treasures/acquire.json`,
  `_treasure_exchange.py`): on success, in addition to the existing `quantity` (character's new
  total owned quantity) and `money` fields, the response gains an `acquired` field — the number
  of units actually acquired in *this* request, which may be less than the requested `quantity`
  when capped by `available_units` (partial fulfillment). Frontend may use `acquired` to inform
  the user when fewer units than requested were granted; it must not assume `acquired === quantity
  requested`.

- **Translation keys**: frontend references new keys under `game_treasures_page` (for the
  max/available units display on the management list) and `treasure_exchange_modal` (for the
  always-visible availability badge on the acquire browse list); translator adds them to both
  `en.yaml` and `pt.yaml`. Exact key names are listed in `frontend.md` / `translator.md` — backend
  has no dependency on these.

## Notes

- Only the shared `Game.treasures` M2M is in scope. The separate "exclusive" `Treasure.game` FK
  is explicitly out of scope (per the issue) and keeps its current unlimited-acquisition behavior.
- There is currently no application code path that creates a `Game`/`Treasure` M2M link — it's
  only reachable through Django's default admin M2M widget on `Game`. Converting to a `through`
  model breaks that default widget (Django admin cannot auto-render a widget for M2M fields with
  a custom `through` model with extra fields), so `source/games/admin.py` needs a
  `TabularInline` for `GameTreasure` to keep the link (and `max_units`) manageable from the
  admin — see `backend.md`.
- The game-scoped "treasure form" (`GameTreasureEditController` / `game_treasure_detail.py`,
  `PATCH /games/<slug>/treasures/<id>.json`) today only resolves **exclusive** treasures
  (`Treasure.objects.get(id=treasure_id, game=game)`) — it 404s for treasures linked via the
  M2M. Since the issue requires `max_units` to be "user-editable via the treasure form", this
  endpoint needs to also resolve M2M-linked treasures for the game and accept/update `max_units`
  on the through-row in that case (while exclusive treasures keep updating `name`/`value`/`hidden`
  as today) — see `backend.md` for the precise approach and `frontend.md` for the form field.
- After `backend` finishes, invoke `data-access` (new/changed serializer fields on an existing
  endpoint) and `security` (new user input handling: `max_units` becomes editable via a PATCH
  endpoint) before opening the PR, per the standard cross-cutting review flow. Update
  `docs/agents/access-control.md` if it documents `Game`/`Treasure`/serializer field exposure.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest --cov` (CI job: `pytest_all` /
  `pytest_views_rest` / `pytest_views_characters`, depending on which test paths are touched)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`,
  verifies `en.yaml`/`pt.yaml` key parity after translator's additions)
