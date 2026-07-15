# Plan: Add game types

Issue: [454-add-game-types.md](../issues/454-add-game-types.md)

## Overview

Add a `game_type` field to the `Game` model (`dnd` default, plus `deadlands`), following
the existing choices-field convention used by `Character.allegiance`. The value is chosen
via a dropdown on the game creation form only — it is fixed once the game is created (no
edit-form/list exposure), but is included in `GameDetailSerializer` for other API
consumers. The dropdown's option labels ("D&D" / "Deadlands") are intentionally not
translated; only the field's own label is.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Model field (backend produces, frontend/translator consume indirectly via the API)

`Game.game_type` — `CharField(max_length=16, choices=GAME_TYPE_CHOICES, default=GAME_TYPE_DND)`,
with constants `GAME_TYPE_DND = 'dnd'` and `GAME_TYPE_DEADLANDS = 'deadlands'`, mirroring
`Character.ALLEGIANCE_*` in `backend/games/models/character/character.py:14-22`.

| database value | value in the UI |
| --------------- | ---------------- |
| dnd | D&D |
| deadlands | Deadlands |

The UI-facing labels above are a **frontend-only** concern (rendered directly in JSX, not
via Django `choices` labels, and not translated) — the Django `choices` labels are only
used for the admin/DRF browsable API and can reuse the same strings.

### `POST /games.json` (backend produces, frontend consumes)

`GameCreateSerializer` gains an optional `game_type` field (`required: False`, same
pattern as `description`). If omitted, the model default (`dnd`) applies. Frontend always
sends it explicitly (the dropdown has no blank option), defaulting its own local state to
`'dnd'`.

### `GET /games/<slug>.json` (backend produces)

`GameDetailSerializer` gains a `game_type` field in its `fields` list, returned as the raw
DB value (`dnd` / `deadlands`) — no UI label translation happens server-side.
`GameUpdateSerializer` and `GameListSerializer` are **not** changed (type is fixed at
creation and not shown in list views).

### Translation key (translator produces, frontend consumes via `Translator.t()`)

`game_new_page.game_type_label` is added to `frontend/assets/i18n/en.yaml` and `pt.yaml`
(existing `game_new_page` namespace, alongside `name_label`/`description_label`). This is
the **only** new translation key — the two option labels ("D&D" / "Deadlands") are
hardcoded, untranslated strings in the frontend component, per the issue.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No new endpoint, no access/ownership change, no new entity — `product-owner`,
  `data-access`, and `security` review is not expected to be needed for this issue, but
  `data-access` may still be worth a quick look since `GameDetailSerializer`'s field list
  is changing (adding a field, not removing/loosening access).
