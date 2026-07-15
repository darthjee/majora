# Plan: Add currency types

Issue: [455-add-currency-types.md](../issues/455-add-currency-types.md)

## Overview

Depends on #454 landing first (`Game.game_type`, `dnd`/`deadlands`). This issue makes
money/treasure currency follow that type. Backend adds a `Treasure.game_type` field
(same choices as `Game.game_type`), fixed at creation: forced to the owning game's type
when a treasure is created inside a game, chosen via a dropdown when created standalone.
Frontend adds a `DeadlandsMoneyModel` to the existing `MoneyModelRegistry`
(`frontend/assets/js/utils/money/`), renames the shared D&D-flavored money display/edit
components to system-agnostic names, and rewires every affected page/modal to resolve the
money model from the relevant game's/treasure's `game_type` instead of the hardcoded
`'dnd'` string. `Character.money`'s currency type is derived live from the character's own
game — no new field there.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `Treasure.game_type` (backend produces, frontend consumes)

New field, same shape as `Game.game_type` from #454 — reuse `Game.GAME_TYPE_CHOICES` /
`Game.GAME_TYPE_DND` rather than redefining the choice list:

```python
game_type = models.CharField(
    max_length=16, choices=Game.GAME_TYPE_CHOICES, default=Game.GAME_TYPE_DND
)
```

- `POST /games/<slug>/treasures.json` (game-exclusive treasure,
  `backend/games/views/games/game_treasures.py:_create_game_treasure`): the view forces
  `game_type` to `game.game_type` via `serializer.save(game=game, game_type=game.game_type)`
  — any client-provided `game_type` is silently overridden (DRF's `.save(**kwargs)` wins
  over `validated_data`), matching "no choice option for type" in this flow.
- `POST /treasures.json` (standalone treasure,
  `backend/games/views/treasures/treasures_list.py:_create_treasure`): `TreasureCreateSerializer`
  accepts an optional `game_type` from the client (default `dnd` if omitted) — this is
  where the frontend's new dropdown value goes.
- `TreasureDetailSerializer` and `TreasureListSerializer` both add `game_type` to their
  `fields` list, since the frontend money components need it to resolve the right model.
  `TreasureUpdateSerializer` is **not** changed (type is fixed at creation, matching the
  issue's "no edit").

### `MoneyModelRegistry` (frontend-internal, both `frontend` agent's own steps)

`frontend/assets/js/utils/money/MoneyModelRegistry.js` already exists as a `name ->
model class` registry with `register`/`resolve`, currently seeded only with
`DndMoneyModel` under `'dnd'`. This issue adds a `DeadlandsMoneyModel` registered under
`'deadlands'`, and replaces every hardcoded `MoneyModelRegistry.resolve('dnd')` call site
with `MoneyModelRegistry.resolve(gameType)`, where `gameType` is threaded down from
whichever game/treasure is in scope on that page.

**Important constraint**: `CoinBreakdown`/`CoinPacker`
(`frontend/assets/js/utils/money/{CoinBreakdown,CoinPacker}.js`) hardcode a base-10
conversion between consecutive denominations (`remaining % 10`, `Math.floor(remaining /
10)`, `10 ** index` weighting) — this is baked into the cascade arithmetic itself, not
just the `cascadeThreshold` config. Deadlands' 100-cents-per-dollar ratio does **not**
fit this (verified: feeding `{denominations: ['cents', 'dollars'], cascadeThreshold:
100}` into `CoinBreakdown` produces wrong quantities, e.g. 250 cents breaks down to `{cents:
90, ...}` instead of `{cents: 50, dollars: 2}`). `DeadlandsMoneyModel` must **not** reuse
`CoinBreakdown`/`CoinPacker` as-is — see `frontend.md` for the two options.

### Currency labels (translator produces, frontend consumes)

New Deadlands-specific translation keys (cents/dollars abbreviations and any
gems-equivalent overflow label, if Deadlands ends up needing one) live alongside the
existing `money.*` namespace (`frontend/assets/i18n/en.yaml:370-384`). `frontend.md` and
`translator.md` share the exact key names — see `translator.md` for the list.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — PC/NPC money edit modal flows live under `games/tests/views/game/`
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Hard dependency on #454: `Game.game_type` (and its migration) must exist before this
  issue's backend work starts, since `Treasure.game_type` reuses `Game.GAME_TYPE_CHOICES`.
  If #454 hasn't merged yet when this is implemented, that migration's number determines
  this issue's migration's `dependencies`.
- This is a large, cross-cutting issue by design (kept as one issue per discussion) — the
  registry + rename + all ~15 call sites must land together so D&D behavior keeps working
  throughout rather than breaking mid-refactor.
- No new endpoint, no ownership/access change — `data-access`/`security` review isn't
  expected to be load-bearing here, but the `TreasureDetailSerializer`/`TreasureListSerializer`
  field addition is a visibility change worth a quick look.
